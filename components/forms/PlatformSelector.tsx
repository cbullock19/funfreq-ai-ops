'use client'

import { PlatformIcon } from '@/components/ui/PlatformIcon'

interface Platform {
  id: string
  name: string
  platform: 'facebook' | 'instagram' | 'tiktok' | 'youtube'
  color: string
  brandColor: string
  description: string
  available: boolean
}

const PLATFORMS: Platform[] = [
  { 
    id: 'instagram', 
    name: 'Instagram', 
    platform: 'instagram',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500', 
    brandColor: '#FF0069',
    description: 'Reels and posts - Coming Soon',
    available: false
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    platform: 'facebook',
    color: 'bg-blue-600', 
    brandColor: '#0866FF',
    description: 'Posts and videos',
    available: true
  },
  { 
    id: 'tiktok', 
    name: 'TikTok', 
    platform: 'tiktok',
    color: 'bg-black', 
    brandColor: '#000000',
    description: 'Short-form videos - Coming Soon',
    available: false
  },
  { 
    id: 'youtube', 
    name: 'YouTube', 
    platform: 'youtube',
    color: 'bg-red-500', 
    brandColor: '#FF0000',
    description: 'Shorts and videos - Coming Soon',
    available: false
  }
]

interface PlatformSelectorProps {
  selectedPlatforms: string[]
  onSelectionChange: (platforms: string[]) => void
  disabled?: boolean
}

export function PlatformSelector({ 
  selectedPlatforms, 
  onSelectionChange,
  disabled = false
}: PlatformSelectorProps) {
  const togglePlatform = (platformId: string) => {
    if (disabled) return
    
    const isSelected = selectedPlatforms.includes(platformId)
    let newSelection: string[]
    
    if (isSelected) {
      newSelection = selectedPlatforms.filter(id => id !== platformId)
    } else {
      newSelection = [...selectedPlatforms, platformId]
    }
    
    onSelectionChange(newSelection)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PLATFORMS.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.id)
          const isDisabled = disabled || !platform.available
          
          return (
            <div
              key={platform.id}
              onClick={() => platform.available && togglePlatform(platform.id)}
              className={`
                relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                ${isSelected && platform.available
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${isDisabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:shadow-md'
                }
              `}
            >
              {/* Selection indicator */}
              {isSelected && platform.available && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  <PlatformIcon platform={platform.platform} size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{platform.name}</h3>
                    {!platform.available && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1">
                        🚧 Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{platform.description}</p>
                </div>
              </div>

              {platform.available && (
                <div className="mt-3">
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    Ready to publish
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selectedPlatforms.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Selected Platforms ({selectedPlatforms.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedPlatforms.map(platformId => {
              const platform = PLATFORMS.find(p => p.id === platformId)
              if (!platform) return null
              
              return (
                <div 
                  key={platformId}
                  className="flex items-center gap-1 bg-white border border-blue-300 rounded-full px-3 py-1 text-sm"
                >
                  <PlatformIcon platform={platform.platform} size={16} />
                  <span className="text-blue-900">{platform.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {selectedPlatforms.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm mb-2">
            Select at least one platform to publish your content
          </p>
          <p className="text-xs text-gray-400">
            🚧 More platforms coming soon! Facebook is fully functional and ready to publish.
          </p>
        </div>
      )}
    </div>
  )
} 