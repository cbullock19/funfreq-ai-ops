'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { CaptionEditor } from '@/components/forms/CaptionEditor'
import { PlatformSelector } from '@/components/forms/PlatformSelector'
import { AIProcessingPanel } from '@/components/ai/AIProcessingPanel'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, 
  Play, 
  FileText, 
  Settings, 
  Send, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ExternalLink,
  AlertCircle
} from 'lucide-react'

interface Video {
  id: string
  title: string
  file_url: string
  file_size: number
  duration?: number
  transcript?: string
  ai_caption?: string
  ai_hashtags?: string[]
  ai_captions?: any // Platform-specific AI captions
  final_caption?: string
  final_hashtags?: string[]
  final_captions?: any // Platform-specific final captions
  status: string
  platforms: string[]
  published_platforms?: any // Platform-specific publishing results
  created_at: string
}

export default function ReviewPage() {
  const params = useParams()
  const videoId = params.id as string

  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const fetchVideo = useCallback(async () => {
    try {
      const response = await fetch(`/api/videos/${videoId}`)
      
      if (!response.ok) {
        throw new Error('Video not found')
      }

      const data = await response.json()
      setVideo(data.video)
      setSelectedPlatforms(data.video.platforms || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load video')
    } finally {
      setLoading(false)
    }
  }, [videoId])

  // Define AI processing functions first
  const handleGenerateTranscript = useCallback(async () => {
    if (!video) return

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId: video.id }),
      })

      if (response.ok) {
        toast.success('Transcription started! This may take a few minutes.')
        // Refresh video data to show status update
        setTimeout(fetchVideo, 2000)
      } else {
        toast.error('Failed to start transcription')
      }
    } catch {
      toast.error('Failed to start transcription')
    }
  }, [video, fetchVideo])

  const handleCaptionSave = async (captionData: { 
    caption: string; 
    hashtags: string[]; 
    platformCaptions: any 
  }) => {
    if (!video) return

    setSaving(true)
    try {
      const updatePayload: any = {
        platforms: selectedPlatforms,
        status: 'ready'
      }

      // Handle platform-specific captions or legacy format
      if (Object.keys(captionData.platformCaptions).length > 0) {
        updatePayload.final_captions = captionData.platformCaptions
        // Keep backward compatibility
        updatePayload.final_caption = captionData.caption
        updatePayload.final_hashtags = captionData.hashtags
      } else {
        // Legacy format
        updatePayload.final_caption = captionData.caption
        updatePayload.final_hashtags = captionData.hashtags
      }

      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      })

      if (!response.ok) {
        throw new Error('Failed to save changes')
      }

      const result = await response.json()
      setVideo(result.video)
      toast.success('Platform-optimized captions saved successfully!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!video || selectedPlatforms.length === 0) return

    setPublishing(true)
    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: video.id,
          platforms: selectedPlatforms
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Publishing failed')
      }

      const result = await response.json()
      
      // Check if any platforms were successfully published
      const successfulPlatforms = result.results?.filter((r: any) => r.success) || []
      const failedPlatforms = result.results?.filter((r: any) => !r.success) || []
      
      if (successfulPlatforms.length > 0) {
        const platformNames = successfulPlatforms.map((r: any) => r.platform).join(', ')
        toast.success(`Successfully published to ${platformNames}!`)
        
        // Show failed platforms if any
        if (failedPlatforms.length > 0) {
          const failedNames = failedPlatforms.map((r: any) => r.platform).join(', ')
          toast.error(`Failed to publish to ${failedNames}`)
        }
      } else if (result.skipped && result.skipped.length > 0) {
        toast.success(`Publishing started for ${result.platforms.length} platform(s)! ${result.skipped.length} platform(s) skipped due to missing credentials.`)
      } else {
        toast.success(`Publishing started for ${result.platforms.length} platform(s)!`)
      }
      
      // Refresh video data to show updated status, then check again in a few seconds
      fetchVideo()
      // More aggressive refresh for immediate status updates
      setTimeout(fetchVideo, 1000)
      setTimeout(fetchVideo, 2000)
      setTimeout(fetchVideo, 5000)
      setTimeout(fetchVideo, 10000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start publishing')
    } finally {
      setPublishing(false)
    }
  }

  // Effects that use the functions
  useEffect(() => {
    if (videoId) {
      fetchVideo()
    }
  }, [videoId, fetchVideo])

  // Auto-start transcription for newly uploaded videos
  useEffect(() => {
    if (video && video.status === 'uploaded' && !video.transcript) {
      console.log('Auto-starting transcription for newly uploaded video')
      handleGenerateTranscript()
    }
  }, [video, handleGenerateTranscript])

  const handleGenerateCaption = async () => {
    if (!video) return

    try {
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId: video.id }),
      })

      if (response.ok) {
        toast.success('Caption generation started!')
        setTimeout(fetchVideo, 2000)
      } else {
        toast.error('Failed to generate caption')
      }
    } catch {
      toast.error('Failed to generate caption')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error || !video) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-12">
                        <div className="mb-4">
                <XCircle className="w-16 h-16 text-red-400 mx-auto" />
              </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Video Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'The video you requested could not be found.'}
          </p>
          <Link href="/">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{video.title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                video.status === 'uploaded' ? 'bg-blue-100 text-blue-800' :
                video.status === 'transcribing' ? 'bg-yellow-100 text-yellow-800' :
                video.status === 'generating' ? 'bg-purple-100 text-purple-800' :
                video.status === 'ready' ? 'bg-green-100 text-green-800' :
                video.status === 'publishing' ? 'bg-purple-100 text-purple-800' :
                video.status === 'posted' ? 'bg-indigo-100 text-indigo-800' :
                video.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
              </span>
              <span className="text-gray-500">
                Uploaded {new Date(video.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Player */}
          <div className="space-y-6">
            <VideoPlayer src={video.file_url} title={video.title} />
            
            {/* Smart AI Processing Pipeline */}
            <AIProcessingPanel
              video={video}
              onTranscriptionStart={handleGenerateTranscript}
              onCaptionStart={handleGenerateCaption}
              onRefresh={fetchVideo}
            />

            {/* Transcript Display */}
            {video.transcript && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Transcript</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-gray-700 leading-relaxed">{video.transcript}</p>
                </div>
              </div>
            )}
          </div>

          {/* Caption Editor & Platform Selector */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Caption & Hashtags</h3>
              <CaptionEditor
                initialCaption={video.final_caption || video.ai_caption || ''}
                initialHashtags={video.final_hashtags || video.ai_hashtags || []}
                initialPlatformCaptions={video.final_captions || video.ai_captions || {}}
                onSave={handleCaptionSave}
                isGenerating={saving}
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Publishing Platforms</h3>
              <PlatformSelector
                selectedPlatforms={selectedPlatforms}
                onSelectionChange={setSelectedPlatforms}
              />
            </div>

            {/* Publish Actions */}
            {video.status === 'ready' && selectedPlatforms.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Ready to Publish!</h3>
                <p className="text-green-700 mb-4">
                  Your content is ready to be published to {selectedPlatforms.length} platform(s).
                </p>
                <Button 
                  className="w-full" 
                  onClick={handlePublish}
                  disabled={publishing}
                  loading={publishing}
                >
                  {publishing ? `Publishing to ${selectedPlatforms.length} platform(s)...` : 'Publish Now'}
                </Button>
              </div>
            )}

            {/* Platform-Specific Publishing Status */}
            {(video.status === 'publishing' || video.status === 'posted' || video.published_platforms) && (
              <div className="bg-white border rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Publishing Status</h3>
                  <Button
                    onClick={fetchVideo}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                  >
                    {loading ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
                  </Button>
                </div>
                
                {video.published_platforms ? (
                  <div className="space-y-3">
                    {Object.entries(video.published_platforms).map(([platform, status]: [string, any]) => (
                      <div key={platform} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="text-xl">
                            <PlatformIcon platform={platform as 'facebook' | 'instagram' | 'tiktok' | 'youtube'} size={24} />
                          </div>
                          <div>
                            <div className="font-medium capitalize">{platform}</div>
                            <div className="text-sm text-gray-600">
                              {status.status === 'posted' && (
                                <>
                                  <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                      Posted at {new Date(status.published_at).toLocaleString()}
                    </div>
                                  {status.post_url && (
                                    <a 
                                      href={status.post_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="ml-2 text-blue-600 hover:text-blue-800 underline"
                                    >
                                      View Post
                                    </a>
                                  )}
                                </>
                              )}
                              {status.status === 'failed' && (
                                <span className="text-red-600">
                                  <div className="flex items-center">
                      <XCircle className="w-4 h-4 text-red-600 mr-1" />
                      Failed: {status.error}
                    </div>
                                </span>
                              )}
                              {status.status === 'skipped' && (
                                <span className="text-yellow-600">
                                  ⏭️ Skipped: {status.reason}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          status.status === 'posted' ? 'bg-green-100 text-green-800' :
                          status.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {status.status}
                        </div>
                      </div>
                    ))}
                    
                    {/* Token Settings Button for Failed Publishes */}
                    {Object.values(video.published_platforms).some((status: any) => status.status === 'failed') && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-red-900 mb-1">Publishing Issues Detected</h4>
                            <p className="text-sm text-red-700">
                              Some platforms failed to publish. This is often due to token or permission issues.
                            </p>
                          </div>
                          <Link href="/settings">
                            <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                              Go to Token Settings
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ) : video.status === 'publishing' ? (
                  <div className="text-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-blue-700 font-medium">Publishing to selected platforms...</p>
                    <p className="text-sm text-gray-600 mt-1">This may take a few minutes</p>
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">No publishing attempts yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
} 