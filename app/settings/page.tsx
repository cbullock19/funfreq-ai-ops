'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Header } from '@/components/layout/Header'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Settings, 
  AlertCircle,
  Shield,
  Key,
  FileText,
  Palette,
  Target,
  MessageSquare,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface PlatformConfig {
  platform: string
  enabled: boolean
  connected: boolean
  credentials: {
    accessToken?: string
    pageId?: string
    appId?: string
    appSecret?: string
    refreshToken?: string
    businessId?: string
    channelId?: string
  }
  status: 'connected' | 'disconnected' | 'error' | 'testing'
  lastSync?: string
  error?: string
  pageName?: string
  expiresAt?: string
  isExpiringSoon?: boolean
}

export default function SettingsPage() {
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([
    {
      platform: 'facebook',
      enabled: true,
      connected: false,
      credentials: {},
      status: 'disconnected'
    },
    {
      platform: 'instagram',
      enabled: false,
      connected: false,
      credentials: {},
      status: 'disconnected'
    },
    {
      platform: 'tiktok',
      enabled: false,
      connected: false,
      credentials: {},
      status: 'disconnected'
    },
    {
      platform: 'youtube',
      enabled: false,
      connected: false,
      credentials: {},
      status: 'disconnected'
    }
  ])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null)

  useEffect(() => {
    loadPlatformConfigurations()
  }, [])

  const loadPlatformConfigurations = async () => {
    try {
      setLoading(true)
      
      // Load platform configurations from API
      const response = await fetch('/api/settings/platforms')
      const result = await response.json()
      
      // Check Facebook token status
      const facebookResponse = await fetch('/api/facebook/token-status')
      const facebookData = await facebookResponse.json()
      
      const updatedPlatforms = platforms.map(platform => {
        const config = result.data?.find((c: any) => c.platform === platform.platform)
        
        if (platform.platform === 'facebook') {
          return {
            ...platform,
            enabled: config?.enabled || true,
            connected: facebookData.hasToken && facebookData.isValid,
            status: (facebookData.hasToken && facebookData.isValid ? 'connected' : 'disconnected') as 'connected' | 'disconnected' | 'error' | 'testing',
            pageName: facebookData.pageName,
            expiresAt: facebookData.expiresAt,
            isExpiringSoon: facebookData.isExpiringSoon,
            error: facebookData.error,
            lastSync: config?.last_fetch_at
          }
        }
        
        return {
          ...platform,
          enabled: config?.enabled || false,
          connected: false,
          status: 'disconnected' as 'connected' | 'disconnected' | 'error' | 'testing',
          lastSync: config?.last_fetch_at
        }
      })
      
      setPlatforms(updatedPlatforms)
    } catch (error) {
      console.error('Error loading platform configurations:', error)
      setMessage({ type: 'error', text: 'Failed to load platform configurations' })
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async (platform: string) => {
    try {
      const platformConfig = platforms.find(p => p.platform === platform)
      if (!platformConfig) return

      setPlatforms(prev => prev.map(p => 
        p.platform === platform 
          ? { ...p, status: 'testing' }
          : p
      ))

      if (platform === 'facebook') {
        const response = await fetch('/api/facebook/token-status')
        const result = await response.json()
        
        if (result.hasToken && result.isValid) {
          setPlatforms(prev => prev.map(p => 
            p.platform === platform 
              ? { 
                  ...p, 
                  status: 'connected', 
                  connected: true,
                  pageName: result.pageName,
                  expiresAt: result.expiresAt,
                  isExpiringSoon: result.isExpiringSoon,
                  error: undefined
                }
              : p
          ))
          setMessage({ type: 'success', text: 'Facebook connection successful!' })
        } else {
          setPlatforms(prev => prev.map(p => 
            p.platform === platform 
              ? { 
                  ...p, 
                  status: 'error', 
                  error: result.error || 'Connection failed',
                  connected: false
                }
              : p
          ))
          setMessage({ type: 'error', text: result.error || 'Facebook connection failed' })
        }
      } else {
        // Simulate testing for other platforms
        await new Promise(resolve => setTimeout(resolve, 1000))
        setPlatforms(prev => prev.map(p => 
          p.platform === platform 
            ? { ...p, status: 'disconnected' }
            : p
        ))
        setMessage({ type: 'info', text: `${platform.charAt(0).toUpperCase() + platform.slice(1)} integration coming soon!` })
      }
    } catch (error) {
      setPlatforms(prev => prev.map(p => 
        p.platform === platform 
          ? { ...p, status: 'error', error: 'Connection test failed' }
          : p
      ))
      setMessage({ type: 'error', text: 'Connection test failed' })
    }
  }

  const saveConfiguration = async () => {
    try {
      setSaving(true)
      
      const platform = platforms.find(p => p.platform === editingPlatform)
      if (!platform) {
        setMessage({ type: 'error', text: 'Platform not found' })
        return
      }

      const response = await fetch('/api/settings/platforms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: platform.platform,
          enabled: platform.enabled,
          credentials: platform.credentials
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Configuration saved successfully!' })
        setEditingPlatform(null)
        await loadPlatformConfigurations()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save configuration' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save configuration' })
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50 border-green-200'
      case 'disconnected': return 'text-gray-700 bg-gray-50 border-gray-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      case 'testing': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'disconnected': return <XCircle className="w-4 h-4 text-gray-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'testing': return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
            <p className="text-gray-700 mt-2">
              Configure your social media integrations and API credentials
            </p>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
              message.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Platform Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {platforms.map((platform) => (
              <div key={platform.platform} className="bg-white rounded-lg shadow-sm border flex flex-col">
                {/* Platform Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        <PlatformIcon platform={platform.platform as any} size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 capitalize">
                          {platform.platform}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(platform.status)}`}>
                            {getStatusIcon(platform.status)} {platform.status}
                          </span>
                          {platform.enabled && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Platform Content */}
                <div className="p-6 flex-1 flex flex-col">
                  {editingPlatform === platform.platform ? (
                    <div className="space-y-4 flex-1">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enable Platform
                        </label>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={platform.enabled}
                            onChange={(e) => setPlatforms(prev => prev.map(p => 
                              p.platform === platform.platform 
                                ? { ...p, enabled: e.target.checked }
                                : p
                            ))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Enable {platform.platform} integration
                          </span>
                        </div>
                      </div>

                      {platform.platform === 'facebook' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Access Token
                            </label>
                            <Input
                              type="password"
                              placeholder="Enter Facebook access token"
                              value={platform.credentials.accessToken || ''}
                              onChange={(e) => setPlatforms(prev => prev.map(p => 
                                p.platform === platform.platform 
                                  ? { ...p, credentials: { ...p.credentials, accessToken: e.target.value } }
                                  : p
                              ))}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Page ID
                            </label>
                            <Input
                              placeholder="Enter Facebook page ID"
                              value={platform.credentials.pageId || ''}
                              onChange={(e) => setPlatforms(prev => prev.map(p => 
                                p.platform === platform.platform 
                                  ? { ...p, credentials: { ...p.credentials, pageId: e.target.value } }
                                  : p
                              ))}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                App ID
                              </label>
                              <Input
                                placeholder="Facebook app ID"
                                value={platform.credentials.appId || ''}
                                onChange={(e) => setPlatforms(prev => prev.map(p => 
                                  p.platform === platform.platform 
                                    ? { ...p, credentials: { ...p.credentials, appId: e.target.value } }
                                    : p
                                ))}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                App Secret
                              </label>
                              <Input
                                type="password"
                                placeholder="Facebook app secret"
                                value={platform.credentials.appSecret || ''}
                                onChange={(e) => setPlatforms(prev => prev.map(p => 
                                  p.platform === platform.platform 
                                    ? { ...p, credentials: { ...p.credentials, appSecret: e.target.value } }
                                    : p
                                ))}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {platform.platform !== 'facebook' && (
                        <div className="text-center py-8">
                          <div className="mb-4">
                            <Settings className="w-12 h-12 text-gray-500 mx-auto" />
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 mb-2">
                            Coming Soon
                          </h4>
                          <p className="text-gray-700">
                            {platform.platform} integration will be available soon
                          </p>
                        </div>
                      )}

                      {platform.platform === 'facebook' && (
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-auto">
                          <Button
                            onClick={() => setEditingPlatform(null)}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={saveConfiguration}
                            disabled={saving}
                          >
                            {saving ? <LoadingSpinner size="sm" /> : 'Save Configuration'}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 flex-1">
                      {/* Status Information */}
                      <div className="space-y-3">
                        {platform.pageName && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 font-medium">Page</span>
                            <span className="text-sm font-medium text-gray-900">{platform.pageName}</span>
                          </div>
                        )}
                        {platform.expiresAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 font-medium">Expires</span>
                            <span className={`text-sm font-medium ${platform.isExpiringSoon ? 'text-yellow-600' : 'text-gray-900'}`}>
                              {new Date(platform.expiresAt).toLocaleDateString()}
                              {platform.isExpiringSoon && ' (Soon)'}
                            </span>
                          </div>
                        )}
                        {platform.lastSync && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 font-medium">Last Sync</span>
                            <span className="text-sm text-gray-900">
                              {new Date(platform.lastSync).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {platform.error && (
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {platform.error}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3 mt-auto pt-4 border-t border-gray-200">
                        {platform.platform === 'facebook' && !platform.connected && (
                          <Link href="/admin/facebook-setup" className="w-full">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Connect Facebook
                            </Button>
                          </Link>
                        )}
                        
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => testConnection(platform.platform)}
                            disabled={platform.status === 'testing'}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            {platform.status === 'testing' ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              'Test'
                            )}
                          </Button>
                          
                          <Button
                            onClick={() => setEditingPlatform(editingPlatform === platform.platform ? null : platform.platform)}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            {editingPlatform === platform.platform ? 'Cancel' : 'Configure'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Caption Settings */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Caption Generation</h2>
              <Link href="/settings/caption">
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Configure Captions
                </Button>
              </Link>
            </div>
            <p className="text-gray-700 mb-4">
              Customize how AI generates captions for your videos. Set tone, CTAs, platform-specific prompts, and more.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4 text-orange-600" />
                <span className="text-gray-700">Custom Tone & Style</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-red-600" />
                <span className="text-gray-700">Custom CTAs</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">Platform-Specific</span>
              </div>
            </div>
          </div>

          {/* API Documentation */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">API Documentation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Facebook Graph API</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>• <strong>Access Token:</strong> Generate from Facebook Developer Console</p>
                  <p>• <strong>Page ID:</strong> Your Facebook page ID</p>
                  <p>• <strong>Required Permissions:</strong> pages_manage_posts, pages_read_engagement</p>
                  <a href="https://developers.facebook.com/docs/graph-api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                    View Documentation →
                  </a>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Coming Soon</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>• <strong>Instagram:</strong> Basic Display API & Graph API</p>
                  <p>• <strong>TikTok:</strong> TikTok for Developers API</p>
                  <p>• <strong>YouTube:</strong> YouTube Data API v3</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 