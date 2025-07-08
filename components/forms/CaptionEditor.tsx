'use client'

import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { PlatformIcon } from '../ui/PlatformIcon'

interface PlatformCaption {
  caption: string
  hashtags: string[]
  char_count: number
}

interface PlatformCaptions {
  instagram?: PlatformCaption
  facebook?: PlatformCaption
  tiktok?: PlatformCaption
  youtube?: PlatformCaption
}

interface CaptionEditorProps {
  initialCaption?: string
  initialHashtags?: string[]
  initialPlatformCaptions?: PlatformCaptions
  onSave: (data: { caption: string; hashtags: string[]; platformCaptions: PlatformCaptions }) => void
  isGenerating?: boolean
}

const PLATFORM_CONFIGS = {
  instagram: { name: 'Instagram', platform: 'instagram', maxLength: 2200, color: 'pink', available: false },
  facebook: { name: 'Facebook', platform: 'facebook', maxLength: 500, color: 'blue', available: true },
  tiktok: { name: 'TikTok', platform: 'tiktok', maxLength: 150, color: 'black', available: false },
  youtube: { name: 'YouTube', platform: 'youtube', maxLength: 1000, color: 'red', available: false }
} as const

export function CaptionEditor({ 
  initialCaption = '', 
  initialHashtags = [], 
  initialPlatformCaptions = {},
  onSave,
  isGenerating = false 
}: CaptionEditorProps) {
  const [activePlatform, setActivePlatform] = useState<keyof typeof PLATFORM_CONFIGS>('instagram')
  const [platformCaptions, setPlatformCaptions] = useState<PlatformCaptions>(initialPlatformCaptions)
  
  // Fallback to legacy data if no platform-specific captions
  const [legacyCaption, setLegacyCaption] = useState(initialCaption)
  const [legacyHashtags, setLegacyHashtags] = useState(initialHashtags.join(' '))

  useEffect(() => {
    setPlatformCaptions(initialPlatformCaptions)
    setLegacyCaption(initialCaption)
    setLegacyHashtags(initialHashtags.join(' '))
  }, [initialCaption, initialHashtags, initialPlatformCaptions])

  const hasOptimizedCaptions = Object.keys(platformCaptions).length > 0

  const updatePlatformCaption = (platform: keyof typeof PLATFORM_CONFIGS, field: 'caption' | 'hashtags', value: string) => {
    setPlatformCaptions(prev => {
      const current = prev[platform] || { caption: '', hashtags: [], char_count: 0 }
      const updated = {
        ...current,
        [field]: field === 'hashtags' 
          ? value.split(' ').filter(tag => tag.startsWith('#') && tag.length > 1)
          : value
      }
      
      // Recalculate character count
      const caption = field === 'caption' ? value : updated.caption
      const hashtags = field === 'hashtags' 
        ? value.split(' ').filter(tag => tag.startsWith('#') && tag.length > 1)
        : updated.hashtags
      
      updated.char_count = caption.length + hashtags.join(' ').length + 2 // +2 for line breaks
      
      return {
        ...prev,
        [platform]: updated
      }
    })
  }

  const handleSave = () => {
    if (hasOptimizedCaptions) {
      // Save platform-optimized captions
      onSave({
        caption: platformCaptions.instagram?.caption || '',
        hashtags: platformCaptions.instagram?.hashtags || [],
        platformCaptions
      })
    } else {
      // Save legacy format
      const hashtagArray = legacyHashtags
        .split(' ')
        .filter(tag => tag.startsWith('#') && tag.length > 1)
        .map(tag => tag.trim())

      onSave({
        caption: legacyCaption.trim(),
        hashtags: hashtagArray,
        platformCaptions: {}
      })
    }
  }

  const getStatusColor = (charCount: number, maxLength: number) => {
    if (charCount <= maxLength * 0.8) return 'text-green-600'
    if (charCount <= maxLength) return 'text-yellow-600' 
    return 'text-red-600'
  }

  const getStatusIcon = (charCount: number, maxLength: number) => {
    if (charCount <= maxLength * 0.8) return '✅'
    if (charCount <= maxLength) return '⚠️'
    return '❌'
  }

  if (!hasOptimizedCaptions) {
    // Show legacy editor for backward compatibility
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600">🚀</span>
            <h4 className="text-sm font-medium text-blue-900">
              Generate Platform-Optimized Captions
            </h4>
          </div>
          <p className="text-sm text-blue-700">
            Use the "Generate Caption" button to create optimized versions for Instagram, Facebook, TikTok, and YouTube automatically!
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Caption
          </label>
          <textarea
            value={legacyCaption}
            onChange={(e) => setLegacyCaption(e.target.value)}
            placeholder="Write your caption here... Or generate platform-optimized versions!"
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isGenerating}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hashtags
          </label>
          <Input
            value={legacyHashtags}
            onChange={(e) => setLegacyHashtags(e.target.value)}
            placeholder="#faith #ai #truth #funfreq"
            disabled={isGenerating}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <p>Character count: <span className="font-medium">{legacyCaption.length + legacyHashtags.length}</span></p>
          </div>
          <Button 
            onClick={handleSave}
            disabled={isGenerating || !legacyCaption.trim()}
            loading={isGenerating}
          >
            Save Changes
          </Button>
        </div>
      </div>
    )
  }

  // Show platform-optimized editor
  const activeCaptionData = platformCaptions[activePlatform] || { caption: '', hashtags: [], char_count: 0 }
  const config = PLATFORM_CONFIGS[activePlatform]
  
  return (
    <div className="space-y-6">
      {/* Success banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-600">🎉</span>
          <h4 className="text-sm font-medium text-green-900">
            Platform-Optimized Captions Generated!
          </h4>
        </div>
        <p className="text-sm text-green-700">
          Your captions have been optimized for each platform's character limits and audience expectations. Facebook is ready to publish!
        </p>
      </div>

      {/* Platform tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {Object.entries(PLATFORM_CONFIGS).map(([platform, platformConfig]) => {
            const captionData = platformCaptions[platform as keyof typeof PLATFORM_CONFIGS]
            const isActive = platform === activePlatform
            const charCount = captionData?.char_count || 0
            const maxLength = platformConfig.maxLength
            const statusIcon = getStatusIcon(charCount, maxLength)
            
            return (
              <button
                key={platform}
                onClick={() => setActivePlatform(platform as keyof typeof PLATFORM_CONFIGS)}
                className={`
                  flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  ${!platformConfig.available ? 'opacity-60' : ''}
                `}
              >
                <PlatformIcon platform={platformConfig.platform} size={16} />
                <span>{platformConfig.name}</span>
                {!platformConfig.available && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-1 py-0.5 rounded text-[10px]">
                    🚧
                  </span>
                )}
                <span className="text-xs">{statusIcon}</span>
                <span className={`text-xs ${getStatusColor(charCount, maxLength)}`}>
                  {charCount}/{maxLength}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Active platform editor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlatformIcon platform={config.platform} size={24} />
            <h3 className="text-lg font-medium text-gray-900">{config.name}</h3>
            <span className={`text-sm px-2 py-1 rounded-full ${
              activeCaptionData.char_count <= config.maxLength 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {activeCaptionData.char_count <= config.maxLength ? 'Optimized' : 'Needs editing'}
            </span>
          </div>
          
          <div className={`text-sm font-medium ${getStatusColor(activeCaptionData.char_count, config.maxLength)}`}>
            {activeCaptionData.char_count}/{config.maxLength} characters
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Caption for {config.name}
          </label>
          <textarea
            value={activeCaptionData.caption}
            onChange={(e) => updatePlatformCaption(activePlatform, 'caption', e.target.value)}
            placeholder={`Write your ${config.name} caption here...`}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isGenerating}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hashtags for {config.name}
          </label>
          <Input
            value={activeCaptionData.hashtags.join(' ')}
            onChange={(e) => updatePlatformCaption(activePlatform, 'hashtags', e.target.value)}
            placeholder="#faith #ai #truth"
            disabled={isGenerating}
          />
        </div>

        {/* Platform-specific guidance */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-900 mb-1">{config.name} Best Practices:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {activePlatform === 'instagram' && (
              <>
                <li>• Use emojis and engaging storytelling</li>
                <li>• Ask questions to encourage engagement</li>
                <li>• Use up to 10 relevant hashtags</li>
                <li>• Include call-to-action</li>
              </>
            )}
            {activePlatform === 'facebook' && (
              <>
                <li>• Keep it professional yet warm</li>
                <li>• Focus on the key message</li>
                <li>• Use 3-5 strategic hashtags</li>
                <li>• Encourage meaningful discussion</li>
              </>
            )}
            {activePlatform === 'tiktok' && (
              <>
                <li>• Be short, punchy, and viral-focused</li>
                <li>• Use trending language</li>
                <li>• Maximum 3 hashtags</li>
                <li>• Hook viewers in the first few words</li>
              </>
            )}
            {activePlatform === 'youtube' && (
              <>
                <li>• Be descriptive and informative</li>
                <li>• Include relevant keywords</li>
                <li>• Use 5-8 hashtags for discoverability</li>
                <li>• Explain the video's value</li>
              </>
            )}
          </ul>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Preview for {config.name}:</h4>
          <div className="text-sm text-gray-700">
            <p className="mb-2">{activeCaptionData.caption}</p>
            {activeCaptionData.hashtags.length > 0 && (
              <p className="text-blue-600">{activeCaptionData.hashtags.join(' ')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-gray-600">
          <p>All platforms optimized and ready to publish!</p>
        </div>
        
        <Button 
          onClick={handleSave}
          disabled={isGenerating}
          loading={isGenerating}
          className="bg-green-600 hover:bg-green-700"
        >
          {isGenerating ? 'Saving...' : 'Save All Platform Captions'}
        </Button>
      </div>
    </div>
  )
} 
