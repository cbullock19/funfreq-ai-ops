import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { title, file_url, file_size, file_path } = await req.json()

    if (!title || !file_url || !file_size) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Creating video record:', { title, file_size })

    // Create video record in database
    const { data: videoData, error: dbError } = await supabaseAdmin
      .from('videos')
      .insert({
        title: title,
        file_url: file_url,
        file_size: file_size,
        status: 'uploaded'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Failed to save video record' },
        { status: 500 }
      )
    }

    console.log('Video record created successfully:', {
      id: videoData.id,
      title: videoData.title,
      size: videoData.file_size
    })

    // Auto-start transcription in background
    try {
      const transcribeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId: videoData.id }),
      })
      
      if (transcribeResponse.ok) {
        console.log('Auto-started transcription for video:', videoData.id)
      } else {
        console.log('Failed to auto-start transcription, user can start manually')
      }
    } catch (error) {
      console.log('Error auto-starting transcription:', error)
      // Don't fail the upload if transcription fails to start
    }

    return NextResponse.json({
      success: true,
      video: videoData,
      message: 'Video uploaded successfully',
      transcriptionStarted: true
    })

  } catch (error) {
    console.error('Record creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 