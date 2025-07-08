import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withRetry } from '@/lib/utils/retry'
import { APIError } from '@/lib/errors/types'
import { facebookTokenManager } from '@/lib/facebook-token-manager'

// Helper function to check which platforms have valid credentials
async function checkPlatformCredentials(requestedPlatforms: string[]): Promise<string[]> {
  const availablePlatforms: string[] = []
  
  for (const platform of requestedPlatforms) {
    switch (platform) {
      case 'facebook':
        // Check if we have a valid token in the database
        const { data: tokenData } = await supabaseAdmin
          .from('facebook_tokens')
          .select('access_token, expires_at, is_active')
          .eq('is_active', true)
          .single()
        
        if (tokenData && tokenData.access_token) {
          // Check if token is not expired
          const now = new Date()
          const expiresAt = new Date(tokenData.expires_at)
          if (expiresAt > now) {
            availablePlatforms.push(platform)
          }
        }
        break
      case 'instagram':
      case 'tiktok':
      case 'youtube':
        // These platforms are coming soon - skip them for now
        break
      default:
        // Unknown platform, skip it
        break
    }
  }
  
  return availablePlatforms
}

export async function POST(req: NextRequest) {
  try {
    const { videoId, platforms } = await req.json()

    if (!videoId || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Video ID and platforms are required' },
        { status: 400 }
      )
    }

    // Get video data with platform-optimized captions
    const { data: video, error: fetchError } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single()

    if (fetchError || !video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

    // Validate video is ready for publishing
    if (!video.final_captions && !video.final_caption) {
      return NextResponse.json(
        { success: false, error: 'Video needs captions before publishing' },
        { status: 400 }
      )
    }

    // Update video status to publishing
    await supabaseAdmin
      .from('videos')
      .update({ 
        status: 'publishing',
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId)

    // Check which platforms have credentials configured
    const availablePlatforms = await checkPlatformCredentials(platforms)
    const skippedPlatforms = platforms.filter((p: string) => !availablePlatforms.includes(p))
    
    if (availablePlatforms.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No platforms have valid credentials configured. Please check your Facebook setup.',
        details: 'Currently only Facebook is available. Please connect your Facebook page in the admin settings.'
      }, { status: 400 })
    }

    // Start background publishing process with both available and skipped platforms
    await publishToplatforms(videoId, availablePlatforms, video, skippedPlatforms)

    // Trigger analytics update after publishing
    setTimeout(async () => {
      try {
        console.log('Triggering analytics update after publishing...')
        const facebookAnalytics = new (await import('@/lib/analytics/facebook')).FacebookAnalytics()
        await facebookAnalytics.updateAllPostAnalytics()
        console.log('Analytics updated after publishing')
      } catch (error) {
        console.error('Failed to update analytics after publishing:', error)
      }
    }, 5000) // Wait 5 seconds for posts to be published

    return NextResponse.json({
      success: true,
      message: `Publishing started for ${availablePlatforms.length} platform(s): ${availablePlatforms.join(', ')}`,
      platforms: availablePlatforms,
      skipped: platforms.filter((p: string) => !availablePlatforms.includes(p))
    })

  } catch (error) {
    console.error('Publishing API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function publishToplatforms(videoId: string, platforms: string[], video: any, skippedPlatforms: string[] = []) {
  const publishResults: any[] = []
  let hasErrors = false

  try {
    console.log(`Starting publishing for video: ${video.title} (${videoId}) to platforms: ${platforms.join(', ')}`)

    for (const platform of platforms) {
      try {
        let result
        
        switch (platform) {
          case 'instagram':
            result = await publishToInstagram(video)
            break
          case 'facebook': 
            result = await publishToFacebook(video)
            break
          case 'tiktok':
            result = { success: false, error: 'TikTok publishing not yet implemented' }
            break
          case 'youtube':
            result = { success: false, error: 'YouTube publishing not yet implemented' }
            break
          default:
            result = { success: false, error: `Unsupported platform: ${platform}` }
        }

        publishResults.push({
          platform,
          success: result.success,
          postId: result.postId || null,
          postUrl: result.postUrl || null,
          error: result.error || null
        })

        // Save individual post record
        if (result.success) {
          await supabaseAdmin
            .from('posts')
            .insert({
              video_id: videoId,
              platform: platform,
              platform_post_id: result.postId,
              post_url: result.postUrl,
              caption: getCaptionForPlatform(video, platform),
              hashtags: [], // Store empty array since hashtags are now part of caption
              status: 'posted',
              posted_at: new Date().toISOString()
            })
        } else {
          hasErrors = true
          console.error(`Failed to publish to ${platform}:`, result.error)
        }

      } catch (error) {
        hasErrors = true
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Error publishing to ${platform}:`, errorMessage)
        
        publishResults.push({
          platform,
          success: false,
          error: errorMessage
        })
      }
    }

    // Create published_platforms object for detailed tracking
    const publishedPlatforms: any = {}
    
    // Add results for platforms that were attempted
    for (const result of publishResults) {
      if (result.success) {
        publishedPlatforms[result.platform] = {
          status: 'posted',
          post_id: result.postId,
          post_url: result.postUrl,
          published_at: new Date().toISOString()
        }
      } else {
        publishedPlatforms[result.platform] = {
          status: 'failed',
          error: result.error,
          failed_at: new Date().toISOString()
        }
      }
    }

    // Add skipped platforms
    for (const platform of skippedPlatforms) {
      publishedPlatforms[platform] = {
        status: 'skipped',
        reason: 'No credentials configured',
        skipped_at: new Date().toISOString()
      }
    }

    // Update video with final status and detailed platform results
    const finalStatus = hasErrors ? (publishResults.some(r => r.success) ? 'posted' : 'failed') : 'posted'
    const successfulPlatforms = publishResults.filter(r => r.success).map(r => r.platform)
    
    await supabaseAdmin
      .from('videos')
      .update({
        status: finalStatus,
        platforms: successfulPlatforms,
        published_platforms: publishedPlatforms,
        error_message: hasErrors ? 'Some platforms failed to publish' : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId)

    console.log(`Publishing completed for video ${videoId}. Results:`, publishResults)

  } catch (error) {
    console.error('Critical error in publishing process:', error)
    
    await supabaseAdmin
      .from('videos')
      .update({
        status: 'failed',
        error_message: 'Publishing failed due to system error',
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId)
  }
}

async function publishToInstagram(video: any) {
  // Use separate Instagram credentials
  const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN
  const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID

  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
    return { 
      success: false, 
      error: 'Instagram credentials not configured. Please set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID in your environment variables.' 
    }
  }

  try {
    const caption = getCaptionForPlatform(video, 'instagram')
    // Use only the caption text - no separate hashtags to avoid duplication

    console.log('Publishing to Instagram:', { 
      videoUrl: video.file_url, 
      captionLength: caption.length,
      userIdLength: INSTAGRAM_USER_ID.length 
    })

    // Step 1: Create media container
    const containerResponse = await fetch(`https://graph.facebook.com/v18.0/${INSTAGRAM_USER_ID}/media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        media_type: 'REELS',
        video_url: video.file_url,
        caption: caption,
        access_token: INSTAGRAM_ACCESS_TOKEN
      })
    })

    if (!containerResponse.ok) {
      const error = await containerResponse.json()
      throw new Error(`Instagram container creation failed: ${error.error?.message || 'Unknown error'}`)
    }

    const containerData = await containerResponse.json()
    const creationId = containerData.id

    // Step 2: Publish the media
    const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${INSTAGRAM_USER_ID}/media_publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: INSTAGRAM_ACCESS_TOKEN
      })
    })

    if (!publishResponse.ok) {
      const error = await publishResponse.json()
      throw new Error(`Instagram publish failed: ${error.error?.message || 'Unknown error'}`)
    }

    const publishData = await publishResponse.json()

    return {
      success: true,
      postId: publishData.id,
      postUrl: `https://instagram.com/p/${publishData.id}`
    }

  } catch (error) {
    console.error('Instagram publish error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Instagram publishing failed. Check your INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID credentials.' 
    }
  }
}

async function publishToFacebook(video: any) {
  try {
    // Get the stored Facebook token from database
    const { data: tokenData, error: dbError } = await supabaseAdmin
      .from('facebook_tokens')
      .select('access_token, page_id, page_name, expires_at')
      .eq('is_active', true)
      .single()

    if (dbError || !tokenData) {
      return { 
        success: false, 
        error: 'Facebook page not connected. Please connect your Facebook page in the admin settings.' 
      }
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)
    if (expiresAt <= now) {
      return {
        success: false,
        error: 'Facebook token has expired. Please refresh the token in the admin settings.'
      }
    }

    const caption = getCaptionForPlatform(video, 'facebook')
    
    console.log('Publishing to Facebook:', { 
      videoUrl: video.file_url, 
      descriptionLength: caption.length,
      pageId: tokenData.page_id,
      pageName: tokenData.page_name
    })

    const response = await fetch(`https://graph.facebook.com/v18.0/${tokenData.page_id}/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_url: video.file_url,
        description: caption,
        access_token: tokenData.access_token
      })
    })

    if (!response.ok) {
      const error = await response.json()
      const errorMessage = error.error?.message || 'Unknown error'
      
      // If it's a token error, try to refresh and retry once
      if (errorMessage.includes('access token') || errorMessage.includes('session')) {
        console.log('Token error detected, attempting refresh...')
        
        // Try to refresh the token
        const refreshResponse = await fetch('/api/facebook/refresh-token', {
          method: 'POST'
        })
        
        if (refreshResponse.ok) {
          console.log('Token refreshed, retrying publish...')
          
          // Get the refreshed token from database
          const { data: refreshedTokenData } = await supabaseAdmin
            .from('facebook_tokens')
            .select('access_token')
            .eq('is_active', true)
            .single()
          
          if (refreshedTokenData) {
            const retryResponse = await fetch(`https://graph.facebook.com/v18.0/${tokenData.page_id}/videos`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                file_url: video.file_url,
                description: caption,
                access_token: refreshedTokenData.access_token
              })
            })

            if (retryResponse.ok) {
              const data = await retryResponse.json()
              return {
                success: true,
                postId: data.id,
                postUrl: `https://www.facebook.com/share/r/${data.id}/`
              }
            } else {
              const retryError = await retryResponse.json()
              throw new Error(`Facebook publish failed after token refresh: ${retryError.error?.message || 'Unknown error'}`)
            }
          }
        }
      }
      
      throw new Error(`Facebook publish failed: ${errorMessage}`)
    }

    const data = await response.json()

    return {
      success: true,
      postId: data.id,
      postUrl: `https://www.facebook.com/share/r/${data.id}/`
    }

  } catch (error) {
    console.error('Facebook publish error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Facebook publishing failed. Please check your Facebook setup.' 
    }
  }
}

function getCaptionForPlatform(video: any, platform: string): string {
  // Try platform-specific captions first
  if (video.final_captions && video.final_captions[platform]) {
    return video.final_captions[platform].caption
  }
  
  // Fall back to legacy caption
  return video.final_caption || video.ai_caption || ''
}

// Note: getHashtagsForPlatform is kept for UI reference but not used in publishing
// to avoid hashtag duplication. Users manage hashtags within the caption text.

function getHashtagsForPlatform(video: any, platform: string): string[] {
  // Try platform-specific hashtags first
  if (video.final_captions && video.final_captions[platform]) {
    return video.final_captions[platform].hashtags || []
  }
  
  // Fall back to legacy hashtags
  return video.final_hashtags || video.ai_hashtags || []
} 