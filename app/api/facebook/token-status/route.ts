import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    // Get the stored token from database
    const { data: tokenData, error: dbError } = await supabase
      .from('facebook_tokens')
      .select('*')
      .eq('is_active', true)
      .single()

    if (dbError || !tokenData) {
      return NextResponse.json({
        hasToken: false,
        isValid: false,
        isExpiringSoon: false,
        pageName: null,
        error: 'No Facebook token found in database'
      })
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)
    const isExpired = expiresAt <= now
    const isExpiringSoon = !isExpired && (expiresAt.getTime() - now.getTime()) < (7 * 24 * 60 * 60 * 1000) // 7 days

    // If token is expired, mark it as invalid
    if (isExpired) {
      await supabase
        .from('facebook_tokens')
        .update({ is_active: false })
        .eq('id', tokenData.id)

      return NextResponse.json({
        hasToken: true,
        isValid: false,
        isExpiringSoon: false,
        pageName: tokenData.page_name,
        expiresAt: tokenData.expires_at,
        error: 'Token has expired'
      })
    }

    // Validate token with Facebook API
    try {
      const response = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${tokenData.access_token}&access_token=${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
      )

      if (response.ok) {
        const debugData = await response.json()
        
        if (debugData.data && debugData.data.is_valid) {
          return NextResponse.json({
            hasToken: true,
            isValid: true,
            isExpiringSoon,
            pageName: tokenData.page_name,
            expiresAt: tokenData.expires_at,
            scopes: tokenData.scopes
          })
        } else {
          // Token is invalid, mark as inactive
          await supabase
            .from('facebook_tokens')
            .update({ is_active: false })
            .eq('id', tokenData.id)

          return NextResponse.json({
            hasToken: true,
            isValid: false,
            isExpiringSoon: false,
            pageName: tokenData.page_name,
            error: debugData.data?.error?.message || 'Token is invalid'
          })
        }
      } else {
        return NextResponse.json({
          hasToken: true,
          isValid: false,
          isExpiringSoon: false,
          pageName: tokenData.page_name,
          error: 'Failed to validate token with Facebook'
        })
      }
    } catch (validationError) {
      console.error('Token validation error:', validationError)
      return NextResponse.json({
        hasToken: true,
        isValid: false,
        isExpiringSoon: false,
        pageName: tokenData.page_name,
        error: 'Failed to validate token'
      })
    }

  } catch (error) {
    console.error('Error getting token status:', error)
    return NextResponse.json({
      hasToken: false,
      isValid: false,
      isExpiringSoon: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json()
    
    switch (action) {
      case 'refresh':
        // Get the current token
        const { data: tokenData } = await supabase
          .from('facebook_tokens')
          .select('*')
          .eq('is_active', true)
          .single()

        if (!tokenData) {
          return NextResponse.json({
            success: false,
            error: 'No active token found to refresh'
          })
        }

        // Try to refresh the token
        const refreshResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'fb_exchange_token',
            client_id: process.env.FACEBOOK_APP_ID!,
            client_secret: process.env.FACEBOOK_APP_SECRET!,
            fb_exchange_token: tokenData.access_token,
          })
        })

        if (!refreshResponse.ok) {
          const errorText = await refreshResponse.text()
          return NextResponse.json({
            success: false,
            error: `Failed to refresh token: ${errorText}`
          })
        }

        const refreshData = await refreshResponse.json()
        
        // Update the token in database
        const expiresAt = new Date()
        expiresAt.setSeconds(expiresAt.getSeconds() + refreshData.expires_in)

        const { error: updateError } = await supabase
          .from('facebook_tokens')
          .update({
            access_token: refreshData.access_token,
            expires_at: expiresAt.toISOString(),
            last_refreshed: new Date().toISOString()
          })
          .eq('id', tokenData.id)

        if (updateError) {
          return NextResponse.json({
            success: false,
            error: 'Failed to update token in database'
          })
        }

        return NextResponse.json({
          success: true,
          message: 'Token refreshed successfully'
        })
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use "refresh"'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Token action error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to perform token action'
    }, { status: 500 })
  }
} 