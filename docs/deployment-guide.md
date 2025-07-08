# Deployment Guide

Complete deployment setup for FunFreq AI Ops. Get your app running in production with Vercel.

## Pre-Deployment Checklist

- [ ] Supabase project created and configured
- [ ] All API keys obtained and tested locally
- [ ] Database schema deployed
- [ ] Storage buckets created
- [ ] Meta API permissions approved
- [ ] Domain name ready (optional)

## Vercel Deployment

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Connect Your Repository

If using GitHub:
```bash
# Push your code to GitHub first
git add .
git commit -m "Ready for deployment"
git push origin main

# Then connect to Vercel
vercel --prod
```

Or deploy directly:
```bash
vercel --prod
```

### 3. Configure Environment Variables

In your Vercel dashboard or via CLI:

```bash
# Core Next.js vars
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Server-side vars
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ASSEMBLYAI_API_KEY
vercel env add OPENAI_API_KEY

# Publishing APIs
vercel env add META_ACCESS_TOKEN
vercel env add META_PAGE_ID
vercel env add META_INSTAGRAM_ID
vercel env add TIKTOK_ACCESS_TOKEN
vercel env add YOUTUBE_API_KEY

# Optional
vercel env add DROPBOX_ACCESS_TOKEN
vercel env add STRIPE_WEBHOOK_SECRET
```

### 4. Vercel Configuration

Create `vercel.json`:
```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 60
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 5. Build Configuration

Update `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: [
      'your-supabase-project.supabase.co',
      'dropbox.com',
      'your-domain.com'
    ]
  },
  
  // API routes timeout
  api: {
    responseLimit: '10mb',
    bodyParser: {
      sizeLimit: '50mb'
    }
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  }
}

module.exports = nextConfig
```

## Domain Setup

### 1. Custom Domain (Optional)

In Vercel dashboard:
1. Go to Settings → Domains
2. Add your domain (e.g., `funfreq-ops.com`)
3. Configure DNS records as shown

### 2. SSL Certificate

Vercel automatically provisions SSL certificates. No action needed.

## Database Production Setup

### 1. Supabase Production Settings

1. **Enable** Point-in-Time Recovery
2. **Set up** database backups
3. **Configure** connection pooling:
   ```sql
   -- In Supabase SQL Editor
   ALTER DATABASE postgres SET max_connections = 100;
   ```

### 2. Connection String

For external tools, use the connection pooler:
```
postgresql://postgres:[password]@[host]:6543/postgres?pgbouncer=true
```

### 3. Performance Optimization

```sql
-- Add useful indexes
CREATE INDEX CONCURRENTLY idx_videos_status_created ON videos(status, created_at DESC);
CREATE INDEX CONCURRENTLY idx_posts_video_platform ON posts(video_id, platform);

-- Analyze tables
ANALYZE videos;
ANALYZE posts;
ANALYZE donations;
```

## API Rate Limits & Optimization

### 1. AssemblyAI

```javascript
// lib/api/rate-limiter.js
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.requests = []
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  async canMakeRequest() {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    
    if (this.requests.length >= this.maxRequests) {
      const waitTime = this.requests[0] + this.windowMs - now
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.requests.push(now)
    return true
  }
}

export const assemblyAILimiter = new RateLimiter(100, 60000) // 100 requests per minute
```

### 2. OpenAI

```javascript
// lib/api/openai-with-retry.js
export async function generateCaptionWithRetry(transcript, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateCaption(transcript)
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 1000 // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, waitTime))
        continue
      }
      throw error
    }
  }
}
```

## Monitoring & Logging

### 1. Error Tracking

Install Sentry:
```bash
npm install @sentry/nextjs
```

Configure `sentry.client.config.js`:
```javascript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
})
```

### 2. Logging

Create centralized logger:
```javascript
// lib/logger.js
export const logger = {
  info: (message, data = {}) => {
    console.log(`[INFO] ${message}`, data)
    // Send to external service if needed
  },
  
  error: (message, error = {}) => {
    console.error(`[ERROR] ${message}`, error)
    // Send to Sentry or similar
  },
  
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data)
    }
  }
}
```

### 3. Health Checks

Create health check endpoint:
```javascript
// pages/api/health.js
import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  try {
    // Check database
    const { error: dbError } = await supabase.from('videos').select('id').limit(1)
    if (dbError) throw new Error('Database connection failed')
    
    // Check external APIs
    const checks = {
      database: 'healthy',
      assemblyai: process.env.ASSEMBLYAI_API_KEY ? 'configured' : 'missing',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
      meta: process.env.META_ACCESS_TOKEN ? 'configured' : 'missing'
    }
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    })
  }
}
```

## Security Configuration

### 1. CORS Headers

```javascript
// middleware.js
import { NextResponse } from 'next/server'

export function middleware(request) {
  const response = NextResponse.next()
  
  // Set security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}

export const config = {
  matcher: '/api/:path*'
}
```

### 2. API Route Protection

```javascript
// lib/auth/middleware.js
export function withAuth(handler) {
  return async (req, res) => {
    // Add authentication logic here
    // For internal tool, could be simple token or IP whitelist
    
    const authToken = req.headers.authorization
    if (!authToken || authToken !== `Bearer ${process.env.INTERNAL_API_TOKEN}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    return handler(req, res)
  }
}

// Usage in API routes
// export default withAuth(async function handler(req, res) { ... })
```

## Performance Optimization

### 1. Caching Strategy

```javascript
// lib/cache.js
const cache = new Map()

export function withCache(key, ttl = 300000) { // 5 minutes default
  return function(target, propertyName, descriptor) {
    const method = descriptor.value
    
    descriptor.value = async function(...args) {
      const cacheKey = `${key}-${JSON.stringify(args)}`
      
      if (cache.has(cacheKey)) {
        const { data, timestamp } = cache.get(cacheKey)
        if (Date.now() - timestamp < ttl) {
          return data
        }
      }
      
      const result = await method.apply(this, args)
      cache.set(cacheKey, { data: result, timestamp: Date.now() })
      
      return result
    }
  }
}
```

### 2. Image Optimization

```javascript
// next.config.js additions
module.exports = {
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  }
}
```

## Backup Strategy

### 1. Database Backups

Create backup script:
```bash
#!/bin/bash
# scripts/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE

# Upload to S3 or similar
aws s3 cp $BACKUP_FILE s3://your-backup-bucket/

# Keep only last 30 days
find . -name "backup_*.sql" -mtime +30 -delete
```

### 2. Automated Backups

Add to your CI/CD:
```yaml
# .github/workflows/backup.yml
name: Database Backup
on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Backup Database
        run: ./scripts/backup-db.sh
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## CI/CD Pipeline

### 1. GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### 2. Testing in Production

```javascript
// scripts/prod-test.js
const tests = [
  {
    name: 'Health Check',
    url: 'https://your-app.vercel.app/api/health',
    expect: (res) => res.status === 'healthy'
  },
  {
    name: 'API Endpoints',
    url: 'https://your-app.vercel.app/api/videos',
    expect: (res) => Array.isArray(res)
  }
]

async function runProdTests() {
  for (const test of tests) {
    try {
      const response = await fetch(test.url)
      const data = await response.json()
      
      if (test.expect(data)) {
        console.log(`✅ ${test.name} passed`)
      } else {
        console.log(`❌ ${test.name} failed`)
      }
    } catch (error) {
      console.log(`❌ ${test.name} error:`, error.message)
    }
  }
}

runProdTests()
```

## Post-Deployment

### 1. DNS Configuration

```bash
# Check DNS propagation
dig your-domain.com

# Test SSL
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

### 2. Performance Testing

```bash
# Install lighthouse
npm install -g lighthouse

# Test performance
lighthouse https://your-app.vercel.app --output=json --output-path=./lighthouse-results.json
```

### 3. Monitoring Setup

Set up alerts for:
- API response times > 5 seconds
- Error rates > 5%
- Database connections > 80%
- Failed uploads or publishes

---

Your app is now deployed and ready for production! 🚀

Monitor the health endpoint and set up alerts for any issues.