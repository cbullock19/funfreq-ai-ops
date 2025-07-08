import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('caption_settings')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error
    }

    return NextResponse.json({
      success: true,
      data: data || {}
    })
  } catch (error) {
    console.error('Error fetching caption settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch caption settings'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json()

    // Upsert the settings (insert or update)
    const { data, error } = await supabase
      .from('caption_settings')
      .upsert({
        id: 1, // We'll use a single row for global settings
        settings: settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Caption settings saved successfully',
      data
    })
  } catch (error) {
    console.error('Error saving caption settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to save caption settings'
    }, { status: 500 })
  }
} 