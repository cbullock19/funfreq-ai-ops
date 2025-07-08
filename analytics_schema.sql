-- Multi-Platform Analytics Database Schema
-- This schema supports Facebook, Instagram, TikTok, and YouTube analytics
-- Complete and self-contained - includes all required tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, create the posts table that analytics depends on
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  video_id UUID, -- Will reference videos table when it exists
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'youtube')),
  platform_post_id TEXT, -- platform's internal post ID
  post_url TEXT, -- link to the published post
  caption TEXT, -- what caption was actually posted
  hashtags TEXT[], -- hashtags used
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed')),
  
  -- Analytics (updated periodically)
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  
  posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics table for storing platform-specific metrics
CREATE TABLE IF NOT EXISTS analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  video_id UUID, -- Will reference videos table when it exists
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'youtube')),
  platform_post_id TEXT NOT NULL, -- The platform's internal post ID
  
  -- Base metrics (common across all platforms)
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  watch_time_seconds INTEGER DEFAULT 0,
  
  -- Platform-specific metrics (stored as JSON for flexibility)
  facebook_metrics JSONB, -- Facebook-specific data like reactions breakdown
  instagram_metrics JSONB, -- Instagram-specific data like saves, reach sources
  tiktok_metrics JSONB, -- TikTok-specific data like bookmarks, unique viewers
  youtube_metrics JSONB, -- YouTube-specific data like watch time, subscribers
  
  -- Metadata
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_update_at TIMESTAMP WITH TIME ZONE,
  
  -- Error tracking
  last_error TEXT,
  error_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Ensure we don't have duplicate analytics for the same post/period
  UNIQUE(platform_post_id, platform, period_start)
);

-- Analytics configuration table
CREATE TABLE IF NOT EXISTS analytics_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  platform TEXT UNIQUE NOT NULL CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'youtube')),
  
  -- Configuration
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
  channel_id TEXT,
  
  -- Rate limiting
  rate_limit_remaining INTEGER,
  rate_limit_reset_at TIMESTAMP WITH TIME ZONE,
  
  -- Error tracking
  consecutive_errors INTEGER DEFAULT 0,
  last_error TEXT,
  last_error_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics summary cache table for dashboard performance
CREATE TABLE IF NOT EXISTS analytics_summary_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Summary period
  period_type TEXT NOT NULL CHECK (period_type IN ('day', 'week', 'month', 'quarter', 'year')),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Aggregated metrics
  total_videos INTEGER DEFAULT 0,
  total_posts INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  total_reach INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  
  -- Platform breakdowns
  facebook_summary JSONB,
  instagram_summary JSONB,
  tiktok_summary JSONB,
  youtube_summary JSONB,
  
  -- Top performing content
  top_posts JSONB,
  
  -- Cache metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(period_type, period_start, period_end)
);

-- Analytics errors log table
CREATE TABLE IF NOT EXISTS analytics_errors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'youtube')),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_video_id ON posts(video_id);
CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_posted_at ON posts(posted_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_platform_post ON analytics(platform, platform_post_id);
CREATE INDEX IF NOT EXISTS idx_analytics_collected_at ON analytics(collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_video_id ON analytics(video_id);
CREATE INDEX IF NOT EXISTS idx_analytics_period ON analytics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_analytics_next_update ON analytics(next_update_at) WHERE next_update_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_config_platform ON analytics_config(platform);
CREATE INDEX IF NOT EXISTS idx_analytics_config_next_fetch ON analytics_config(next_fetch_at) WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_analytics_summary_period ON analytics_summary_cache(period_type, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_expires ON analytics_summary_cache(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_errors_platform ON analytics_errors(platform);
CREATE INDEX IF NOT EXISTS idx_analytics_errors_unresolved ON analytics_errors(platform, resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_analytics_errors_created ON analytics_errors(created_at DESC);

-- Insert default analytics configuration
INSERT INTO analytics_config (platform, enabled, fetch_interval_hours) VALUES
  ('facebook', true, 24),
  ('instagram', false, 24),
  ('tiktok', false, 24),
  ('youtube', false, 24)
ON CONFLICT (platform) DO NOTHING;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_posts_updated_at 
  BEFORE UPDATE ON posts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_config_updated_at 
  BEFORE UPDATE ON analytics_config 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to calculate engagement rate
CREATE OR REPLACE FUNCTION calculate_engagement_rate(impressions BIGINT, engagement BIGINT)
RETURNS DECIMAL AS $$
BEGIN
  IF impressions = 0 THEN
    RETURN 0;
  END IF;
  RETURN ROUND((engagement::DECIMAL / impressions::DECIMAL) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Create a view for current analytics summary
CREATE OR REPLACE VIEW current_analytics_summary AS
SELECT 
  platform,
  COUNT(DISTINCT post_id) as posts_count,
  SUM(views) as total_views,
  SUM(engagement) as total_engagement,
  SUM(reach) as total_reach,
  SUM(impressions) as total_impressions,
  CASE 
    WHEN SUM(impressions) = 0 THEN 0 
    ELSE ROUND((SUM(engagement)::DECIMAL / SUM(impressions)::DECIMAL) * 100, 2)
  END as avg_engagement_rate,
  MAX(collected_at) as last_updated
FROM analytics 
WHERE collected_at >= NOW() - INTERVAL '30 days'
GROUP BY platform;

-- Create a function to refresh analytics summary cache
CREATE OR REPLACE FUNCTION refresh_analytics_summary_cache(
  p_period_type TEXT,
  p_period_start TIMESTAMP WITH TIME ZONE,
  p_period_end TIMESTAMP WITH TIME ZONE
) RETURNS VOID AS $$
BEGIN
  -- Delete existing cache entry
  DELETE FROM analytics_summary_cache 
  WHERE period_type = p_period_type 
    AND period_start = p_period_start 
    AND period_end = p_period_end;
  
  -- Insert new cache entry
  INSERT INTO analytics_summary_cache (
    period_type, period_start, period_end,
    total_videos, total_posts, total_views, total_engagement, total_reach, total_impressions,
    facebook_summary, instagram_summary, tiktok_summary, youtube_summary,
    top_posts, expires_at
  )
  SELECT 
    p_period_type,
    p_period_start,
    p_period_end,
    COUNT(DISTINCT a.video_id) as total_videos,
    COUNT(DISTINCT a.post_id) as total_posts,
    SUM(a.views) as total_views,
    SUM(a.engagement) as total_engagement,
    SUM(a.reach) as total_reach,
    SUM(a.impressions) as total_impressions,
    -- Platform summaries
    jsonb_build_object(
      'posts_count', COUNT(DISTINCT CASE WHEN a.platform = 'facebook' THEN a.post_id END),
      'total_views', SUM(CASE WHEN a.platform = 'facebook' THEN a.views ELSE 0 END),
      'total_engagement', SUM(CASE WHEN a.platform = 'facebook' THEN a.engagement ELSE 0 END),
      'total_reach', SUM(CASE WHEN a.platform = 'facebook' THEN a.reach ELSE 0 END),
      'total_impressions', SUM(CASE WHEN a.platform = 'facebook' THEN a.impressions ELSE 0 END),
      'avg_engagement_rate', CASE 
        WHEN SUM(CASE WHEN a.platform = 'facebook' THEN a.impressions ELSE 0 END) = 0 THEN 0 
        ELSE ROUND((SUM(CASE WHEN a.platform = 'facebook' THEN a.engagement ELSE 0 END)::DECIMAL / SUM(CASE WHEN a.platform = 'facebook' THEN a.impressions ELSE 0 END)::DECIMAL) * 100, 2)
      END
    ) as facebook_summary,
    jsonb_build_object(
      'posts_count', COUNT(DISTINCT CASE WHEN a.platform = 'instagram' THEN a.post_id END),
      'total_views', SUM(CASE WHEN a.platform = 'instagram' THEN a.views ELSE 0 END),
      'total_engagement', SUM(CASE WHEN a.platform = 'instagram' THEN a.engagement ELSE 0 END),
      'total_reach', SUM(CASE WHEN a.platform = 'instagram' THEN a.reach ELSE 0 END),
      'total_impressions', SUM(CASE WHEN a.platform = 'instagram' THEN a.impressions ELSE 0 END),
      'avg_engagement_rate', CASE 
        WHEN SUM(CASE WHEN a.platform = 'instagram' THEN a.impressions ELSE 0 END) = 0 THEN 0 
        ELSE ROUND((SUM(CASE WHEN a.platform = 'instagram' THEN a.engagement ELSE 0 END)::DECIMAL / SUM(CASE WHEN a.platform = 'instagram' THEN a.impressions ELSE 0 END)::DECIMAL) * 100, 2)
      END
    ) as instagram_summary,
    jsonb_build_object(
      'posts_count', COUNT(DISTINCT CASE WHEN a.platform = 'tiktok' THEN a.post_id END),
      'total_views', SUM(CASE WHEN a.platform = 'tiktok' THEN a.views ELSE 0 END),
      'total_engagement', SUM(CASE WHEN a.platform = 'tiktok' THEN a.engagement ELSE 0 END),
      'total_reach', SUM(CASE WHEN a.platform = 'tiktok' THEN a.reach ELSE 0 END),
      'total_impressions', SUM(CASE WHEN a.platform = 'tiktok' THEN a.impressions ELSE 0 END),
      'avg_engagement_rate', CASE 
        WHEN SUM(CASE WHEN a.platform = 'tiktok' THEN a.impressions ELSE 0 END) = 0 THEN 0 
        ELSE ROUND((SUM(CASE WHEN a.platform = 'tiktok' THEN a.engagement ELSE 0 END)::DECIMAL / SUM(CASE WHEN a.platform = 'tiktok' THEN a.impressions ELSE 0 END)::DECIMAL) * 100, 2)
      END
    ) as tiktok_summary,
    jsonb_build_object(
      'posts_count', COUNT(DISTINCT CASE WHEN a.platform = 'youtube' THEN a.post_id END),
      'total_views', SUM(CASE WHEN a.platform = 'youtube' THEN a.views ELSE 0 END),
      'total_engagement', SUM(CASE WHEN a.platform = 'youtube' THEN a.engagement ELSE 0 END),
      'total_reach', SUM(CASE WHEN a.platform = 'youtube' THEN a.reach ELSE 0 END),
      'total_impressions', SUM(CASE WHEN a.platform = 'youtube' THEN a.impressions ELSE 0 END),
      'avg_engagement_rate', CASE 
        WHEN SUM(CASE WHEN a.platform = 'youtube' THEN a.impressions ELSE 0 END) = 0 THEN 0 
        ELSE ROUND((SUM(CASE WHEN a.platform = 'youtube' THEN a.engagement ELSE 0 END)::DECIMAL / SUM(CASE WHEN a.platform = 'youtube' THEN a.impressions ELSE 0 END)::DECIMAL) * 100, 2)
      END
    ) as youtube_summary,
    -- Top posts (top 10 by engagement)
    jsonb_agg(
      jsonb_build_object(
        'post_id', a.post_id,
        'platform', a.platform,
        'views', a.views,
        'engagement', a.engagement,
        'reach', a.reach,
        'impressions', a.impressions,
        'engagement_rate', CASE 
          WHEN a.impressions = 0 THEN 0 
          ELSE ROUND((a.engagement::DECIMAL / a.impressions::DECIMAL) * 100, 2)
        END
      ) ORDER BY a.engagement DESC
    ) FILTER (WHERE a.engagement > 0) as top_posts,
    NOW() + INTERVAL '1 hour' as expires_at
  FROM analytics a
  WHERE a.collected_at >= p_period_start AND a.collected_at <= p_period_end;
END;
$$ LANGUAGE plpgsql; 