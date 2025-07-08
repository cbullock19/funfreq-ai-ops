import { NextRequest, NextResponse } from 'next/server'
import { AssemblyAI } from 'assemblyai'
import { supabaseAdmin } from '@/lib/supabase'
import { withRetry } from '@/lib/utils/retry'
import { APIError, RateLimitError } from '@/lib/errors/types'

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const { videoId } = await req.json()

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Video ID is required' },
        { status: 400 }
      )
    }

    if (!process.env.ASSEMBLYAI_API_KEY) {
      console.error('AssemblyAI API key not configured')
      return NextResponse.json(
        { success: false, error: 'Transcription service not configured' },
        { status: 500 }
      )
    }

    // Get video details from database
    const { data: video, error: fetchError } = await supabaseAdmin
      .from('videos')
      .select('file_url, title')
      .eq('id', videoId)
      .single()

    if (fetchError || !video) {
      console.error('Failed to fetch video:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

    // Update video status to show transcription started
    const { error: updateError } = await supabaseAdmin
      .from('videos')
      .update({ 
        status: 'transcribing',
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId)

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update video status' },
        { status: 500 }
      )
    }

    // Start background transcription process
    processTranscription(videoId, video.file_url, video.title)

    return NextResponse.json({
      success: true,
      message: 'Transcription started successfully'
    })

  } catch (error) {
    console.error('Transcription API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processTranscription(videoId: string, fileUrl: string, title: string) {
  try {
    console.log(`Starting transcription for video: ${title} (${videoId})`)

    // Submit transcription request to AssemblyAI with retry logic
    const transcript = await withRetry(async () => {
      try {
        const result = await client.transcripts.transcribe({
          audio: fileUrl,
          speech_model: 'best',
          language_detection: true,
          speaker_labels: false,
          format_text: true,
          punctuate: true,
          dual_channel: false,
        })

        if (result.status === 'error') {
          throw new APIError(`AssemblyAI transcription failed: ${result.error}`, 500, 'AssemblyAI', false)
        }

        return result
      } catch (error: unknown) {
        const apiError = error as { response?: { status: number }; message?: string }
        
        // Handle rate limiting - mark as retryable
        if (apiError.response?.status === 429) {
          throw new RateLimitError('AssemblyAI')
        }
        
        // Handle other API errors - mark as retryable for server errors
        if (apiError.response?.status && apiError.response.status >= 500) {
          throw new APIError(`AssemblyAI API error: ${apiError.message || 'Unknown error'}`, apiError.response.status, 'AssemblyAI', true)
        }

        // Client errors (4xx) are not retryable
        throw new APIError(`AssemblyAI API error: ${apiError.message || 'Unknown error'}`, apiError.response?.status || 400, 'AssemblyAI', false)
      }
    }, 3, 2000, (error) => (error as any).retryable === true)

    console.log(`Transcription completed for video ${videoId}`)

    // Update database with transcription results
    const { error: updateError } = await supabaseAdmin
      .from('videos')
      .update({
        transcript: transcript.text || 'No speech detected in the video.',
        transcript_confidence: transcript.confidence || 0,
        transcript_words: transcript.words?.length || 0,
        status: 'uploaded',
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId)

    if (updateError) {
      console.error('Failed to save transcription:', updateError)
      
      // Update status to show error
      await supabaseAdmin
        .from('videos')
        .update({
          status: 'error',
          error_message: 'Failed to save transcription results',
          updated_at: new Date().toISOString()
        })
        .eq('id', videoId)
      
      return
    }

    console.log(`Transcription saved successfully for video ${videoId}`)

  } catch (error) {
    console.error('Background transcription failed:', error)

    // Update video status to reflect error
    await supabaseAdmin
      .from('videos')
      .update({
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Transcription failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId)
  }
} 