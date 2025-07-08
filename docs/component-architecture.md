# Component Architecture Guide

React component structure for FunFreq AI Ops. Clean, reusable, and easy to maintain.

## Project Structure

```
/components/
  /ui/              # Basic UI components
    Button.jsx
    Input.jsx
    Modal.jsx
    LoadingSpinner.jsx
    Toast.jsx
  /forms/           # Form components
    VideoUpload.jsx
    CaptionEditor.jsx
    PlatformSelector.jsx
  /video/           # Video-specific components
    VideoPlayer.jsx
    VideoCard.jsx
    VideoList.jsx
    TranscriptViewer.jsx
  /analytics/       # Dashboard components
    StatsCard.jsx
    PerformanceChart.jsx
    PlatformMetrics.jsx
  /layout/          # Layout components
    Header.jsx
    Sidebar.jsx
    Layout.jsx

/pages/
  index.jsx         # Dashboard
  upload.jsx        # Upload flow
  review/[id].jsx   # Review & edit
  analytics.jsx     # Analytics view

/hooks/             # Custom hooks
  useVideos.js
  useUpload.js
  useAnalytics.js

/lib/               # Utilities
  api.js
  utils.js
  constants.js
```

## Core Components

### 1. VideoUpload Component

```jsx
// components/forms/VideoUpload.jsx
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadVideo } from '../../lib/api'
import { Button } from '../ui/Button'
import { LoadingSpinner } from '../ui/LoadingSpinner'

export function VideoUpload({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploading(true)
    try {
      const result = await uploadVideo(file, {
        onProgress: setProgress
      })
      
      if (result.success) {
        onUploadComplete(result.video)
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    maxFiles: 1,
    disabled: uploading
  })

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        {...getRootProps()} 
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600">Uploading... {Math.round(progress)}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl">🎥</div>
            <div>
              <p className="text-lg font-medium">
                {isDragActive ? 'Drop your video here' : 'Drop video or click to upload'}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Supports MP4, MOV, AVI, MKV (max 500MB)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

### 2. CaptionEditor Component

```jsx
// components/forms/CaptionEditor.jsx
import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function CaptionEditor({ 
  initialCaption = '', 
  initialHashtags = [], 
  onSave,
  isGenerating = false 
}) {
  const [caption, setCaption] = useState(initialCaption)
  const [hashtags, setHashtags] = useState(initialHashtags.join(' '))
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    setCharCount(caption.length + hashtags.length)
  }, [caption, hashtags])

  const handleSave = () => {
    const hashtagArray = hashtags
      .split(' ')
      .filter(tag => tag.startsWith('#'))
      .map(tag => tag.trim())

    onSave({
      caption: caption.trim(),
      hashtags: hashtagArray
    })
  }

  const platformLimits = {
    instagram: 2200,
    facebook: 500,
    tiktok: 150
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Caption
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write your caption here..."
          className="w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isGenerating}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hashtags
        </label>
        <Input
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          placeholder="#faith #ai #truth #funfreq"
          disabled={isGenerating}
        />
        <p className="text-xs text-gray-500 mt-1">
          Separate hashtags with spaces
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Character count: {charCount}
          <div className="flex gap-4 mt-1">
            {Object.entries(platformLimits).map(([platform, limit]) => (
              <span 
                key={platform}
                className={`text-xs ${charCount > limit ? 'text-red-500' : 'text-green-500'}`}
              >
                {platform}: {charCount}/{limit}
              </span>
            ))}
          </div>
        </div>

        <Button 
          onClick={handleSave}
          disabled={isGenerating || !caption.trim()}
        >
          Save Changes
        </Button>
      </div>
    </div>
  )
}
```

### 3. PlatformSelector Component

```jsx
// components/forms/PlatformSelector.jsx
import { useState } from 'react'
import { Button } from '../ui/Button'

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: '📷', color: 'bg-pink-500' },
  { id: 'facebook', name: 'Facebook', icon: '👤', color: 'bg-blue-600' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-black' },
  { id: 'youtube', name: 'YouTube', icon: '📺', color: 'bg-red-500' }
]

export function PlatformSelector({ 
  selectedPlatforms = [], 
  onSelectionChange,
  onPublish,
  isPublishing = false 
}) {
  const [selected, setSelected] = useState(new Set(selectedPlatforms))

  const togglePlatform = (platformId) => {
    const newSelected = new Set(selected)
    if (newSelected.has(platformId)) {
      newSelected.delete(platformId)
    } else {
      newSelected.add(platformId)
    }
    setSelected(newSelected)
    onSelectionChange(Array.from(newSelected))
  }

  const handlePublish = () => {
    onPublish(Array.from(selected))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Select Platforms
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              onClick={() => togglePlatform(platform.id)}
              className={`
                relative p-4 rounded-lg border-2 transition-all
                ${selected.has(platform.id) 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full ${platform.color} flex items-center justify-center text-white text-lg`}>
                  {platform.icon}
                </div>
                <div className="text-left">
                  <div className="font-medium">{platform.name}</div>
                  <div className="text-sm text-gray-500">
                    {selected.has(platform.id) ? 'Selected' : 'Click to select'}
                  </div>
                </div>
              </div>
              
              {selected.has(platform.id) && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t pt-6">
        <Button
          onClick={handlePublish}
          disabled={selected.size === 0 || isPublishing}
          className="w-full"
          variant="primary"
        >
          {isPublishing ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Publishing to {selected.size} platform{selected.size > 1 ? 's' : ''}...
            </>
          ) : (
            `Publish to ${selected.size} platform${selected.size > 1 ? 's' : ''}`
          )}
        </Button>

        {selected.size > 0 && (
          <p className="text-sm text-gray-600 mt-2 text-center">
            Publishing to: {Array.from(selected).join(', ')}
          </p>
        )}
      </div>
    </div>
  )
}
```

### 4. VideoCard Component

```jsx
// components/video/VideoCard.jsx
import { Button } from '../ui/Button'
import { formatDate, formatDuration } from '../../lib/utils'

const STATUS_COLORS = {
  uploaded: 'bg-gray-100 text-gray-800',
  transcribing: 'bg-yellow-100 text-yellow-800',
  generating: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  publishing: 'bg-purple-100 text-purple-800',
  posted: 'bg-indigo-100 text-indigo-800',
  error: 'bg-red-100 text-red-800'
}

export function VideoCard({ video, onEdit, onView }) {
  const statusColor = STATUS_COLORS[video.status] || STATUS_COLORS.uploaded

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Video thumbnail */}
      <div className="aspect-video bg-gray-100 relative">
        <video 
          src={video.file_url} 
          className="w-full h-full object-cover"
          poster={video.thumbnail_url}
        />
        
        {/* Status badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {video.status}
        </div>

        {/* Duration */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-1">
          {video.title}
        </h3>

        {video.ai_caption && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {video.ai_caption}
          </p>
        )}

        {/* Platforms */}
        {video.platforms && video.platforms.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {video.platforms.map(platform => (
              <span 
                key={platform}
                className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {platform}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {formatDate(video.created_at)}
          </span>

          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onView(video)}
            >
              View
            </Button>
            
            {video.status === 'ready' && (
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => onEdit(video)}
              >
                Edit & Publish
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

## Custom Hooks

### useVideos Hook

```javascript
// hooks/useVideos.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useVideos() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setVideos(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateVideo = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      setVideos(prev => prev.map(v => v.id === id ? data : v))
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    videos,
    loading,
    error,
    refetch: fetchVideos,
    updateVideo
  }
}
```

### useUpload Hook

```javascript
// hooks/useUpload.js
import { useState } from 'react'
import { uploadVideo } from '../lib/api'

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const upload = async (file, options = {}) => {
    try {
      setUploading(true)
      setError(null)
      setProgress(0)

      const result = await uploadVideo(file, {
        onProgress: setProgress,
        ...options
      })

      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return {
    upload,
    uploading,
    progress,
    error
  }
}
```

## UI Components

### Button Component

```jsx
// components/ui/Button.jsx
import { forwardRef } from 'react'

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
  ghost: 'hover:bg-gray-100 text-gray-700',
  danger: 'bg-red-600 hover:bg-red-700 text-white'
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg'
}

export const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  className = '', 
  ...props 
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
})

Button.displayName = 'Button'
```

### Input Component

```jsx
// components/ui/Input.jsx
import { forwardRef } from 'react'

export const Input = forwardRef(({ 
  label, 
  error, 
  className = '', 
  ...props 
}, ref) => {
  const baseClasses = 'block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
  const errorClasses = error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
  
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`${baseClasses} ${errorClasses} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
```

### Modal Component

```jsx
// components/ui/Modal.jsx
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className={`relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
```

### LoadingSpinner Component

```jsx
// components/ui/LoadingSpinner.jsx
export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
  )
}
```

## Page Components

### Upload Page

```jsx
// pages/upload.jsx
import { useState } from 'react'
import { useRouter } from 'next/router'
import { VideoUpload } from '../components/forms/VideoUpload'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'

export default function UploadPage() {
  const router = useRouter()
  const [uploadedVideo, setUploadedVideo] = useState(null)

  const handleUploadComplete = (video) => {
    setUploadedVideo(video)
  }

  const handleContinue = () => {
    router.push(`/review/${uploadedVideo.id}`)
  }

  return (
    <Layout title="Upload Video">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload New Video</h1>
          <p className="text-gray-600 mt-2">
            Upload your video and we'll transcribe it and generate captions automatically
          </p>
        </div>

        {!uploadedVideo ? (
          <VideoUpload onUploadComplete={handleUploadComplete} />
        ) : (
          <div className="text-center space-y-6">
            <div className="text-6xl">✅</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Upload Complete!
              </h2>
              <p className="text-gray-600 mt-1">
                Your video "{uploadedVideo.title}" has been uploaded successfully.
              </p>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button 
                variant="secondary" 
                onClick={() => setUploadedVideo(null)}
              >
                Upload Another
              </Button>
              <Button onClick={handleContinue}>
                Continue to Review
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
```

### Review Page

```jsx
// pages/review/[id].jsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Layout } from '../../components/layout/Layout'
import { VideoPlayer } from '../../components/video/VideoPlayer'
import { CaptionEditor } from '../../components/forms/CaptionEditor'
import { PlatformSelector } from '../../components/forms/PlatformSelector'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useVideos } from '../../hooks/useVideos'
import { generateCaption, publishToPlatforms } from '../../lib/api'

export default function ReviewPage() {
  const router = useRouter()
  const { id } = router.query
  const { videos, updateVideo } = useVideos()
  
  const [video, setVideo] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState([])

  useEffect(() => {
    if (id && videos.length > 0) {
      const foundVideo = videos.find(v => v.id === id)
      setVideo(foundVideo)
    }
  }, [id, videos])

  const handleGenerateCaption = async () => {
    if (!video?.transcript) return
    
    try {
      setGenerating(true)
      const result = await generateCaption(video.transcript)
      
      if (result.success) {
        const updatedVideo = await updateVideo(video.id, {
          ai_caption: result.caption,
          ai_hashtags: result.hashtags,
          status: 'ready'
        })
        setVideo(updatedVideo)
      }
    } catch (error) {
      console.error('Caption generation failed:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveCaption = async (captionData) => {
    try {
      const updatedVideo = await updateVideo(video.id, {
        final_caption: captionData.caption,
        final_hashtags: captionData.hashtags
      })
      setVideo(updatedVideo)
    } catch (error) {
      console.error('Save failed:', error)
    }
  }

  const handlePublish = async (platforms) => {
    try {
      setPublishing(true)
      
      const result = await publishToPlatforms(video.id, platforms)
      
      if (result.success) {
        await updateVideo(video.id, {
          status: 'posted',
          platforms: platforms
        })
        
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Publishing failed:', error)
    } finally {
      setPublishing(false)
    }
  }

  if (!video) {
    return (
      <Layout title="Loading...">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={`Review: ${video.title}`}>
      <div className="max-w-6xl mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Player */}
          <div>
            <VideoPlayer video={video} />
            
            {video.transcript && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-2">Transcript</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 max-h-64 overflow-y-auto">
                  {video.transcript}
                </div>
              </div>
            )}
          </div>

          {/* Caption Editor */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Caption & Publishing
                </h2>
                
                {video.transcript && !video.ai_caption && (
                  <Button 
                    onClick={handleGenerateCaption}
                    disabled={generating}
                  >
                    {generating ? 'Generating...' : 'Generate Caption'}
                  </Button>
                )}
              </div>

              <CaptionEditor
                initialCaption={video.final_caption || video.ai_caption || ''}
                initialHashtags={video.final_hashtags || video.ai_hashtags || []}
                onSave={handleSaveCaption}
                isGenerating={generating}
              />
            </div>

            {(video.final_caption || video.ai_caption) && (
              <PlatformSelector
                selectedPlatforms={selectedPlatforms}
                onSelectionChange={setSelectedPlatforms}
                onPublish={handlePublish}
                isPublishing={publishing}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
```

## State Management Patterns

### Simple Global State (if needed)

```jsx
// hooks/useGlobalState.js
import { createContext, useContext, useReducer } from 'react'

const GlobalStateContext = createContext()

const initialState = {
  user: null,
  notifications: [],
  uploadQueue: []
}

function globalReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [...state.notifications, action.payload] 
      }
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      }
    case 'ADD_TO_UPLOAD_QUEUE':
      return {
        ...state,
        uploadQueue: [...state.uploadQueue, action.payload]
      }
    default:
      return state
  }
}

export function GlobalStateProvider({ children }) {
  const [state, dispatch] = useReducer(globalReducer, initialState)

  return (
    <GlobalStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalStateContext.Provider>
  )
}

export function useGlobalState() {
  const context = useContext(GlobalStateContext)
  if (!context) {
    throw new Error('useGlobalState must be used within GlobalStateProvider')
  }
  return context
}
```

## Component Testing Patterns

```jsx
// __tests__/components/VideoUpload.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VideoUpload } from '../../components/forms/VideoUpload'

// Mock the API
jest.mock('../../lib/api', () => ({
  uploadVideo: jest.fn()
}))

describe('VideoUpload', () => {
  it('handles file upload correctly', async () => {
    const mockOnComplete = jest.fn()
    const mockFile = new File([''], 'test.mp4', { type: 'video/mp4' })
    
    render(<VideoUpload onUploadComplete={mockOnComplete} />)
    
    const input = screen.getByRole('button')
    fireEvent.drop(input, {
      dataTransfer: { files: [mockFile] }
    })
    
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled()
    })
  })
})
```

---

This component architecture gives you:
- **Clean separation** of concerns
- **Reusable** UI components  
- **Custom hooks** for data logic
- **Consistent** patterns across the app
- **Easy testing** with clear component boundaries

The structure scales well as you add more features!