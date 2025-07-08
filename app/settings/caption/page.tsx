'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Header } from '@/components/layout/Header'
import { 
  FileText, 
  Settings, 
  Save, 
  RotateCcw, 
  Sparkles,
  MessageSquare,
  Target,
  Palette,
  Zap
} from 'lucide-react'

interface CaptionSettings {
  systemPrompt: string
  tone: 'professional' | 'casual' | 'enthusiastic' | 'humorous' | 'educational' | 'custom'
  customTone: string
  cta: string
  maxLength: number
  includeHashtags: boolean
  hashtagCount: number
  platformSpecific: boolean
  facebookPrompt: string
  instagramPrompt: string
  tiktokPrompt: string
  youtubePrompt: string
  customVariables: {
    brandName: string
    website: string
    handle: string
  }
}

const defaultSettings: CaptionSettings = {
  systemPrompt: `You are a social media expert. Create engaging, platform-optimized captions from video transcripts. Focus on:
- Hook the audience in the first line
- Keep it conversational and engaging
- Include relevant hashtags
- End with a strong call-to-action
- Optimize for each platform's best practices`,
  tone: 'casual',
  customTone: '',
  cta: 'What do you think? Drop a comment below! 👇',
  maxLength: 2200,
  includeHashtags: true,
  hashtagCount: 5,
  platformSpecific: true,
  facebookPrompt: `Facebook: Focus on community engagement, longer captions, and discussion starters.`,
  instagramPrompt: `Instagram: Visual storytelling, trending hashtags, and aesthetic appeal.`,
  tiktokPrompt: `TikTok: Trendy, short-form, viral potential, and youth-focused language.`,
  youtubePrompt: `YouTube: Detailed, educational, SEO-friendly, and community-focused.`,
  customVariables: {
    brandName: '',
    website: '',
    handle: ''
  }
}

export default function CaptionSettingsPage() {
  const [settings, setSettings] = useState<CaptionSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  useEffect(() => {
    loadCaptionSettings()
  }, [])

  const loadCaptionSettings = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/settings/caption')
      const result = await response.json()
      
      if (result.success) {
        setSettings({ ...defaultSettings, ...result.data })
      } else {
        // Use default settings if none exist
        setSettings(defaultSettings)
      }
    } catch (error) {
      console.error('Failed to load caption settings:', error)
      setSettings(defaultSettings)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      
      const response = await fetch('/api/settings/caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: 'Caption settings saved successfully!' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    setSettings(defaultSettings)
    setMessage({ type: 'info', text: 'Reset to default settings' })
  }

  const updateSetting = (key: keyof CaptionSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateCustomVariable = (key: keyof CaptionSettings['customVariables'], value: string) => {
    setSettings(prev => ({
      ...prev,
      customVariables: { ...prev.customVariables, [key]: value }
    }))
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
            <div className="flex items-center space-x-3 mb-2">
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Caption Settings</h1>
            </div>
            <p className="text-gray-600">
              Customize how AI generates captions for your videos
            </p>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
              message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
              'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
              {message.text}
            </div>
          )}

          <div className="space-y-8">
            {/* System Prompt */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">AI System Prompt</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                This is the main instruction given to the AI for generating captions. Customize it to match your brand voice and goals.
              </p>
              <textarea
                value={settings.systemPrompt}
                onChange={(e) => updateSetting('systemPrompt', e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your custom system prompt..."
              />
            </div>

            {/* Tone Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Palette className="w-5 h-5 text-orange-600" />
                <h2 className="text-xl font-semibold text-gray-900">Tone & Style</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                  <select
                    value={settings.tone}
                    onChange={(e) => updateSetting('tone', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="enthusiastic">Enthusiastic</option>
                    <option value="humorous">Humorous</option>
                    <option value="educational">Educational</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {settings.tone === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Tone Description</label>
                    <Input
                      value={settings.customTone}
                      onChange={(e) => updateSetting('customTone', e.target.value)}
                      placeholder="e.g., Friendly but authoritative, like a trusted mentor"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Call-to-Action */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Target className="w-5 h-5 text-red-600" />
                <h2 className="text-xl font-semibold text-gray-900">Call-to-Action</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                The CTA that will be added to the end of every caption. Use variables like {'{brandName}'}, {'{website}'}, {'{handle}'}.
              </p>
              <Input
                value={settings.cta}
                onChange={(e) => updateSetting('cta', e.target.value)}
                placeholder="What do you think? Drop a comment below! 👇"
              />
            </div>

            {/* Custom Variables */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-600" />
                <h2 className="text-xl font-semibold text-gray-900">Custom Variables</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                These variables can be used in your CTA and prompts using {'{brandName}'}, {'{website}'}, {'{handle}'}.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label>
                  <Input
                    value={settings.customVariables.brandName}
                    onChange={(e) => updateCustomVariable('brandName', e.target.value)}
                    placeholder="Your Brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <Input
                    value={settings.customVariables.website}
                    onChange={(e) => updateCustomVariable('website', e.target.value)}
                    placeholder="https://yoursite.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Social Handle</label>
                  <Input
                    value={settings.customVariables.handle}
                    onChange={(e) => updateCustomVariable('handle', e.target.value)}
                    placeholder="@yourhandle"
                  />
                </div>
              </div>
            </div>

            {/* Platform-Specific Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Platform-Specific Prompts</h2>
              </div>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.platformSpecific}
                    onChange={(e) => updateSetting('platformSpecific', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Use platform-specific prompts</span>
                </label>
              </div>

              {settings.platformSpecific && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                    <textarea
                      value={settings.facebookPrompt}
                      onChange={(e) => updateSetting('facebookPrompt', e.target.value)}
                      className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Facebook-specific instructions..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                    <textarea
                      value={settings.instagramPrompt}
                      onChange={(e) => updateSetting('instagramPrompt', e.target.value)}
                      className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Instagram-specific instructions..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">TikTok</label>
                    <textarea
                      value={settings.tiktokPrompt}
                      onChange={(e) => updateSetting('tiktokPrompt', e.target.value)}
                      className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="TikTok-specific instructions..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">YouTube</label>
                    <textarea
                      value={settings.youtubePrompt}
                      onChange={(e) => updateSetting('youtubePrompt', e.target.value)}
                      className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="YouTube-specific instructions..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Advanced Settings</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Caption Length</label>
                  <Input
                    type="number"
                    value={settings.maxLength}
                    onChange={(e) => updateSetting('maxLength', parseInt(e.target.value))}
                    min="100"
                    max="4000"
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.includeHashtags}
                      onChange={(e) => updateSetting('includeHashtags', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Include hashtags</span>
                  </label>
                  {settings.includeHashtags && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hashtag Count</label>
                      <Input
                        type="number"
                        value={settings.hashtagCount}
                        onChange={(e) => updateSetting('hashtagCount', parseInt(e.target.value))}
                        min="1"
                        max="30"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={saveSettings}
                  disabled={saving}
                  className="flex items-center space-x-2"
                >
                  {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                </Button>
                
                <Button
                  onClick={resetToDefaults}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset to Defaults</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 