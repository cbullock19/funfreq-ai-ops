'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { CheckCircle, AlertCircle, Facebook, ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'

interface TokenStatus {
  hasToken: boolean
  isValid: boolean
  expiresAt?: string
  isExpiringSoon: boolean
  pageName?: string
  error?: string
}

export default function FacebookSetupPage() {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    checkTokenStatus()
  }, [])

  const checkTokenStatus = async () => {
    try {
      const response = await fetch('/api/facebook/token-status')
      const data = await response.json()
      setTokenStatus(data)
    } catch (error) {
      console.error('Error checking token status:', error)
      setTokenStatus({
        hasToken: false,
        isValid: false,
        isExpiringSoon: false,
        error: 'Failed to check token status'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const connectFacebook = async () => {
    setIsConnecting(true)
    try {
      // Redirect to Facebook OAuth
      const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '785609927363822'
      const redirectUri = encodeURIComponent(`${window.location.origin}/api/facebook/oauth-callback`)
      const scope = encodeURIComponent('pages_manage_posts,pages_read_engagement,pages_show_list,pages_manage_metadata')
      
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${Date.now()}`
      
      window.location.href = authUrl
    } catch (error) {
      console.error('Error starting Facebook connection:', error)
      setIsConnecting(false)
    }
  }

  const refreshToken = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/facebook/refresh-token', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        await checkTokenStatus()
      } else {
        console.error('Token refresh failed:', data.error)
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Checking Facebook connection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="font-medium">Back to App</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                <Home className="h-5 w-5 mr-2" />
                <span className="font-medium">Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="flex items-center mb-8">
              <Facebook className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Facebook Setup</h1>
                <p className="text-gray-600">Connect your FunFreq Facebook page for seamless publishing</p>
              </div>
            </div>

            {/* Token Status */}
            {tokenStatus && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Status</h2>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    {tokenStatus.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <span className="font-medium">
                      {tokenStatus.isValid ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>

                  {tokenStatus.pageName && (
                    <p className="text-sm text-gray-600 mb-2">
                      Page: <span className="font-medium">{tokenStatus.pageName}</span>
                    </p>
                  )}

                  {tokenStatus.expiresAt && (
                    <p className="text-sm text-gray-600 mb-2">
                      Expires: <span className="font-medium">{new Date(tokenStatus.expiresAt).toLocaleDateString()}</span>
                      {tokenStatus.isExpiringSoon && (
                        <span className="ml-2 text-orange-600 font-medium">(Expiring soon)</span>
                      )}
                    </p>
                  )}

                  {tokenStatus.error && (
                    <p className="text-sm text-red-600 mt-2">{tokenStatus.error}</p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              {!tokenStatus?.isValid ? (
                <Button
                  onClick={connectFacebook}
                  disabled={isConnecting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isConnecting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Connecting to Facebook...
                    </>
                  ) : (
                    <>
                      <Facebook className="h-4 w-4 mr-2" />
                      Connect Facebook Page
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button
                    onClick={refreshToken}
                    disabled={isRefreshing}
                    variant="outline"
                    className="w-full"
                  >
                    {isRefreshing ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Refreshing Token...
                      </>
                    ) : (
                      'Refresh Token'
                    )}
                  </Button>
                  
                  <Button
                    onClick={connectFacebook}
                    disabled={isConnecting}
                    variant="outline"
                    className="w-full"
                  >
                    {isConnecting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Reconnecting...
                      </>
                    ) : (
                      'Reconnect Facebook Page'
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Click "Connect Facebook Page" to authorize access to your FunFreq page</li>
                <li>• We'll request permissions to manage posts and read engagement data</li>
                <li>• We'll get a long-lived access token (60 days) for seamless publishing</li>
                <li>• The token will automatically refresh before it expires</li>
                <li>• Once connected, anyone on your team can publish without Facebook setup</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 