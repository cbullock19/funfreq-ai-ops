import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Test if the facebook_tokens table exists
    const { data, error } = await supabase
      .from('facebook_tokens')
      .select('count')
      .limit(1)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        hint: 'The facebook_tokens table might not exist. Please run the database migration first.'
      })
    }

    // Check if there are any tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('facebook_tokens')
      .select('*')

    if (tokensError) {
      return NextResponse.json({
        success: false,
        error: tokensError.message
      })
    }

    return NextResponse.json({
      success: true,
      tableExists: true,
      tokenCount: tokens.length,
      tokens: tokens
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 