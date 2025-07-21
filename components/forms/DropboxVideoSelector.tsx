'use client'

import { useState, useEffect } from 'react'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Button } from '../ui/Button'
import { formatFileSize, formatDate } from '@/lib/dropbox'
import { Play, FileVideo, Calendar, HardDrive, AlertCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface DropboxFile {
  name: string
  path_lower: string
  size: number
  server_modified: string
  content_hash: string
}

interface Video {
  id: string
  title: string
  file_url: string
  file_size: number
}

interface DropboxVideoSelectorProps {
  onVideoSelected: (video: Video) => void
}

export function DropboxVideoSelector({ onVideoSelected }: DropboxVideoSelectorProps) {
  const [videos, setVideos] = useState<DropboxFile[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchVideos = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/dropbox/videos')
      const result = await response.json()

      if (result.success) {
        setVideos(result.videos)
      } else {
        setError(result.error || 'Failed to fetch videos from Dropbox')
      }
    } catch (err) {
      setError('Failed to connect to Dropbox. Please check your configuration.')
      console.error('Error fetching Dropbox videos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleVideoSelect = async (video: DropboxFile) => {
    try {
      setProcessing(video.name)
      setError(null)

      const response = await fetch('/api/dropbox/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: video.path_lower,
          fileName: video.name
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Processing ${video.name}...`)
        onVideoSelected(result.video)
      } else {
        setError(result.error || 'Failed to process video')
        toast.error('Failed to process video')
      }
    } catch (err) {
      setError('Failed to process video. Please try again.')
      toast.error('Failed to process video')
      console.error('Error processing video:', err)
    } finally {
      setProcessing(null)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="flex items-center justify-center space-x-3">
            <LoadingSpinner size="lg" />
            <div>
              <p className="text-lg font-medium text-gray-900">Loading videos from Dropbox...</p>
              <p className="text-sm text-gray-600">Fetching available videos from your Dropbox folder</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-900 mb-2">
                Unable to load videos from Dropbox
              </h3>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="flex space-x-3">
                <Button onClick={fetchVideos} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={() => window.location.href = '/settings'} 
                  variant="outline" 
                  size="sm"
                >
                  Check Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="mb-4">
            <FileVideo className="w-16 h-16 text-gray-400 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No videos found in Dropbox
          </h3>
          <p className="text-gray-600 mb-6">
            The Dropbox folder is empty or doesn't contain any video files.
          </p>
          <div className="flex justify-center space-x-3">
            <Button onClick={fetchVideos} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Available Videos ({videos.length})
          </h2>
          <p className="text-gray-600 mt-1">
            Select a video to process and add to your content pipeline
          </p>
        </div>
        <Button onClick={fetchVideos} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Video List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <div
            key={video.content_hash}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Video Preview */}
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <FileVideo className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Video Preview</p>
              </div>
            </div>

            {/* Video Info */}
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                {video.name}
              </h3>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-4 h-4" />
                  <span>{formatFileSize(video.size)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(video.server_modified)}</span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => handleVideoSelect(video)}
                disabled={processing === video.name}
                className="w-full"
                size="sm"
              >
                {processing === video.name ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Select & Process
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Play className="w-5 h-5 text-blue-600 mt-0.5" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              How it works
            </h4>
            <p className="text-sm text-blue-700">
              When you select a video, it will be automatically transcribed and prepared for caption generation. 
              The video will be processed using the existing AI pipeline (AssemblyAI → OpenAI → Facebook).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 