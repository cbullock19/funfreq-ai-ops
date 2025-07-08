import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { data: videos, error } = await supabaseAdmin
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching videos:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch videos'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      videos: videos || []
    })

  } catch (error) {
    console.error('Error in videos API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
} 