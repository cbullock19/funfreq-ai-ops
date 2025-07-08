import { supabaseAdmin } from '@/lib/supabase'
import { withRetry } from '@/lib/utils/retry'
import { FacebookMetrics, AnalyticsError } from './types'

// Use fetch instead of axios for HTTP requests
async function makeRequest(url: string, params: Record<string, any> = {}): Promise<any> {
  const urlWithParams = new URL(url)
  Object.entries(params).forEach(([key, value]) => {
    urlWithParams.searchParams.append(key, value.toString())
  })
  
  const response = await fetch(urlWithParams.toString())
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return response.json()
}

const META_API_BASE = 'https://graph.facebook.com/v18.0'

interface FacebookInsightsResponse {
  data: Array<{
    name: string
    period: string
    values: Array<{
      value: number
      end_time: string
    }>
  }>
  paging?: {
    next?: string
  }
}

interface FacebookPostInsightsResponse {
  data: Array<{
    name: string
    period: string
    values: Array<{
      value: number
      end_time: string
    }>
  }>
}

export class FacebookAnalytics {
  private accessToken: string
  private pageId: string

  constructor() {
    this.accessToken = process.env.META_ACCESS_TOKEN!
    this.pageId = process.env.META_PAGE_ID!
    
    if (!this.accessToken || !this.pageId) {
      throw new Error('Facebook analytics requires META_ACCESS_TOKEN and META_PAGE_ID environment variables')
    }
  }

  /**
   * Fetch overall page insights
   */
  async fetchPageInsights(period: 'day' | 'week' | 'month' = 'day'): Promise<any> {
    try {
      console.log('Fetching Facebook page insights...')
      
      const pageMetrics = [
        'page_impressions',
        'page_impressions_unique',
        'page_engaged_users',
        'page_consumptions',
        'page_negative_feedback',
        'page_fans',
        'page_fan_adds',
        'page_fan_removes'
      ]

      const insights = await makeRequest(`${META_API_BASE}/${this.pageId}/insights`, {
        metric: pageMetrics.join(','),
        period: period,
        access_token: this.accessToken
      }) as FacebookInsightsResponse
      
      // Process and store page insights
      const processedInsights = this.processPageInsights(insights.data)
      
      console.log('Facebook page insights fetched successfully')
      return processedInsights

    } catch (error) {
      console.error('Error fetching Facebook page insights:', error)
      await this.logError('page_insights', error)
      throw error
    }
  }

  /**
   * Fetch insights for a specific post
   */
  async fetchPostInsights(postId: string): Promise<FacebookMetrics> {
    try {
      console.log(`Fetching Facebook post insights for: ${postId}`)
      
      // Use simpler metrics that are more likely to be available
      const postMetrics = [
        'post_impressions',
        'post_impressions_unique',
        'post_reactions_by_type_total',
        'post_clicks',
        'post_engaged_users'
      ]

      const insights = await makeRequest(`${META_API_BASE}/${postId}/insights`, {
        metric: postMetrics.join(','),
        access_token: this.accessToken
      }) as FacebookPostInsightsResponse
      
      // Process insights into our standard format
      const processedMetrics = this.processPostInsights(insights.data, postId)
      
      console.log(`Facebook post insights processed for: ${postId}`)
      return processedMetrics

    } catch (error: any) {
      // Handle specific error cases
      if (error.message?.includes('400')) {
        console.log(`Post ${postId} analytics not available yet (post too new or no data)`)
        // Return default metrics for new posts
        return {
          platform: 'facebook' as const,
          post_id: postId,
          collected_at: new Date(),
          impressions: 0,
          reach: 0,
          engagement: 0,
          clicks: 0,
          shares: 0,
          comments: 0,
          likes: 0,
          reactions: {
            like: 0,
            love: 0,
            haha: 0,
            wow: 0,
            sad: 0,
            angry: 0
          },
          video_views: 0,
          video_watch_time: 0,
          unique_views: 0,
          organic_reach: 0,
          paid_reach: 0
        }
      }
      
      console.error(`Error fetching Facebook post insights for ${postId}:`, error)
      await this.logError('post_insights', error, { postId })
      throw error
    }
  }

  /**
   * Fetch video-specific metrics
   */
  async fetchVideoMetrics(postId: string): Promise<any> {
    try {
      console.log(`Fetching Facebook video metrics for: ${postId}`)
      
      const videoMetrics = [
        'post_video_views',
        'post_video_watch_time',
        'post_video_views_unique',
        'post_video_views_organic',
        'post_video_views_paid',
        'post_video_complete_views_organic',
        'post_video_complete_views_paid',
        'post_video_avg_time_watched',
        'post_video_view_time_by_age_bucket_and_gender',
        'post_video_view_time_by_country_id'
      ]

      const insights = await makeRequest(`${META_API_BASE}/${postId}/insights`, {
        metric: videoMetrics.join(','),
        access_token: this.accessToken
      }) as FacebookPostInsightsResponse
      
      const videoData = this.processVideoInsights(insights.data, postId)
      
      console.log(`Facebook video metrics processed for: ${postId}`)
      return videoData

    } catch (error) {
      console.error(`Error fetching Facebook video metrics for ${postId}:`, error)
      await this.logError('video_metrics', error, { postId })
      throw error
    }
  }

  /**
   * Fetch all posts from the page with basic metrics
   */
  async fetchAllPosts(limit: number = 50): Promise<any[]> {
    try {
      console.log('Fetching Facebook posts...')
      
      const response = await makeRequest(`${META_API_BASE}/${this.pageId}/posts`, {
        fields: 'id,message,created_time,type,permalink_url',
        limit: limit.toString(),
        access_token: this.accessToken
      })

      const posts = response.data
      console.log(`Found ${posts.length} Facebook posts`)
      
      return posts

    } catch (error) {
      console.error('Error fetching Facebook posts:', error)
      await this.logError('fetch_posts', error)
      throw error
    }
  }

  /**
   * Update analytics for all posts in our database
   */
  async updateAllPostAnalytics(forceRefresh: boolean = false): Promise<void> {
    try {
      console.log('Starting Facebook analytics update for all posts...')
      // Get all Facebook posts from our database
      const { data: posts, error } = await supabaseAdmin
        .from('posts')
        .select('id, platform_post_id, video_id, created_at, post_url')
        .eq('platform', 'facebook')
        .eq('status', 'posted')

      if (error) {
        console.error('Error fetching posts from DB:', error)
        throw error
      }

      console.log(`Found ${posts.length} Facebook posts to update`)

      let successCount = 0
      let skippedCount = 0
      let errorCount = 0

      for (const post of posts) {
        try {
          console.log(`Processing post: DB id=${post.id}, FB post_id=${post.platform_post_id}, url=${post.post_url}`)
          // Check if post is too new (less than 1 hour old)
          const postAge = Date.now() - new Date(post.created_at || Date.now()).getTime()
          const oneHour = 60 * 60 * 1000
          if (!forceRefresh && postAge < oneHour) {
            console.log(`Skipping post ${post.platform_post_id} - too new (${Math.round(postAge / 1000 / 60)} minutes old)`)
            skippedCount++
            continue
          }

          // Fetch insights with retry logic
          console.log(`Fetching Facebook insights for post_id=${post.platform_post_id}`)
          const insights = await withRetry(
            () => this.fetchPostInsightsWithDebug(post.platform_post_id),
            3 // maxRetries
          )

          // Store analytics data
          await this.storePostAnalytics(post.id, insights)
          successCount++

          // Add delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 200))

        } catch (error) {
          console.error(`Failed to update analytics for post ${post.platform_post_id}:`, error)
          errorCount++
          await this.logError('update_post_analytics', error, { postId: post.platform_post_id })
        }
      }

      console.log(`Facebook analytics update completed: ${successCount} successful, ${skippedCount} skipped (too new), ${errorCount} errors`)

    } catch (error) {
      console.error('Error updating Facebook analytics:', error)
      await this.logError('update_all_analytics', error)
      throw error
    }
  }

  /**
   * Fetch post insights with debug logging
   */
  async fetchPostInsightsWithDebug(postId: string): Promise<FacebookMetrics> {
    try {
      console.log(`[FB API] Fetching insights for postId=${postId}`)
      const postMetrics = [
        'post_impressions',
        'post_impressions_unique',
        'post_reactions_by_type_total',
        'post_clicks',
        'post_engaged_users',
        'post_video_views',
        'post_video_watch_time',
        'post_video_views_unique',
        'post_video_views_organic',
        'post_video_views_paid',
        'post_video_complete_views_organic',
        'post_video_complete_views_paid',
        'post_video_avg_time_watched',
        'post_video_view_time_by_age_bucket_and_gender',
        'post_video_view_time_by_country_id'
      ]
      const url = `${META_API_BASE}/${postId}/insights`
      const params = {
        metric: postMetrics.join(','),
        access_token: this.accessToken
      }
      console.log(`[FB API] Request URL:`, url, params)
      const response = await makeRequest(url, params)
      console.log(`[FB API] Raw response for postId=${postId}:`, JSON.stringify(response, null, 2))
      const processedMetrics = this.processPostInsights(response.data, postId)
      console.log(`[FB API] Processed metrics for postId=${postId}:`, processedMetrics)
      return processedMetrics
    } catch (error) {
      console.error(`[FB API] Error fetching insights for postId=${postId}:`, error)
      throw error
    }
  }

  /**
   * Process page insights into a standardized format
   */
  private processPageInsights(insights: any[]): any {
    const processed: any = {}
    
    for (const insight of insights) {
      const value = insight.values?.[0]?.value || 0
      
      switch (insight.name) {
        case 'page_impressions':
          processed.impressions = value
          break
        case 'page_impressions_unique':
          processed.unique_impressions = value
          break
        case 'page_engaged_users':
          processed.engaged_users = value
          break
        case 'page_consumptions':
          processed.consumptions = value
          break
        case 'page_negative_feedback':
          processed.negative_feedback = value
          break
        case 'page_fans':
          processed.fans = value
          break
        case 'page_fan_adds':
          processed.fan_adds = value
          break
        case 'page_fan_removes':
          processed.fan_removes = value
          break
      }
    }
    
    return processed
  }

  /**
   * Process post insights into FacebookMetrics format
   */
  private processPostInsights(insights: any[], postId: string): FacebookMetrics {
    const metrics: any = {
      platform: 'facebook' as const,
      post_id: postId,
      collected_at: new Date(),
      reactions: {
        like: 0,
        love: 0,
        haha: 0,
        wow: 0,
        sad: 0,
        angry: 0
      }
    }
    
    for (const insight of insights) {
      const value = insight.values?.[0]?.value || 0
      
      switch (insight.name) {
        case 'post_impressions':
          metrics.impressions = value
          break
        case 'post_impressions_unique':
          metrics.reach = value
          break
        case 'post_engaged_users':
          metrics.engagement = value
          break
        case 'post_consumptions':
          metrics.clicks = value
          break
        case 'post_negative_feedback':
          // Store as negative feedback
          break
        case 'post_reactions_by_type_total':
          // Parse reactions breakdown
          if (insight.values?.[0]?.value) {
            const reactionsData = insight.values[0].value
            if (typeof reactionsData === 'object') {
              metrics.reactions = {
                like: reactionsData.like || 0,
                love: reactionsData.love || 0,
                haha: reactionsData.haha || 0,
                wow: reactionsData.wow || 0,
                sad: reactionsData.sad || 0,
                angry: reactionsData.angry || 0
              }
            }
          }
          break
        case 'post_video_views':
          metrics.video_views = value
          metrics.views = value
          break
        case 'post_video_watch_time':
          metrics.video_watch_time = value
          break
        case 'post_video_views_unique':
          metrics.unique_views = value
          break
        case 'post_video_views_organic':
          metrics.organic_reach = value
          break
        case 'post_video_views_paid':
          metrics.paid_reach = value
          break
      }
    }
    
    // Calculate total reactions
    if (metrics.reactions) {
      metrics.likes = Object.values(metrics.reactions).reduce((sum: number, count: any) => sum + (count as number), 0)
    }
    
    return metrics as FacebookMetrics
  }

  /**
   * Process video-specific insights
   */
  private processVideoInsights(insights: any[], postId: string): any {
    const videoData: any = {
      post_id: postId,
      platform: 'facebook'
    }
    
    for (const insight of insights) {
      const value = insight.values?.[0]?.value || 0
      
      switch (insight.name) {
        case 'post_video_avg_time_watched':
          videoData.avg_watch_time = value
          break
        case 'post_video_view_time_by_age_bucket_and_gender':
          videoData.view_time_demographics = insight.values?.[0]?.value
          break
        case 'post_video_view_time_by_country_id':
          videoData.view_time_by_country = insight.values?.[0]?.value
          break
      }
    }
    
    return videoData
  }

  /**
   * Store post analytics in the database
   */
  private async storePostAnalytics(postId: string, metrics: FacebookMetrics): Promise<void> {
    try {
      console.log(`[DB] Writing metrics to posts table for postId=${postId}:`, metrics)
      // Update the posts table directly with the latest metrics
      const { error: postUpdateError } = await supabaseAdmin
        .from('posts')
        .update({
          impressions: metrics.impressions || 0,
          reach: metrics.reach || 0,
          engagement: metrics.engagement || 0,
          clicks: metrics.clicks || 0,
          shares: metrics.shares || 0,
          comments: metrics.comments || 0,
          likes: metrics.likes || 0,
          views: metrics.views || metrics.video_views || 0,
          last_analytics_update: metrics.collected_at || new Date().toISOString(),
          facebook_metrics: {
            reactions: metrics.reactions,
            video_views: metrics.video_views,
            video_watch_time: metrics.video_watch_time,
            unique_views: metrics.unique_views,
            organic_reach: metrics.organic_reach,
            paid_reach: metrics.paid_reach
          }
        })
        .eq('id', postId)

      if (postUpdateError) {
        console.error('[DB] Error updating post metrics in posts table:', postUpdateError)
        await this.logError('update_post_metrics', postUpdateError, { postId, metrics })
        throw postUpdateError
      }
      console.log(`[DB] Successfully updated post metrics for postId=${postId}`)

      // Optionally, also update or insert into analytics table for historical tracking (optional, not required for dashboard)
      const { data: existing } = await supabaseAdmin
        .from('analytics')
        .select('id')
        .eq('post_id', postId)
        .eq('platform', 'facebook')
        .single()

      const analyticsData = {
        post_id: postId,
        platform: 'facebook',
        platform_post_id: metrics.post_id,
        impressions: metrics.impressions || 0,
        reach: metrics.reach || 0,
        engagement: metrics.engagement || 0,
        clicks: metrics.clicks || 0,
        shares: metrics.shares || 0,
        comments: metrics.comments || 0,
        likes: metrics.likes || 0,
        views: metrics.views || metrics.video_views || 0,
        watch_time_seconds: metrics.video_watch_time || 0,
        facebook_metrics: {
          reactions: metrics.reactions,
          video_views: metrics.video_views,
          video_watch_time: metrics.video_watch_time,
          unique_views: metrics.unique_views,
          organic_reach: metrics.organic_reach,
          paid_reach: metrics.paid_reach
        },
        collected_at: metrics.collected_at,
        next_update_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next update in 24 hours
      }

      if (existing) {
        // Update existing record
        await supabaseAdmin
          .from('analytics')
          .update(analyticsData)
          .eq('id', existing.id)
      } else {
        // Insert new record
        await supabaseAdmin
          .from('analytics')
          .insert(analyticsData)
      }

      console.log(`Analytics stored for Facebook post: ${metrics.post_id}`)
    } catch (error) {
      console.error('[DB] Error storing Facebook analytics:', error)
      await this.logError('store_post_analytics', error, { postId, metrics })
      throw error
    }
  }

  /**
   * Log analytics errors
   */
  private async logError(errorType: string, error: any, context?: any): Promise<void> {
    try {
      await supabaseAdmin
        .from('analytics_errors')
        .insert({
          platform: 'facebook',
          error_type: errorType,
          error_message: error.message || 'Unknown error',
          error_details: {
            ...context,
            stack: error.stack,
            response: error.response?.data
          }
        })
    } catch (logError) {
      console.error('Failed to log analytics error:', logError)
    }
  }
} 