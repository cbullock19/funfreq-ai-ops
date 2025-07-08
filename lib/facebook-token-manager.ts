// Facebook Token Manager
// Handles token validation, refresh, and error handling

interface TokenInfo {
  isValid: boolean
  expiresAt?: Date
  scopes?: string[]
  error?: string
}

interface RefreshTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export class FacebookTokenManager {
  private accessToken: string
  private pageId: string
  private appId: string
  private appSecret: string
  private refreshToken?: string

  constructor() {
    this.accessToken = process.env.META_ACCESS_TOKEN || ''
    this.pageId = process.env.META_PAGE_ID || ''
    this.appId = process.env.FACEBOOK_APP_ID || ''
    this.appSecret = process.env.FACEBOOK_APP_SECRET || ''
    this.refreshToken = process.env.META_ACCESS_TOKEN // Use the same token as refresh token for now
  }

  /**
   * Validate the current access token
   */
  async validateToken(): Promise<TokenInfo> {
    if (!this.accessToken) {
      return {
        isValid: false,
        error: 'No access token configured'
      }
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${this.accessToken}&access_token=${this.appId}|${this.appSecret}`
      )

      if (!response.ok) {
        return {
          isValid: false,
          error: 'Failed to validate token'
        }
      }

      const data = await response.json()
      
      if (data.data.is_valid) {
        return {
          isValid: true,
          expiresAt: new Date(data.data.expires_at * 1000),
          scopes: data.data.scopes
        }
      } else {
        return {
          isValid: false,
          error: data.data.error?.message || 'Token is invalid'
        }
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Token validation failed'
      }
    }
  }

  /**
   * Refresh the access token using refresh token
   */
  async refreshAccessToken(): Promise<{ success: boolean; newToken?: string; error?: string }> {
    if (!this.refreshToken || !this.appId || !this.appSecret) {
      return {
        success: false,
        error: 'Refresh token, app ID, or app secret not configured'
      }
    }

    try {
      const response = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'fb_exchange_token',
          client_id: this.appId,
          client_secret: this.appSecret,
          fb_exchange_token: this.refreshToken
        })
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error?.message || 'Token refresh failed'
        }
      }

      const data: RefreshTokenResponse = await response.json()
      
      // Update the access token
      this.accessToken = data.access_token
      
      // In a real app, you'd want to save this to your database
      console.log('Access token refreshed successfully')
      
      return {
        success: true,
        newToken: data.access_token
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed'
      }
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getValidToken(): Promise<{ token: string; error?: string }> {
    const tokenInfo = await this.validateToken()
    
    if (tokenInfo.isValid) {
      return { token: this.accessToken }
    }

    // Try to refresh the token
    const refreshResult = await this.refreshAccessToken()
    
    if (refreshResult.success && refreshResult.newToken) {
      return { token: refreshResult.newToken }
    }

    return {
      token: this.accessToken,
      error: refreshResult.error || tokenInfo.error || 'Unable to get valid token'
    }
  }

  /**
   * Check if token is about to expire (within 24 hours)
   */
  async isTokenExpiringSoon(): Promise<boolean> {
    const tokenInfo = await this.validateToken()
    
    if (!tokenInfo.isValid || !tokenInfo.expiresAt) {
      return false
    }

    const now = new Date()
    const expiresAt = tokenInfo.expiresAt
    const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    return hoursUntilExpiry < 24
  }

  /**
   * Get token status for debugging
   */
  async getTokenStatus(): Promise<{
    hasToken: boolean
    isValid: boolean
    expiresAt?: Date
    isExpiringSoon: boolean
    scopes?: string[]
    error?: string
    pageInfo?: {
      id: string
      name: string
      category: string
      role: string
      permissions: string[]
    }
  }> {
    const hasToken = !!this.accessToken
    const tokenInfo = await this.validateToken()
    const isExpiringSoon = await this.isTokenExpiringSoon()

    // Get page information if we have a page ID
    let pageInfo = undefined
    if (this.pageId && tokenInfo.isValid) {
      try {
        // First get the page details
        const pageResponse = await fetch(
          `https://graph.facebook.com/v18.0/${this.pageId}?fields=id,name,category&access_token=${this.accessToken}`
        )
        
        if (pageResponse.ok) {
          const pageData = await pageResponse.json()
          
          // Since the accounts endpoint isn't returning role/permissions, let's try to get the page access token
          // Only admins can get page access tokens, so if this succeeds, we know you're an admin
          const pageTokenResponse = await fetch(
            `https://graph.facebook.com/v18.0/${this.pageId}?fields=access_token&access_token=${this.accessToken}`
          )
          
          if (pageTokenResponse.ok) {
            const pageTokenData = await pageTokenResponse.json()
            console.log('Page token data:', pageTokenData)
            
            // If we can get a page access token, we have admin access
            pageInfo = {
              id: pageData.id,
              name: pageData.name,
              category: pageData.category,
              role: 'ADMIN', // If we can get page token, we're admin
              permissions: ['PUBLISH_VIDEO', 'MANAGE_PAGE', 'PUBLISH_POSTS'] // Standard admin permissions
            }
          } else {
            console.log('Failed to get page token, response:', await pageTokenResponse.text())
            
            // Fallback: try to get user accounts info
            const userResponse = await fetch(
              `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,role,permissions&access_token=${this.accessToken}`
            )
            
            if (userResponse.ok) {
              const userData = await userResponse.json()
              console.log('User accounts data:', JSON.stringify(userData, null, 2))
              
              const userPage = userData.data.find((page: any) => page.id === this.pageId)
              console.log('Found user page:', userPage)
              
              if (userPage) {
                pageInfo = {
                  id: pageData.id,
                  name: pageData.name,
                  category: pageData.category,
                  role: userPage.role || 'Unknown',
                  permissions: userPage.permissions || []
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to get page info:', error)
      }
    }

    return {
      hasToken,
      isValid: tokenInfo.isValid,
      expiresAt: tokenInfo.expiresAt,
      isExpiringSoon,
      scopes: tokenInfo.scopes,
      error: tokenInfo.error,
      pageInfo
    }
  }
}

// Export a singleton instance
export const facebookTokenManager = new FacebookTokenManager() 