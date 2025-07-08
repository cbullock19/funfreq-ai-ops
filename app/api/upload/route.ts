import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// Configure for large file uploads
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes timeout

// Increase body size limit for this route
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    console.log('Starting video upload...')
    
    // Check content type
    const contentType = req.headers.get('content-type')
    console.log('Content-Type:', contentType)
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, error: 'Invalid content type. Expected multipart/form-data' },
        { status: 400 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('video') as File

    if (!file) {
      console.log('No video file provided')
      return NextResponse.json(
        { success: false, error: 'No video file provided' },
        { status: 400 }
      )
    }

    console.log('File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload MP4, MOV, AVI, or MKV files.' },
        { status: 400 }
      )
    }

    // Validate file size (500MB max)
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      console.log('File too large:', { size: file.size, maxSize })
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 500MB.' },
        { status: 400 }
      )
    }

    console.log('File validation passed, starting upload...')

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExtension}`
    const filePath = `videos/${fileName}`

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('videos')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Failed to upload video' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('videos')
      .getPublicUrl(filePath)

    // Create video record in database
    const { data: videoData, error: dbError } = await supabaseAdmin
      .from('videos')
      .insert({
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
        file_url: publicUrl,
        file_size: file.size,
        status: 'uploaded'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      
      // Clean up uploaded file
      await supabaseAdmin.storage
        .from('videos')
        .remove([filePath])

      return NextResponse.json(
        { success: false, error: 'Failed to save video record' },
        { status: 500 }
      )
    }

    console.log('Video uploaded successfully:', {
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
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 