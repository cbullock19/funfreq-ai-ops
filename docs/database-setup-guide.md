# Database Setup Guide

Complete Supabase setup for FunFreq AI Ops. Follow these steps to get your database configured properly.

## 1. Supabase Project Setup

1. Go to [supabase.com](https://supabase.com) and create new project
2. Choose a name like "funfreq-ai-ops"
3. Generate a strong database password
4. Wait for project to provision (2-3 minutes)

## 2. Get Your Credentials

From your Supabase dashboard:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # for admin operations
```

## 3. Database Schema

Run these in your Supabase SQL Editor (Dashboard → SQL Editor → New Query):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Videos table
CREATE TABLE videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  duration INTEGER, -- in seconds
  transcript TEXT,
  transcript_confidence DECIMAL(3,2), -- 0.00 to 1.00
  ai_caption TEXT,
  ai_hashtags TEXT[],
  final_caption TEXT, -- user-edited version
  final_hashtags TEXT[],
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'transcribing', 'generating', 'ready', 'publishing', 'posted', 'error')),
  platforms TEXT[] DEFAULT '{}', -- which platforms to post to
  error_message TEXT, -- if something goes wrong
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table (tracks published content)
CREATE TABLE posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'youtube')),
  post_url TEXT,
  post_id TEXT, -- platform's internal ID
  caption_used TEXT, -- what caption was actually posted
  hashtags_used TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed')),
  
  -- Analytics (updated periodically)
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  
  posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_analytics_update TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Donations table (for attribution tracking)
CREATE TABLE donations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  stripe_payment_id TEXT UNIQUE,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT, -- can be video ID
  donor_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform settings (store API credentials securely)
CREATE TABLE platform_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  platform TEXT UNIQUE NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'youtube')),
  access_token TEXT, -- encrypted
  refresh_token TEXT, -- encrypted
  page_id TEXT,
  business_id TEXT,
  default_hashtags TEXT[],
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 4. Create Indexes for Performance

```sql
-- Video queries
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX idx_videos_platforms ON videos USING GIN(platforms);

-- Post queries
CREATE INDEX idx_posts_video_id ON posts(video_id);
CREATE INDEX idx_posts_platform ON posts(platform);
CREATE INDEX idx_posts_posted_at ON posts(posted_at DESC);

-- Donation queries
CREATE INDEX idx_donations_video_id ON donations(video_id);
CREATE INDEX idx_donations_stripe_id ON donations(stripe_payment_id);
CREATE INDEX idx_donations_created_at ON donations(created_at DESC);
```

## 5. Row Level Security (RLS)

Since this is an internal tool, we'll keep RLS simple:

```sql
-- Enable RLS on all tables
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (your team)
CREATE POLICY "Allow all for authenticated users" ON videos FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON posts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON donations FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON platform_settings FOR ALL TO authenticated USING (true);

-- Allow service role full access (for API operations)
CREATE POLICY "Allow all for service role" ON videos FOR ALL TO service_role USING (true);
CREATE POLICY "Allow all for service role" ON posts FOR ALL TO service_role USING (true);
CREATE POLICY "Allow all for service role" ON donations FOR ALL TO service_role USING (true);
CREATE POLICY "Allow all for service role" ON platform_settings FOR ALL TO service_role USING (true);
```

## 6. Storage Setup

Create storage bucket for videos:

```sql
-- Create videos bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'videos');

-- Allow public read access
CREATE POLICY "Allow public read" ON storage.objects FOR SELECT USING (bucket_id = 'videos');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'videos');
```

## 7. Database Functions

Useful functions for common operations:

```sql
-- Update video status
CREATE OR REPLACE FUNCTION update_video_status(video_uuid UUID, new_status TEXT)
RETURNS void AS $$
BEGIN
  UPDATE videos 
  SET status = new_status, updated_at = NOW()
  WHERE id = video_uuid;
END;
$$ LANGUAGE plpgsql;

-- Get video with posts
CREATE OR REPLACE FUNCTION get_video_with_posts(video_uuid UUID)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'video', row_to_json(v.*),
    'posts', COALESCE(array_agg(row_to_json(p.*)) FILTER (WHERE p.id IS NOT NULL), '{}')
  )
  INTO result
  FROM videos v
  LEFT JOIN posts p ON v.id = p.video_id
  WHERE v.id = video_uuid
  GROUP BY v.id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Analytics summary
CREATE OR REPLACE FUNCTION get_analytics_summary()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_videos', COUNT(DISTINCT v.id),
    'total_posts', COUNT(p.id),
    'total_impressions', COALESCE(SUM(p.impressions), 0),
    'total_donations', COALESCE(SUM(d.amount), 0),
    'platforms', json_object_agg(p.platform, COUNT(p.id))
  )
  INTO result
  FROM videos v
  LEFT JOIN posts p ON v.id = p.video_id
  LEFT JOIN donations d ON v.id = d.video_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

## 8. Supabase Client Setup

Install the client:
```bash
npm install @supabase/supabase-js
```

Create client utility:
```javascript
// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations that need elevated permissions
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
```

## 9. TypeScript Types

Generate types from your schema:
```bash
npx supabase gen types typescript --project-id your-project-id > types/database.types.ts
```

Or manually create types:
```typescript
// types/database.ts
export interface Video {
  id: string
  title: string
  file_url: string
  file_size?: number
  duration?: number
  transcript?: string
  transcript_confidence?: number
  ai_caption?: string
  ai_hashtags?: string[]
  final_caption?: string
  final_hashtags?: string[]
  status: 'uploaded' | 'transcribing' | 'generating' | 'ready' | 'publishing' | 'posted' | 'error'
  platforms: string[]
  error_message?: string
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  video_id: string
  platform: 'instagram' | 'facebook' | 'tiktok' | 'youtube'
  post_url?: string
  post_id?: string
  caption_used?: string
  hashtags_used?: string[]
  status: 'pending' | 'posted' | 'failed'
  impressions: number
  clicks: number
  likes: number
  shares: number
  comments: number
  posted_at: string
  last_analytics_update: string
}

export interface Donation {
  id: string
  video_id?: string
  post_id?: string
  amount: number
  stripe_payment_id?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  donor_email?: string
  created_at: string
}
```

## 10. Test Your Setup

Create a test script:
```javascript
// scripts/test-db.js
import { supabase } from '../lib/supabase.js'

async function testDatabase() {
  try {
    // Test connection
    const { data, error } = await supabase.from('videos').select('*').limit(1)
    
    if (error) {
      console.error('Database connection failed:', error)
      return
    }
    
    console.log('✅ Database connected successfully')
    console.log('Videos in database:', data.length)
    
    // Test storage
    const { data: buckets } = await supabase.storage.listBuckets()
    console.log('✅ Storage buckets:', buckets.map(b => b.name))
    
  } catch (err) {
    console.error('Test failed:', err)
  }
}

testDatabase()
```

Run it:
```bash
node scripts/test-db.js
```

## 11. Migrations (Optional)

If you want proper migration management, create migration files:

```sql
-- migrations/001_initial_schema.sql
-- Copy all the CREATE TABLE statements from above

-- migrations/002_add_analytics.sql
-- Future schema changes go here
```

## Backup Strategy

Supabase automatically backs up your database, but for extra safety:

1. Enable Point-in-Time Recovery in Supabase dashboard
2. Set up weekly database dumps:
```bash
# Add to your CI/CD or run manually
pg_dump "postgresql://postgres:[password]@[host]:5432/postgres" > backup.sql
```

---

**Next Steps:**
1. Run all the SQL commands above
2. Test the connection with the test script
3. Start building your API routes with the Supabase client

Your database is now ready to handle the entire FunFreq content pipeline!