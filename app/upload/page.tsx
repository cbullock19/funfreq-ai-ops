'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/Layout'
import { VideoUpload } from '@/components/forms/VideoUpload'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  Upload, 
  Video, 
  FileText, 
  Settings, 
  Sparkles, 
  Smartphone, 
  CheckCircle,
  Lightbulb
} from 'lucide-react'

export default function UploadPage() {
  const router = useRouter()
  const [uploadedVideo, setUploadedVideo] = useState<{ id: string; title: string } | null>(null)

  const handleUploadComplete = (video: { id: string; title: string }) => {
    setUploadedVideo(video)
    toast.success('Video uploaded successfully!')
    
    // Start transcription process automatically
    startTranscription(video.id)
  }

  const startTranscription = async (videoId: string) => {
    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId }),
      })

      if (response.ok) {
        toast.success('Transcription started! This may take a few minutes.')
        // Could redirect to review page or show progress
      } else {
        toast.error('Failed to start transcription')
      }
    } catch (error) {
      console.error('Transcription error:', error)
      toast.error('Failed to start transcription')
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Upload Video</h1>
          <p className="text-gray-600 mt-2">
            Upload your video to start the AI-powered content automation process
          </p>
        </div>

        {/* Upload Process Steps */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            What happens after upload:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="mb-2">
                <Upload className="w-8 h-8 text-blue-600 mx-auto" />
              </div>
              <h3 className="font-medium text-sm">Upload</h3>
              <p className="text-xs text-gray-600">Your video is stored securely</p>
            </div>
            <div className="text-center">
              <div className="mb-2">
                <FileText className="w-8 h-8 text-green-600 mx-auto" />
              </div>
              <h3 className="font-medium text-sm">Transcribe</h3>
              <p className="text-xs text-gray-600">AI extracts speech to text</p>
            </div>
            <div className="text-center">
              <div className="mb-2">
                <Sparkles className="w-8 h-8 text-purple-600 mx-auto" />
              </div>
              <h3 className="font-medium text-sm">Generate</h3>
              <p className="text-xs text-gray-600">AI creates social captions</p>
            </div>
            <div className="text-center">
              <div className="mb-2">
                <Smartphone className="w-8 h-8 text-orange-600 mx-auto" />
              </div>
              <h3 className="font-medium text-sm">Publish</h3>
              <p className="text-xs text-gray-600">Share across platforms</p>
            </div>
          </div>
        </div>

        {/* Upload Component */}
        <VideoUpload onUploadComplete={handleUploadComplete} />

        {/* Success State */}
        {uploadedVideo && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="mr-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Upload Successful!
                </h3>
                <p className="text-green-700">
                  {uploadedVideo.title} has been uploaded and transcription is starting.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Link href="/">
                <Button variant="outline">
                  Back to Dashboard
                </Button>
              </Link>
              <Button
                onClick={() => router.push(`/review/${uploadedVideo.id}`)}
              >
                Go to Review
              </Button>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center mb-2">
            <Lightbulb className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-blue-900">
              Tips for best results:
            </h3>
          </div>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• <span className="font-semibold">Supported formats:</span> .mp4, .mov, .avi, .mkv</li>
            <li>• <span className="font-semibold">File size limit:</span> 50MB per file (free tier)</li>
            <li>• <span className="font-semibold">Compression:</span> Compress videos to under 50MB for best compatibility</li>
            <li>• <span className="font-semibold">Compression guide:</span> <a href="/compress-video" className="text-blue-700 underline hover:text-blue-900">How to compress your video</a></li>
            <li>• Use clear audio for accurate transcription</li>
            <li>• Vertical format (9:16) works best for social media</li>
            <li>• Include engaging hooks in the first few seconds</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
} 