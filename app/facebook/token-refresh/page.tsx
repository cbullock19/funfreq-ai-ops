'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function FacebookTokenRefreshPage() {
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [errorDetails, setErrorDetails] = useState<any>(null)

  const refreshToken = async () => {
    setLoading(true)
    setStatus('Refreshing token...')
    setErrorDetails(null)
    
    try {
      const response = await fetch('/api/facebook/refresh-token', {
        method: 'POST'
      })
      
      const result = await response.json()
      
      if (result.success) {
        setStatus('✅ Token refreshed successfully! You can now publish to Facebook.')
      } else {
        setStatus(`❌ Failed to refresh token: ${result.error}`)
        setErrorDetails(result)
      }
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Facebook Token Refresh</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">Token Expired</h2>
        <p className="text-yellow-700">
          Your Facebook access token has expired. This happens automatically for security reasons. 
          Click the button below to refresh it using your refresh token.
        </p>
      </div>

      <div className="space-y-4">
        <Button 
          onClick={refreshToken}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Refreshing...' : 'Refresh Facebook Token'}
        </Button>

        {status && (
          <div className={`p-4 rounded-lg ${
            status.includes('✅') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <p className={status.includes('✅') ? 'text-green-800' : 'text-red-800'}>
              {status}
            </p>
          </div>
        )}

        {errorDetails && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">Configuration Issue</h3>
            <p className="text-red-700 text-sm mb-3">
              The token refresh failed because some required environment variables are missing or incorrect.
            </p>
            
            <div className="space-y-2 text-sm">
              <h4 className="font-medium text-red-800">Required Environment Variables:</h4>
              <ul className="space-y-1 text-red-700">
                <li>• <code className="bg-red-100 px-1 rounded">FACEBOOK_REFRESH_TOKEN</code> - Your long-lived refresh token</li>
                <li>• <code className="bg-red-100 px-1 rounded">FACEBOOK_APP_ID</code> - Your Facebook App ID</li>
                <li>• <code className="bg-red-100 px-1 rounded">FACEBOOK_APP_SECRET</code> - Your Facebook App Secret</li>
              </ul>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-medium text-blue-800 mb-2">How to Fix:</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Go to your <code className="bg-blue-100 px-1 rounded">.env.local</code> file</li>
                <li>2. Add or update these variables with your Facebook app credentials</li>
                <li>3. Restart your development server</li>
                <li>4. Try refreshing the token again</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">What happens when you refresh:</h3>
        <ul className="space-y-2 text-gray-700">
          <li>• Your refresh token is used to get a new access token</li>
          <li>• The new token will be valid for about 60 days</li>
          <li>• You'll be able to publish to Facebook again</li>
          <li>• Analytics will continue to work</li>
        </ul>
      </div>

      <div className="mt-8 text-center space-y-2">
        <a 
          href="/settings" 
          className="text-blue-600 hover:underline"
        >
          ← Back to Settings
        </a>
        <br />
        <a 
          href="/upload" 
          className="text-blue-600 hover:underline"
        >
          ← Back to Upload
        </a>
      </div>
    </div>
  )
} 