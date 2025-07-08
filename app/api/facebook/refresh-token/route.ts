import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const refreshToken = process.env.META_ACCESS_TOKEN
    const appId = process.env.FACEBOOK_APP_ID
    const appSecret = process.env.FACEBOOK_APP_SECRET

    console.log('Token refresh attempt with:')
    console.log('- Refresh token exists:', !!refreshToken)
    console.log('- App ID exists:', !!appId)
    console.log('- App secret exists:', !!appSecret)

    if (!refreshToken || !appId || !appSecret) {
      return NextResponse.json({
        success: false,
        error: 'Refresh token, app ID, or app secret not configured'
      }, { status: 400 })
    }

    // First, let's check what type of token we have
    console.log('Checking token type...')
    const debugResponse = await fetch(`https://graph.facebook.com/debug_token?input_token=${refreshToken}&access_token=${appId}|${appSecret}`)
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json()
      console.log('Token debug info:', debugData)
      
      // If this is already a long-lived token, we don't need to refresh it
      if (debugData.data && debugData.data.type === 'PAGE' && debugData.data.is_valid) {
        console.log('Token is already valid and long-lived')
        return NextResponse.json({
          success: true,
          message: 'Token is already valid and long-lived',
          expiresIn: debugData.data.expires_at ? Math.floor((debugData.data.expires_at * 1000 - Date.now()) / 1000) : 'unknown'
        })
      }
    } else {
      console.log('Failed to debug token')
    }

    // Try to exchange the current token for a long-lived token
    console.log('Attempting to exchange for long-lived token...')
    const response = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: refreshToken,
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Facebook token refresh error:', errorData)
      console.error('Response status:', response.status)
      console.error('Response headers:', Object.fromEntries(response.headers.entries()))
      return NextResponse.json({
        success: false,
        error: `Facebook API error: ${response.status} ${response.statusText}`,
        details: errorData
      }, { status: 400 })
    }

    const data = await response.json()
    
    if (!data.access_token) {
      return NextResponse.json({
        success: false,
        error: 'No access token received from Facebook'
      }, { status: 400 })
    }

    // Update environment variable (this will only work for the current session)
    // In production, you'd want to store this in a database
    process.env.FACEBOOK_ACCESS_TOKEN = data.access_token

    console.log('Facebook access token refreshed successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      expiresIn: data.expires_in || 'unknown'
    })

  } catch (error) {
    console.error('Error refreshing Facebook token:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 