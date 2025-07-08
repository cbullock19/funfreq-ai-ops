'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Header } from '@/components/layout/Header'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Key,
  Shield,
  ExternalLink
} from 'lucide-react'

interface TokenStatus {
  hasToken: boolean
  isValid: boolean
  expiresAt?: string
  isExpiringSoon: boolean
  scopes?: string[]
  error?: string
  recommendations: string[]
}

export default function FacebookTokenPage() {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    checkTokenStatus()
  }, [])

  const checkTokenStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/facebook/token-status')
      const result = await response.json()

      if (result.success) {
        setTokenStatus(result.data)
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      setMessage(`Failed to check token status: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const refreshToken = async () => {
    try {
      setRefreshing(true)
      setMessage(null)
      
      const response = await fetch('/api/facebook/token-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'refresh' })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMessage('Token refreshed successfully!')
        await checkTokenStatus() // Refresh the status
      } else {
        setMessage(`Failed to refresh token: ${result.error}`)
      }
    } catch (error) {
      setMessage(`Failed to refresh token: ${error}`)
    } finally {
      setRefreshing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Facebook Token Manager</h1>
            <p className="text-gray-600 mt-2">
              Check and manage your Facebook access token
            </p>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('successfully') ? 'bg-green-50 border border-green-200 text-green-800' :
              message.includes('Failed') ? 'bg-red-50 border border-red-200 text-red-800' :
              'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
              {message}
            </div>
          )}

          {/* Token Status */}
          {tokenStatus && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Token Status</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Basic Info</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 w-32">Has Token:</span>
                      <span className={`text-sm font-medium ${tokenStatus.hasToken ? 'text-green-600' : 'text-red-600'}`}>
                        {tokenStatus.hasToken ? (
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Yes
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <XCircle className="w-4 h-4 mr-1" />
                            No
                          </div>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 w-32">Is Valid:</span>
                      <span className={`text-sm font-medium ${tokenStatus.isValid ? 'text-green-600' : 'text-red-600'}`}>
                        {tokenStatus.isValid ? (
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Yes
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <XCircle className="w-4 h-4 mr-1" />
                            No
                          </div>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 w-32">Expiring Soon:</span>
                      <span className={`text-sm font-medium ${tokenStatus.isExpiringSoon ? 'text-orange-600' : 'text-green-600'}`}>
                        {tokenStatus.isExpiringSoon ? (
                          <div className="flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Yes
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            No
                          </div>
                        )}
                      </span>
                    </div>
                    {tokenStatus.expiresAt && (
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-32">Expires At:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(tokenStatus.expiresAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Scopes</h3>
                  {tokenStatus.scopes && tokenStatus.scopes.length > 0 ? (
                    <div className="space-y-1">
                      {tokenStatus.scopes.map((scope, index) => (
                        <div key={index} className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {scope}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No scopes available</p>
                  )}
                </div>
              </div>

              {tokenStatus.error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800">
                    <strong>Error:</strong> {tokenStatus.error}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {tokenStatus && tokenStatus.recommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h2>
              <div className="space-y-2">
                {tokenStatus.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span className="text-sm text-gray-700">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={checkTokenStatus}
                disabled={loading}
                variant="outline"
              >
                {loading ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
              
              <Button
                onClick={refreshToken}
                disabled={refreshing || !tokenStatus?.hasToken}
                variant="outline"
              >
                {refreshing ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Environment Variables Info */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              Required Environment Variables
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div><strong>META_ACCESS_TOKEN:</strong> Your Facebook access token</div>
              <div><strong>META_PAGE_ID:</strong> Your Facebook page ID</div>
              <div><strong>FACEBOOK_APP_ID:</strong> Your Facebook app ID (for token refresh)</div>
              <div><strong>FACEBOOK_APP_SECRET:</strong> Your Facebook app secret (for token refresh)</div>
              <div><strong>FACEBOOK_REFRESH_TOKEN:</strong> Your Facebook refresh token (for automatic refresh)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 