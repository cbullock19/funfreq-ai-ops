import { siFacebook, siInstagram, siTiktok, siYoutube } from 'simple-icons'

interface PlatformIconProps {
  platform: 'facebook' | 'instagram' | 'tiktok' | 'youtube'
  size?: number
  className?: string
}

const platformData = {
  facebook: siFacebook,
  instagram: siInstagram,
  tiktok: siTiktok,
  youtube: siYoutube
}

export function PlatformIcon({ platform, size = 24, className = '' }: PlatformIconProps) {
  const iconData = platformData[platform]
  
  if (!iconData) {
    console.error(`No icon data found for platform: ${platform}`)
    return null
  }

  // Create a simple fallback icon if path is not available
  if (!iconData.path) {
    console.error(`No path found for ${platform} icon`)
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          backgroundColor: `#${iconData.hex}`,
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: size * 0.6,
          fontWeight: 'bold'
        }}
        className={className}
      >
        {platform.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill={`#${iconData.hex}`}
      className={className}
    >
      <path d={iconData.path} />
    </svg>
  )
} 