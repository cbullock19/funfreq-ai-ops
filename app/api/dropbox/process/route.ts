import { NextRequest, NextResponse } from 'next/server'
import { createDropboxAPI } from '@/lib/dropbox'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { filePath, fileName } = await req.json()

    if (!filePath || !fileName) {
      return NextResponse.json(
        { success: false, error: 'File path and name are required' },
        { status: 400 }
      )
    }

    console.log('Processing Dropbox video:', { filePath, fileName })

    // Get temporary link from Dropbox
    const dropboxAPI = createDropboxAPI()
    const temporaryUrl = await dropboxAPI.getTemporaryLink(filePath)

    console.log('Got temporary URL from Dropbox, creating video record...')

    // Create video record in database
    const { data: videoData, error: dbError } = await supabaseAdmin
      .from('videos')
      .insert({
        title: fileName.replace(/\.[^/.]+$/, ''), // Remove file extension
        file_url: temporaryUrl,
        file_size: 0, // We don't know the exact size from Dropbox API
        status: 'uploaded',
        source: 'dropbox',
        dropbox_path: filePath
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
      title: videoData.title
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
        console.log('Auto-started transcription for Dropbox video:', videoData.id)
      } else {
        console.log('Failed to auto-start transcription, user can start manually')
      }
    } catch (error) {
      console.log('Error auto-starting transcription:', error)
      // Don't fail the process if transcription fails to start
    }

    // Optionally move the file to a processed folder
    const processedFolderPath = process.env.DROPBOX_PROCESSED_FOLDER_PATH
    if (processedFolderPath) {
      try {
        const processedPath = `${processedFolderPath}/${fileName}`
        await dropboxAPI.moveFile(filePath, processedPath)
        console.log('Moved file to processed folder:', processedPath)
      } catch (moveError) {
        console.error('Failed to move file to processed folder:', moveError)
        // Don't fail the process if moving fails
      }
    }

    return NextResponse.json({
      success: true,
      video: videoData
    })

  } catch (error) {
    console.error('Error processing Dropbox video:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process video'
      },
      { status: 500 }
    )
  }
} 