# Multi-Platform Analytics System Guide

Complete guide to the FunFreq AI Ops analytics system that provides real-time performance insights across Facebook, Instagram, TikTok, and YouTube.

## 🎯 Overview

The analytics system is designed to be:
- **Scalable**: Supports all major social media platforms
- **Real-time**: Automatic updates after publishing and scheduled refreshes
- **Comprehensive**: Tracks views, engagement, reach, and platform-specific metrics
- **Extensible**: Easy to add new platforms and metrics

## 🏗 Architecture

### Core Components

1. **Analytics Types** (`lib/analytics/types.ts`)
   - TypeScript interfaces for all analytics data
   - Platform-specific metric definitions
   - Standardized data structures

2. **Platform Implementations**
   - `lib/analytics/facebook.ts` - Facebook Graph API integration
   - Future: Instagram, TikTok, YouTube implementations

3. **API Endpoints**
   - `/api/analytics` - Fetch analytics data
   - `/api/analytics/update` - Trigger analytics updates

4. **Database Schema** (`analytics_schema.sql`)
   - Multi-platform analytics storage
   - Performance optimization with indexes
   - Caching for dashboard performance

5. **React Hooks** (`lib/analytics/hooks.ts`)
   - `useAnalytics()` - Main analytics hook
   - `useAnalyticsSummary()` - Dashboard summary
   - `usePlatformAnalytics()` - Platform-specific data

## 📊 Facebook Analytics Implementation

### Current Status: ✅ **ACTIVE**

Facebook analytics are fully implemented and working with:
- Page insights (overall performance)
- Post insights (individual post metrics)
- Video metrics (views, watch time, demographics)
- Automatic updates after publishing

### Required Permissions

Ensure your Facebook access token has these permissions:
- `pages_read_engagement` ✅ (already have)
- `pages_show_list` ✅ (already have)
- `pages_read_user_content` (may need to add)

### Environment Variables

```bash
META_ACCESS_TOKEN=your_facebook_access_token
META_PAGE_ID=your_facebook_page_id
```

### Metrics Collected

**Base Metrics (all posts):**
- Impressions
- Reach
- Engagement
- Clicks
- Shares
- Comments
- Likes
- Views

**Facebook-Specific Metrics:**
- Video views and watch time
- Reaction breakdown (like, love, haha, wow, sad, angry)
- Organic vs paid reach
- Unique viewers
- Video completion rates

## 🚧 Coming Soon: Other Platforms

### Instagram Analytics
**Status**: 🚧 **Coming Soon**

**Required Setup:**
- Instagram Business Account
- Facebook Business Manager connection
- `instagram_basic` and `instagram_content_publish` permissions

**Metrics to Collect:**
- Saves and bookmarks
- Reach from hashtags, explore, profile
- Video completion rates
- Story metrics (when implemented)

### TikTok Analytics
**Status**: 🚧 **Coming Soon**

**Required Setup:**
- TikTok Business Account
- Business verification approval
- TikTok Business API access

**Metrics to Collect:**
- Video views and watch time
- Unique viewers
- Shares and comments
- Bookmark counts
- Trending performance

### YouTube Analytics
**Status**: 🚧 **Coming Soon**

**Required Setup:**
- YouTube Data API v3
- OAuth 2.0 credentials
- Channel access

**Metrics to Collect:**
- Views and watch time
- Subscriber changes
- Like/dislike ratios
- Comment engagement
- Traffic sources

## 🗄 Database Schema

### Analytics Table
```sql
CREATE TABLE analytics (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  platform TEXT NOT NULL,
  platform_post_id TEXT NOT NULL,
  
  -- Base metrics
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  watch_time_seconds INTEGER DEFAULT 0,
  
  -- Platform-specific JSON data
  facebook_metrics JSONB,
  instagram_metrics JSONB,
  tiktok_metrics JSONB,
  youtube_metrics JSONB,
  
  -- Metadata
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_update_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(platform_post_id, platform, period_start)
);
```

### Analytics Configuration
```sql
CREATE TABLE analytics_config (
  id UUID PRIMARY KEY,
  platform TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  fetch_interval_hours INTEGER DEFAULT 24,
  last_fetch_at TIMESTAMP WITH TIME ZONE,
  next_fetch_at TIMESTAMP WITH TIME ZONE,
  
  -- API credentials (encrypted in production)
  access_token TEXT,
  refresh_token TEXT,
  api_key TEXT,
  page_id TEXT,
  business_id TEXT,
  channel_id TEXT
);
```

## 🔄 Automatic Updates

### Update Triggers

1. **After Publishing** (5-second delay)
   - Automatically fetches analytics for newly published posts
   - Updates database with fresh metrics

2. **Scheduled Updates** (24-hour intervals)
   - Background job updates all platform analytics
   - Respects API rate limits
   - Error handling and retry logic

3. **Manual Refresh**
   - Dashboard refresh button
   - API endpoint for manual triggers

### Update Process

```typescript
// 1. Fetch platform posts
const posts = await facebookAnalytics.fetchAllPosts()

// 2. Get insights for each post
for (const post of posts) {
  const insights = await facebookAnalytics.fetchPostInsights(post.id)
  await storePostAnalytics(post.id, insights)
}

// 3. Update configuration timestamps
await updateAnalyticsConfig('facebook')
```

## 📈 Dashboard Features

### Real-Time Analytics
- Live metrics from all connected platforms
- Auto-refresh every 5 minutes
- Manual refresh capability

### Platform Performance
- Side-by-side platform comparison
- Engagement rate calculations
- Top performing content

### Period Selection
- 7 days, 30 days, 90 days, 1 year
- Platform-specific filtering
- Historical trend analysis

### Data Visualization
- Number formatting (K, M for thousands/millions)
- Percentage calculations
- Color-coded performance indicators

## 🛠 API Usage

### Fetch Analytics
```typescript
// Get analytics for last 30 days
const response = await fetch('/api/analytics?period=30')
const data = await response.json()

// Get Facebook-specific analytics
const response = await fetch('/api/analytics?period=30&platform=facebook')
const data = await response.json()

// Refresh analytics data
const response = await fetch('/api/analytics?period=30&refresh=true')
const data = await response.json()
```

### Update Analytics
```typescript
// Update all platforms
const response = await fetch('/api/analytics/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ platform: 'all' })
})

// Update specific platform
const response = await fetch('/api/analytics/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ platform: 'facebook' })
})
```

## 🔧 React Hooks

### useAnalytics Hook
```typescript
import { useAnalytics } from '@/lib/analytics/hooks'

function AnalyticsDashboard() {
  const { analytics, loading, error, refresh } = useAnalytics(30, true)
  
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  
  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      {/* Display analytics data */}
    </div>
  )
}
```

### useAnalyticsSummary Hook
```typescript
import { useAnalyticsSummary } from '@/lib/analytics/hooks'

function DashboardSummary() {
  const { summary, loading } = useAnalyticsSummary()
  
  return (
    <div>
      <p>Total Videos: {summary.totalVideos}</p>
      <p>Total Posts: {summary.totalPosts}</p>
      <p>Total Views: {summary.totalViews}</p>
      <p>Total Engagement: {summary.totalEngagement}</p>
    </div>
  )
}
```

## 🚀 Adding New Platforms

### Step 1: Create Platform Implementation
```typescript
// lib/analytics/instagram.ts
export class InstagramAnalytics {
  async fetchPostInsights(postId: string): Promise<InstagramMetrics> {
    // Implement Instagram API calls
  }
  
  async updateAllPostAnalytics(): Promise<void> {
    // Implement batch update logic
  }
}
```

### Step 2: Update Analytics API
```typescript
// app/api/analytics/route.ts
if (!platform || platform === 'instagram') {
  const instagramAnalytics = new InstagramAnalytics()
  await instagramAnalytics.updateAllPostAnalytics()
}
```

### Step 3: Update Dashboard
```typescript
// app/analytics/page.tsx
{analytics?.platforms.instagram && (
  <div className="instagram-analytics">
    {/* Display Instagram metrics */}
  </div>
)}
```

### Step 4: Add Environment Variables
```bash
INSTAGRAM_ACCESS_TOKEN=your_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_account_id
```

## 🔍 Error Handling

### Error Types
- **API Rate Limits**: Automatic retry with exponential backoff
- **Authentication Errors**: Logged and reported to admin
- **Network Errors**: Retry logic with circuit breaker pattern
- **Data Processing Errors**: Graceful degradation with fallback data

### Error Logging
```typescript
// All errors are logged to analytics_errors table
await supabaseAdmin
  .from('analytics_errors')
  .insert({
    platform: 'facebook',
    error_type: 'api_rate_limit',
    error_message: 'Rate limit exceeded',
    error_details: { retry_count: 3, max_retries: 5 }
  })
```

## 📊 Performance Optimization

### Database Indexes
- Platform and post ID combinations
- Collection timestamps for time-based queries
- Next update timestamps for scheduled jobs

### Caching Strategy
- Analytics summary cache (1-hour TTL)
- Platform-specific caches
- Dashboard data pre-computation

### Rate Limiting
- Respect platform API limits
- Exponential backoff for retries
- Circuit breaker for failing APIs

## 🔐 Security Considerations

### API Credentials
- Environment variables for all tokens
- Encryption for stored credentials (production)
- Regular token rotation

### Data Privacy
- No PII stored in analytics
- Aggregated metrics only
- GDPR-compliant data handling

## 📋 Monitoring & Alerts

### Health Checks
- API endpoint availability
- Database connection status
- Platform API status

### Metrics to Monitor
- Analytics update success rate
- API response times
- Error rates by platform
- Data freshness

### Alerts
- Failed analytics updates
- High error rates
- API rate limit warnings
- Data staleness alerts

## 🎯 Future Enhancements

### Planned Features
- [ ] Real-time analytics streaming
- [ ] Advanced filtering and segmentation
- [ ] Custom date ranges
- [ ] Export functionality
- [ ] Automated reporting
- [ ] A/B testing analytics
- [ ] Competitor benchmarking
- [ ] Predictive analytics

### Platform Expansions
- [ ] Instagram Reels analytics
- [ ] TikTok LIVE metrics
- [ ] YouTube Shorts performance
- [ ] LinkedIn content analytics
- [ ] Twitter/X integration

This analytics system provides a solid foundation for tracking performance across all major social media platforms while maintaining scalability and extensibility for future growth. 