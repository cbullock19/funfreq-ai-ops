import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const state = searchParams.get('state')

    if (error) {
      console.error('Facebook OAuth error:', error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/facebook-setup?error=${encodeURIComponent(error)}`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/facebook-setup?error=${encodeURIComponent('No authorization code received')}`
      )
    }

    console.log('Received Facebook OAuth code, exchanging for access token...')

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID!,
        client_secret: process.env.FACEBOOK_APP_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/facebook/oauth-callback`,
        code: code,
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/facebook-setup?error=${encodeURIComponent('Failed to exchange authorization code for token')}`
      )
    }

    const tokenData = await tokenResponse.json()
    const userAccessToken = tokenData.access_token

    console.log('Got user access token, getting page access token...')

    // Get the user's pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`
    )

    if (!pagesResponse.ok) {
      const errorText = await pagesResponse.text()
      console.error('Failed to get pages:', errorText)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/facebook-setup?error=${encodeURIComponent('Failed to get Facebook pages')}`
      )
    }

    const pagesData = await pagesResponse.json()
    const pages = pagesData.data

    if (!pages || pages.length === 0) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/facebook-setup?error=${encodeURIComponent('No Facebook pages found. Make sure you are an admin of the FunFreq page.')}`
      )
    }

    // Find the FunFreq page (you can make this configurable later)
    const funfreqPage = pages.find((page: any) => 
      page.name.toLowerCase().includes('funfreq') || 
      page.id === '604489102757371'
    )

    if (!funfreqPage) {
      console.log('Available pages:', pages.map((p: any) => ({ id: p.id, name: p.name })))
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/facebook-setup?error=${encodeURIComponent('FunFreq page not found. Available pages: ' + pages.map((p: any) => p.name).join(', '))}`
      )
    }

    console.log('Found FunFreq page:', funfreqPage.name, 'Getting page access token...')

    // Get the page access token
    const pageTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/${funfreqPage.id}?fields=access_token&access_token=${userAccessToken}`
    )

    if (!pageTokenResponse.ok) {
      const errorText = await pageTokenResponse.text()
      console.error('Failed to get page access token:', errorText)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/facebook-setup?error=${encodeURIComponent('Failed to get page access token. Make sure you are an admin of the page.')}`
      )
    }

    const pageTokenData = await pageTokenResponse.json()
    const pageAccessToken = pageTokenData.access_token

    console.log('Got page access token, exchanging for long-lived token...')

    // Exchange for long-lived token
    const longLivedResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID!,
        client_secret: process.env.FACEBOOK_APP_SECRET!,
        fb_exchange_token: pageAccessToken,
      })
    })

    if (!longLivedResponse.ok) {
      const errorText = await longLivedResponse.text()
      console.error('Failed to get long-lived token:', errorText)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/facebook-setup?error=${encodeURIComponent('Failed to get long-lived access token')}`
      )
    }

    const longLivedData = await longLivedResponse.json()
    console.log('Long-lived token response:', longLivedData)
    
    const longLivedToken = longLivedData.access_token
    const expiresIn = longLivedData.expires_in || 5184000 // Default to 60 days if not provided

    console.log('Got long-lived token, storing in database...')
    console.log('Token expires in:', expiresIn, 'seconds')

    // Calculate expiry date
    const expiresAt = new Date(Date.now() + (expiresIn * 1000))
    console.log('Token expires at:', expiresAt.toISOString())

    // Store in database
    const { error: dbError } = await supabase
      .from('facebook_tokens')
      .upsert({
        page_id: funfreqPage.id,
        page_name: funfreqPage.name,
        access_token: longLivedToken,
        expires_at: expiresAt.toISOString(),
        scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list', 'pages_manage_metadata'],
        is_active: true,
        last_refreshed: new Date().toISOString()
      }, {
        onConflict: 'page_id'
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/facebook-setup?error=${encodeURIComponent('Failed to save token to database: ' + dbError.message)}`
      )
    }

    console.log('Facebook page connected successfully!')

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/facebook-setup?success=true`
    )

  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/facebook-setup?error=${encodeURIComponent('Unexpected error during Facebook connection')}`
    )
  }
} 