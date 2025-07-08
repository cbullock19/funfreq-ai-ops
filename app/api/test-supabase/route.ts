import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Testing Supabase configuration...')
    
    // Test basic connection
    const { data: authData, error: authError } = await supabase.auth.getSession()
    console.log('Auth test:', { data: authData, error: authError })
    
    // Test storage bucket access
    const { data: bucketData, error: bucketError } = await supabase.storage
      .from('videos')
      .list('', { limit: 1 })
    
    console.log('Bucket test:', { data: bucketData, error: bucketError })
    
    return NextResponse.json({
      success: true,
      auth: { data: authData, error: authError },
      storage: { data: bucketData, error: bucketError },
      config: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
      }
    })
  } catch (error) {
    console.error('Supabase test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 