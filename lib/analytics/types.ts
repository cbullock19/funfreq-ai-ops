// Core analytics types for multi-platform system

export interface BaseMetrics {
  impressions: number
  reach: number
  engagement: number
  clicks: number
  shares: number
  comments: number
  likes: number
  views?: number // For video content
  watch_time?: number // For video content
  saved?: number // For Instagram
  bookmarks?: number // For TikTok
}

export interface PlatformMetrics extends BaseMetrics {
  platform: 'facebook' | 'instagram' | 'tiktok' | 'youtube'
  post_id: string
  video_id?: string
  collected_at: Date
  period_start?: Date
  period_end?: Date
}

export interface FacebookMetrics extends PlatformMetrics {
  platform: 'facebook'
  // Facebook-specific metrics
  reactions: {
    like: number
    love: number
    haha: number
    wow: number
    sad: number
    angry: number
  }
  video_views: number
  video_watch_time: number
  unique_views: number
  organic_reach: number
  paid_reach: number
}

export interface InstagramMetrics extends PlatformMetrics {
  platform: 'instagram'
  // Instagram-specific metrics
  saves: number
  reach_from_hashtags: number
  reach_from_explore: number
  reach_from_profile: number
  reach_from_other: number
  video_views: number
  video_completion_rate: number
}

export interface TikTokMetrics extends PlatformMetrics {
  platform: 'tiktok'
  // TikTok-specific metrics
  bookmarks: number
  video_views: number
  video_watch_time: number
  unique_viewers: number
  shares: number
  comments: number
  likes: number
  reach: number
}

export interface YouTubeMetrics extends PlatformMetrics {
  platform: 'youtube'
  // YouTube-specific metrics
  views: number
  watch_time_minutes: number
  average_view_duration: number
  subscribers_gained: number
  subscribers_lost: number
  likes: number
  dislikes: number
  comments: number
  shares: number
}

export interface AnalyticsSummary {
  total_videos: number
  total_posts: number
  total_views: number
  total_engagement: number
  total_reach: number
  total_impressions: number
  period_start: Date
  period_end: Date
  platforms: {
    facebook?: PlatformSummary
    instagram?: PlatformSummary
    tiktok?: PlatformSummary
    youtube?: PlatformSummary
  }
}

export interface PlatformSummary {
  platform: 'facebook' | 'instagram' | 'tiktok' | 'youtube'
  posts_count: number
  total_views: number
  total_engagement: number
  total_reach: number
  total_impressions: number
  average_engagement_rate?: number
  top_performing_posts: TopPost[]
}

export interface TopPost {
  post_id: string
  video_id?: string
  platform: 'facebook' | 'instagram' | 'tiktok' | 'youtube'
  title?: string
  caption?: string
  post_url?: string
  metrics: BaseMetrics
  posted_at: Date
}

export interface AnalyticsConfig {
  facebook: {
    enabled: boolean
    access_token?: string
    page_id?: string
    fetch_interval_hours: number
  }
  instagram: {
    enabled: boolean
    access_token?: string
    business_account_id?: string
    fetch_interval_hours: number
  }
  tiktok: {
    enabled: boolean
    access_token?: string
    business_id?: string
    fetch_interval_hours: number
  }
  youtube: {
    enabled: boolean
    api_key?: string
    channel_id?: string
    fetch_interval_hours: number
  }
}

export interface AnalyticsError {
  platform: 'facebook' | 'instagram' | 'tiktok' | 'youtube'
  error: string
  timestamp: Date
  retry_count: number
  max_retries: number
} 