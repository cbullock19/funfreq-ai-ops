import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { supabaseAdmin } from '@/lib/supabase'
import { withRetry } from '@/lib/utils/retry'
import { APIError, RateLimitError } from '@/lib/errors/types'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Load caption settings from database
async function loadCaptionSettings() {
  try {
    const { data, error } = await supabase
      .from('caption_settings')
      .select('settings')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading caption settings:', error)
      return null
    }

    return data?.settings || null
  } catch (error) {
    console.error('Error loading caption settings:', error)
    return null
  }
}

// Default platform-specific configuration
const DEFAULT_PLATFORM_CONFIGS = {
  instagram: { maxLength: 2200, style: 'engaging with emojis and storytelling', hashtagCount: 10 },
  facebook: { maxLength: 500, style: 'professional yet warm', hashtagCount: 5 },
  tiktok: { maxLength: 150, style: 'short, punchy, and viral', hashtagCount: 3 },
  youtube: { maxLength: 1000, style: 'descriptive and informative', hashtagCount: 8 }
}

// Build system prompt with custom settings
function buildSystemPrompt(settings: any) {
  const configs = settings?.platformSpecific ? {
    instagram: { maxLength: settings.maxLength || 2200, style: settings.instagramPrompt || 'engaging with emojis and storytelling', hashtagCount: settings.hashtagCount || 10 },
    facebook: { maxLength: settings.maxLength || 500, style: settings.facebookPrompt || 'professional yet warm', hashtagCount: settings.hashtagCount || 5 },
    tiktok: { maxLength: settings.maxLength || 150, style: settings.tiktokPrompt || 'short, punchy, and viral', hashtagCount: settings.hashtagCount || 3 },
    youtube: { maxLength: settings.maxLength || 1000, style: settings.youtubePrompt || 'descriptive and informative', hashtagCount: settings.hashtagCount || 8 }
  } : DEFAULT_PLATFORM_CONFIGS

  const systemPrompt = settings?.systemPrompt || `You are a social media expert. Create engaging, platform-optimized captions from video transcripts. Focus on:
- Hook the audience in the first line
- Keep it conversational and engaging
- Include relevant hashtags
- End with a strong call-to-action
- Optimize for each platform's best practices`

  const tone = settings?.tone === 'custom' ? settings.customTone : settings?.tone || 'casual'
  const cta = settings?.cta || 'What do you think? Drop a comment below! 👇'
  
  // Replace variables in CTA
  const processedCta = cta
    .replace(/{brandName}/g, settings?.customVariables?.brandName || '')
    .replace(/{website}/g, settings?.customVariables?.website || '')
    .replace(/{handle}/g, settings?.customVariables?.handle || '')

  return `${systemPrompt}

TONE: ${tone}
CALL-TO-ACTION: ${processedCta}

PLATFORM SPECIFICATIONS:
- Instagram (max ${configs.instagram.maxLength} chars): ${configs.instagram.style}, up to ${configs.instagram.hashtagCount} hashtags
- Facebook (max ${configs.facebook.maxLength} chars): ${configs.facebook.style}, up to ${configs.facebook.hashtagCount} hashtags  
- TikTok (max ${configs.tiktok.maxLength} chars): ${configs.tiktok.style}, up to ${configs.tiktok.hashtagCount} hashtags
- YouTube (max ${configs.youtube.maxLength} chars): ${configs.youtube.style}, up to ${configs.youtube.hashtagCount} hashtags

OPTIMIZATION RULES:
1. Always preserve the core message and call-to-action
2. Adapt tone and length to platform expectations
3. Use strategic hashtags relevant to each platform's culture
4. Ensure each version stays within character limits
5. Maintain authentic messaging throughout

Return ONLY a JSON object with this exact structure:
{
  "instagram": {
    "caption": "Full engaging caption with emojis and storytelling",
    "hashtags": ["#relevant", "#hashtags"],
    "char_count": 0
  },
  "facebook": {
    "caption": "Professional yet warm shorter version",
    "hashtags": ["#relevant", "#hashtags"],
    "char_count": 0
  },
  "tiktok": {
    "caption": "Super short punchy version",
    "hashtags": ["#relevant", "#hashtags"],
    "char_count": 0
  },
  "youtube": {
    "caption": "Descriptive informational version",
    "hashtags": ["#relevant", "#hashtags"],
    "char_count": 0
  }
}`
}

export async function POST(req: NextRequest) {
  try {
    const { videoId } = await req.json()

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Video ID is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured')
      return NextResponse.json(
        { success: false, error: 'Caption generation service not configured' },
        { status: 500 }
      )
    }

    // Check if video has transcript
    const { data: video, error: fetchError } = await supabaseAdmin
      .from('videos')
      .select('transcript, title')
      .eq('id', videoId)
      .single()

    if (fetchError || !video?.transcript) {
      return NextResponse.json(
        { success: false, error: 'Video transcript is required for caption generation' },
        { status: 400 }
      )
    }

    // Update video status to show caption generation started
    const { error } = await supabaseAdmin
      .from('videos')
      .update({ 
        status: 'generating',
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update video status' },
        { status: 500 }
      )
    }

    // Start background caption generation process
    generatePlatformOptimizedCaptions(videoId, video.transcript, video.title)

    return NextResponse.json({
      success: true,
      message: 'Platform-optimized caption generation started successfully'
    })

  } catch (error) {
    console.error('Caption generation API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generatePlatformOptimizedCaptions(videoId: string, transcript: string, title: string) {
  try {
    console.log(`Starting platform-optimized caption generation for video: ${title} (${videoId})`)

    // Load custom caption settings
    const captionSettings = await loadCaptionSettings()

    // Generate platform-specific captions with OpenAI using retry logic
    const captionResults = await withRetry(async () => {
      try {
        // Build system prompt with custom settings
        const systemPrompt = buildSystemPrompt(captionSettings)
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user", 
              content: `Video Title: ${title}

              Video Transcript:
              ${transcript}
              
              Generate platform-optimized captions for this faith-based content. Each platform version should:
              - Stay within character limits
              - Match platform culture and expectations  
              - Preserve core message and call-to-action
              - Use appropriate hashtags for each platform
              - Encourage engagement through questions or hooks
              - Direct traffic to funfreq.com when appropriate`
            }
          ],
          max_tokens: 1500,
          temperature: 0.7,
        })

        const content = completion.choices[0]?.message?.content
        if (!content) {
          throw new APIError('No content generated by OpenAI', 500, 'OpenAI', false)
        }

        // Parse the JSON response
        const parsed = JSON.parse(content)
        
        // Validate structure and calculate character counts
        const platforms = ['instagram', 'facebook', 'tiktok', 'youtube']
        for (const platform of platforms) {
          if (!parsed[platform] || !parsed[platform].caption || !Array.isArray(parsed[platform].hashtags)) {
            throw new APIError(`Invalid response format for ${platform}`, 500, 'OpenAI', false)
          }
          
          // Calculate actual character count
          const caption = parsed[platform].caption
          const hashtags = parsed[platform].hashtags.join(' ')
          const totalLength = caption.length + (hashtags ? hashtags.length + 2 : 0) // +2 for line breaks
          parsed[platform].char_count = totalLength
          
          // Apply intelligent truncation if needed
          const maxLength = DEFAULT_PLATFORM_CONFIGS[platform as keyof typeof DEFAULT_PLATFORM_CONFIGS].maxLength
          if (totalLength > maxLength) {
            parsed[platform] = intelligentTruncate(parsed[platform], maxLength)
          }
        }

        return parsed
      } catch (error: unknown) {
        const apiError = error as { status?: number; message?: string }
        
        // Handle rate limiting
        if (apiError.status === 429) {
          throw new RateLimitError('OpenAI')
        }
        
        // Handle server errors as retryable
        if (apiError.status && apiError.status >= 500) {
          throw new APIError(`OpenAI API error: ${apiError.message || 'Unknown error'}`, apiError.status, 'OpenAI', true)
        }

        // JSON parsing or client errors are not retryable
        throw new APIError(`Caption generation failed: ${apiError.message || 'Unknown error'}`, apiError.status || 400, 'OpenAI', false)
      }
    }, 3, 2000, (error) => (error as any).retryable === true)

    console.log(`Platform-optimized captions generated successfully for video ${videoId}`)

    // Update database with generated content (keep backward compatibility)
    const { error: updateError } = await supabaseAdmin
      .from('videos')
      .update({
        ai_captions: captionResults,
        // Keep backward compatibility
        ai_caption: captionResults.instagram.caption,
        ai_hashtags: captionResults.instagram.hashtags,
        status: 'uploaded',
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId)

    if (updateError) {
      console.error('Failed to save generated captions:', updateError)
      
      // Update status to show error
      await supabaseAdmin
        .from('videos')
        .update({
          status: 'error',
          error_message: 'Failed to save generated captions',
          updated_at: new Date().toISOString()
        })
        .eq('id', videoId)
      
      return
    }

    console.log(`Platform-optimized captions saved successfully for video ${videoId}`)

  } catch (error) {
    console.error('Background caption generation failed:', error)

    // Update video status to reflect error
    await supabaseAdmin
      .from('videos')
      .update({
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Caption generation failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId)
  }
}

// Intelligent truncation that preserves important content
function intelligentTruncate(platformData: any, maxLength: number) {
  const { caption, hashtags } = platformData
  const hashtagString = hashtags.join(' ')
  const hashtagLength = hashtagString.length + 2 // +2 for line breaks
  const availableForCaption = maxLength - hashtagLength - 20 // -20 buffer for safety
  
  if (caption.length <= availableForCaption) {
    return {
      ...platformData,
      char_count: caption.length + hashtagLength
    }
  }
  
  // Find the last complete sentence that fits
  const sentences = caption.split(/[.!?]+/).filter((s: string) => s.trim())
  let truncated = ''
  let lastSentence = ''
  
  for (const sentence of sentences) {
    const testLength = (truncated + sentence + '. ').length
    if (testLength <= availableForCaption - 50) { // -50 for CTA
      truncated += sentence + '. '
      lastSentence = sentence
    } else {
      break
    }
  }
  
  // If truncated is too short, try word-level truncation of the last sentence
  if (truncated.length < availableForCaption * 0.5 && lastSentence) {
    const words = caption.split(' ')
    truncated = ''
    for (const word of words) {
      const testLength = (truncated + word + ' ').length
      if (testLength <= availableForCaption - 30) { // -30 for ellipsis and CTA
        truncated += word + ' '
      } else {
        break
      }
    }
  }
  
  // Ensure we have a call-to-action
  const cta = ' Visit funfreq.com 🙏'
  if (truncated.length + cta.length <= availableForCaption) {
    truncated += cta
  } else {
    truncated = truncated.substring(0, availableForCaption - cta.length - 3) + '...' + cta
  }
  
  return {
    ...platformData,
    caption: truncated.trim(),
    char_count: truncated.length + hashtagLength
  }
} 