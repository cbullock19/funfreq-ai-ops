import { NextRequest, NextResponse } from 'next/server'
import { FacebookAnalytics } from '@/lib/analytics/facebook'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { platform } = await req.json()
    
    console.log(`Starting scheduled analytics update for platform: ${platform || 'all'}`)

    // Update Facebook analytics if requested or if no specific platform
    if (!platform || platform === 'facebook') {
      if (process.env.META_ACCESS_TOKEN && process.env.META_PAGE_ID) {
        try {
          const facebookAnalytics = new FacebookAnalytics()
          await facebookAnalytics.updateAllPostAnalytics()
          console.log('Facebook analytics updated successfully')
        } catch (error) {
          console.error('Failed to update Facebook analytics:', error)
          return NextResponse.json(
            { success: false, error: 'Failed to update Facebook analytics' },
            { status: 500 }
          )
        }
      } else {
        console.log('Facebook analytics not configured, skipping')
      }
    }

    // TODO: Add other platforms when they're connected
    // if (!platform || platform === 'instagram') {
    //   // Update Instagram analytics
    // }
    // if (!platform || platform === 'tiktok') {
    //   // Update TikTok analytics
    // }
    // if (!platform || platform === 'youtube') {
    //   // Update YouTube analytics
    // }

    // Update analytics configuration timestamps
    await updateAnalyticsConfig(platform || 'all')

    console.log('Scheduled analytics update completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Analytics updated successfully',
      platform: platform || 'all'
    })

  } catch (error) {
    console.error('Scheduled analytics update failed:', error)
    return NextResponse.json(
      { success: false, error: 'Analytics update failed' },
      { status: 500 }
    )
  }
}

/**
 * Update analytics configuration timestamps
 */
async function updateAnalyticsConfig(platform: string): Promise<void> {
  try {
    const now = new Date().toISOString()
    
    if (platform === 'all') {
      // Update all platforms
      await supabaseAdmin
        .from('analytics_config')
        .update({
          last_fetch_at: now,
          next_fetch_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
          consecutive_errors: 0,
          last_error: null,
          last_error_at: null
        })
        .eq('enabled', true)
    } else {
      // Update specific platform
      await supabaseAdmin
        .from('analytics_config')
        .update({
          last_fetch_at: now,
          next_fetch_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
          consecutive_errors: 0,
          last_error: null,
          last_error_at: null
        })
        .eq('platform', platform)
        .eq('enabled', true)
    }
  } catch (error) {
    console.error('Failed to update analytics config:', error)
  }
}

/**
 * GET endpoint for manual triggering
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const platform = searchParams.get('platform')
    
    console.log(`Manual analytics update triggered for platform: ${platform || 'all'}`)

    // Call the POST logic
    const response = await POST(req)
    return response

  } catch (error) {
    console.error('Manual analytics update failed:', error)
    return NextResponse.json(
      { success: false, error: 'Manual analytics update failed' },
      { status: 500 }
    )
  }
} 