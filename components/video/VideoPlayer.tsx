interface VideoPlayerProps {
  src: string
  title: string
  className?: string
}

export function VideoPlayer({ src, title, className }: VideoPlayerProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className || ''}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      
      <div className="relative">
        <video 
          controls 
          className="w-full h-auto"
          preload="metadata"
        >
          <source src={src} type="video/mp4" />
          <source src={src} type="video/quicktime" />
          <source src={src} type="video/x-msvideo" />
          Your browser does not support the video tag.
        </video>
      </div>
      
      <div className="p-4 bg-gray-50">
        <p className="text-sm text-gray-600">
          💡 Use the controls to play, pause, and adjust volume. 
          The video will be processed for social media optimization.
        </p>
      </div>
    </div>
  )
} 