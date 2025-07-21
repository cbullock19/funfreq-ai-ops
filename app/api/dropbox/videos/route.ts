import { NextRequest, NextResponse } from 'next/server'
import { createDropboxAPI } from '@/lib/dropbox'

export async function GET(req: NextRequest) {
  try {
    const dropboxAPI = createDropboxAPI()
    const folderPath = process.env.DROPBOX_VIDEO_FOLDER_PATH || '/Client Content Portals/FunFreq/Clipped Footage (Automation Step 1)'
    
    console.log('Fetching videos from Dropbox folder:', folderPath)
    
    const videos = await dropboxAPI.listDropboxVideos(folderPath)
    
    console.log(`Found ${videos.length} video files in Dropbox`)
    
    return NextResponse.json({
      success: true,
      videos: videos
    })
  } catch (error) {
    console.error('Error fetching Dropbox videos:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch videos from Dropbox'
      },
      { status: 500 }
    )
  }
} 