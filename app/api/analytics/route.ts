import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { FacebookAnalytics } from '@/lib/analytics/facebook'
import { AnalyticsSummary, PlatformSummary } from '@/lib/analytics/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30' // days
    const platform = searchParams.get('platform') // optional filter
    const refresh = searchParams.get('refresh') === 'true'

    console.log(`Analytics request: period=${period} days, platform=${platform}, refresh=${refresh}`)

    // If refresh is requested, update analytics data
    if (refresh) {
      await updateAnalyticsData()
    }

    // Get analytics summary
    const summary = await getAnalyticsSummary(parseInt(period), platform || undefined)
    
    return NextResponse.json({
      success: true,
      data: summary
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

/**
 * Update analytics data for all platforms
 */
async function updateAnalyticsData(): Promise<void> {
  try {
    console.log('Starting analytics data update...')

    // Update Facebook analytics if configured
    if (process.env.META_ACCESS_TOKEN && process.env.META_PAGE_ID) {
      try {
        const facebookAnalytics = new FacebookAnalytics()
        await facebookAnalytics.updateAllPostAnalytics()
        console.log('Facebook analytics updated successfully')
      } catch (error) {
        console.error('Failed to update Facebook analytics:', error)
      }
    }

    // TODO: Add other platforms when they're connected
    // Instagram, TikTok, YouTube analytics will be added here

    console.log('Analytics data update completed')

  } catch (error) {
    console.error('Error updating analytics data:', error)
    throw error
  }
}

/**
 * Get analytics summary for the specified period
 */
async function getAnalyticsSummary(days: number, platform?: string): Promise<AnalyticsSummary> {
  const periodStart = new Date()
  periodStart.setDate(periodStart.getDate() - days)

  try {
    // Get videos with published platforms from our current data structure
    let query = supabaseAdmin
      .from('videos')
      .select('*')
      .gte('created_at', periodStart.toISOString())
      .not('published_platforms', 'eq', '{}')
      .not('published_platforms', 'is', null)

    const { data: videos, error } = await query

    if (error) {
      throw error
    }

    console.log(`Found ${videos?.length || 0} videos with published platforms`)

    // Process videos data into summary
    const summary = processVideosData(videos || [], periodStart, new Date())

    return summary

  } catch (error) {
    console.error('Error fetching analytics summary:', error)
    throw error
  }
}

/**
 * Process videos data into analytics summary format
 */
function processVideosData(videos: any[], periodStart: Date, periodEnd: Date): AnalyticsSummary {
  const summary: AnalyticsSummary = {
    total_videos: videos.length,
    total_posts: 0,
    total_views: 0,
    total_engagement: 0,
    total_reach: 0,
    total_impressions: 0,
    period_start: periodStart,
    period_end: periodEnd,
    platforms: {}
  }

  const platformData: Record<string, any> = {}

  // Process each video
  for (const video of videos) {
    if (video.published_platforms) {
      // Count posts per platform
      for (const [platform, status] of Object.entries(video.published_platforms)) {
        const platformStatus = status as any
        if (platformStatus.status === 'posted') {
          summary.total_posts++
          
          // Initialize platform data if not exists
          if (!platformData[platform]) {
            platformData[platform] = {
              posts_count: 0,
              total_views: 0,
              total_engagement: 0,
              total_reach: 0,
              total_impressions: 0,
              posts: []
            }
          }

          platformData[platform].posts_count++

          // Add post data for top performers
          platformData[platform].posts.push({
            post_id: platformStatus.post_id || video.id,
            video_id: video.id,
            platform: platform,
            title: video.title,
            caption: video.final_caption || video.ai_caption,
            post_url: platformStatus.post_url,
            metrics: {
              impressions: 0, // We'll get these from analytics when available
              reach: 0,
              engagement: 0,
              clicks: 0,
              shares: 0,
              comments: 0,
              likes: 0,
              views: 0
            },
            posted_at: new Date(platformStatus.published_at || video.created_at)
          })
        }
      }
    }
  }

  // Process platform summaries
  for (const [platform, data] of Object.entries(platformData)) {
    // Calculate engagement rate
    const avgEngagementRate = data.total_impressions > 0 
      ? (data.total_engagement / data.total_impressions) * 100 
      : 0

    // Get top performing posts (top 5 by posted date)
    const topPosts = data.posts
      .sort((a: any, b: any) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime())
      .slice(0, 5)

    summary.platforms[platform as keyof typeof summary.platforms] = {
      platform: platform as 'facebook' | 'instagram' | 'tiktok' | 'youtube',
      posts_count: data.posts_count,
      total_views: data.total_views,
      total_engagement: data.total_engagement,
      total_reach: data.total_reach,
      total_impressions: data.total_impressions,
      average_engagement_rate: avgEngagementRate,
      top_performing_posts: topPosts
    }
  }

  return summary
}

/**
 * Process raw analytics data into summary format
 */
function processAnalyticsData(analytics: any[], periodStart: Date, periodEnd: Date): AnalyticsSummary {
  const summary: AnalyticsSummary = {
    total_videos: 0,
    total_posts: 0,
    total_views: 0,
    total_engagement: 0,
    total_reach: 0,
    total_impressions: 0,
    period_start: periodStart,
    period_end: periodEnd,
    platforms: {}
  }

  // Track unique videos and posts
  const uniqueVideos = new Set<string>()
  const uniquePosts = new Set<string>()
  const platformData: Record<string, any> = {}

  // Process each analytics record
  for (const record of analytics) {
    const platform = record.platform
    const post = record.posts

    // Track unique items
    if (post?.video_id) {
      uniqueVideos.add(post.video_id)
    }
    if (post?.id) {
      uniquePosts.add(post.id)
    }

    // Initialize platform data if not exists
    if (!platformData[platform]) {
      platformData[platform] = {
        posts_count: 0,
        total_views: 0,
        total_engagement: 0,
        total_reach: 0,
        total_impressions: 0,
        posts: []
      }
    }

    // Aggregate platform metrics
    platformData[platform].total_views += record.views || 0
    platformData[platform].total_engagement += record.engagement || 0
    platformData[platform].total_reach += record.reach || 0
    platformData[platform].total_impressions += record.impressions || 0

    // Add post data for top performers
    if (post) {
      platformData[platform].posts.push({
        post_id: post.id,
        video_id: post.video_id,
        platform: platform,
        title: `Video ${post.video_id?.substring(0, 8) || 'Unknown'}`, // Fallback title
        caption: post.caption,
        post_url: post.post_url,
        metrics: {
          impressions: record.impressions || 0,
          reach: record.reach || 0,
          engagement: record.engagement || 0,
          clicks: record.clicks || 0,
          shares: record.shares || 0,
          comments: record.comments || 0,
          likes: record.likes || 0,
          views: record.views || 0
        },
        posted_at: new Date(post.posted_at)
      })
    }
  }

  // Calculate totals
  summary.total_videos = uniqueVideos.size
  summary.total_posts = uniquePosts.size

  // Process platform summaries
  for (const [platform, data] of Object.entries(platformData)) {
    // Calculate engagement rate
    const avgEngagementRate = data.total_impressions > 0 
      ? (data.total_engagement / data.total_impressions) * 100 
      : 0

    // Get top performing posts (top 5 by engagement)
    const topPosts = data.posts
      .sort((a: any, b: any) => b.metrics.engagement - a.metrics.engagement)
      .slice(0, 5)

    summary.platforms[platform as keyof typeof summary.platforms] = {
      platform: platform as any,
      posts_count: data.posts.length,
      total_views: data.total_views,
      total_engagement: data.total_engagement,
      total_reach: data.total_reach,
      total_impressions: data.total_impressions,
      average_engagement_rate: Math.round(avgEngagementRate * 100) / 100,
      top_performing_posts: topPosts
    }

    // Add to overall totals
    summary.total_views += data.total_views
    summary.total_engagement += data.total_engagement
    summary.total_reach += data.total_reach
    summary.total_impressions += data.total_impressions
  }

  return summary
}

/**
 * Get recent activity (last 10 posts with analytics)
 */
export async function getRecentActivity(): Promise<any[]> {
  try {
    const { data: analytics, error } = await supabaseAdmin
      .from('analytics')
      .select(`
        *,
        posts!inner(
          id,
          platform,
          post_url,
          caption,
          posted_at,
          video_id
        )
      `)
      .order('collected_at', { ascending: false })
      .limit(10)

    if (error) {
      throw error
    }

    return analytics.map(record => ({
      id: record.posts.id,
      platform: record.platform,
      title: `Video ${record.posts.video_id?.substring(0, 8) || 'Unknown'}`, // Fallback title
      caption: record.posts.caption,
      post_url: record.posts.post_url,
      posted_at: record.posts.posted_at,
      metrics: {
        views: record.views || 0,
        engagement: record.engagement || 0,
        reach: record.reach || 0,
        impressions: record.impressions || 0
      }
    }))

  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return []
  }
} 