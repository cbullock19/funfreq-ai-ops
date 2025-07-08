import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { data: platforms, error } = await supabaseAdmin
      .from('analytics_config')
      .select('*')
      .order('platform')

    if (error) {
      console.error('Error fetching platform configs:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch platform configurations'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: platforms
    })
  } catch (error) {
    console.error('Platform config fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { platform, enabled, credentials } = await req.json()

    if (!platform) {
      return NextResponse.json({
        success: false,
        error: 'Platform is required'
      }, { status: 400 })
    }

    // Update the platform configuration
    const { data, error } = await supabaseAdmin
      .from('analytics_config')
      .upsert({
        platform,
        enabled,
        access_token: credentials?.accessToken,
        page_id: credentials?.pageId,
        api_key: credentials?.appId,
        business_id: credentials?.appSecret,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'platform'
      })

    if (error) {
      console.error('Error saving platform config:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to save platform configuration'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: `${platform} configuration saved successfully`
    })
  } catch (error) {
    console.error('Platform config save error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
} 