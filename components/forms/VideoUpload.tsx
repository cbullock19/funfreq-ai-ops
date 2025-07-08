'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { formatFileSize } from '@/lib/utils'
import { Upload } from 'lucide-react'

interface Video {
  id: string
  title: string
  file_url: string
  file_size: number
}

interface VideoUploadProps {
  onUploadComplete: (video: Video) => void
  maxFileSize?: number
  acceptedFormats?: string[]
}

const DEFAULT_MAX_SIZE = 500 * 1024 * 1024 // 500MB
const DEFAULT_FORMATS = ['.mp4', '.mov', '.avi', '.mkv']

export function VideoUpload({ 
  onUploadComplete,
  maxFileSize = DEFAULT_MAX_SIZE,
  acceptedFormats = DEFAULT_FORMATS
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const uploadVideo = useCallback(async (file: File) => {
    setError(null)
    setUploading(true)
    setProgress(0)

    try {
      // Use direct upload to Supabase Storage to avoid Next.js body size limits
      const { supabaseClient } = await import('@/lib/supabase-client')
      
      console.log('Using client-side Supabase client')

      // Generate unique filename
      const fileExtension = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`
      const filePath = `videos/${fileName}`

      console.log('Starting direct upload to Supabase...')

      // Test Supabase connection first
      const { data: bucketData, error: bucketError } = await supabaseClient.storage
        .from('videos')
        .list('', { limit: 1 })

      if (bucketError) {
        console.error('Bucket access error:', bucketError)
        throw new Error(`Cannot access storage bucket: ${bucketError.message}`)
      }

      console.log('Bucket access successful, proceeding with upload...')

      // Upload to Supabase Storage
      console.log('Attempting to upload file to Supabase Storage...')
      const { data, error: uploadError } = await supabaseClient.storage
        .from('videos')
        .upload(filePath, file)

      console.log('Upload result:', { data, error: uploadError })

      // Simulate progress since Supabase doesn't provide progress tracking
      setProgress(75)

      if (uploadError) {
        console.error('Supabase upload error:', uploadError)
        console.error('Error details:', {
          message: uploadError.message,
          name: uploadError.name
        })
        throw new Error(`Upload failed: ${uploadError.message || 'Unknown error'}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseClient.storage
        .from('videos')
        .getPublicUrl(filePath)

      console.log('Upload successful, creating database record...')
      setProgress(90)

      // Create video record in database via API
      const response = await fetch('/api/upload/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: file.name.replace(/\.[^/.]+$/, ''),
          file_url: publicUrl,
          file_size: file.size,
          file_path: filePath
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create record' }))
        throw new Error(errorData.error || `Failed to create record (${response.status})`)
      }

      const result = await response.json()
      
      if (result.success) {
        setProgress(100)
        onUploadComplete(result.video)
      } else {
        throw new Error(result.error || 'Failed to create record')
      }
    } catch (err) {
      console.error('Direct upload failed, trying fallback method:', err)
      
      // Fallback to original API upload method
      try {
        setError(null)
        setProgress(25)
        
        const formData = new FormData()
        formData.append('video', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        setProgress(75)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
          throw new Error(errorData.error || `Upload failed (${response.status})`)
        }

        const result = await response.json()
        
        if (result.success) {
          setProgress(100)
          onUploadComplete(result.video)
        } else {
          throw new Error(result.error || 'Upload failed')
        }
      } catch (fallbackErr) {
        console.error('Fallback upload also failed:', fallbackErr)
        setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}. Fallback also failed: ${fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error'}`)
      }
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [onUploadComplete])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    console.log('File dropped:', file.name, 'Size:', file.size)

    // Supabase free tier limit is 50MB
    const SUPABASE_FREE_LIMIT = 50 * 1024 * 1024 // 50MB
    
    if (file.size > SUPABASE_FREE_LIMIT) {
      setError(
        `File too large for free tier. Maximum size is 50MB. ` +
        `Your file is ${formatFileSize(file.size)}. ` +
        `Please compress your video or upgrade to a paid Supabase plan.`
      )
      return
    }

    // Validate against component maxFileSize
    if (file.size > maxFileSize) {
      setError(`File too large. Maximum size is ${formatFileSize(maxFileSize)}`)
      return
    }

    console.log('Starting upload process...')
    await uploadVideo(file)
  }, [maxFileSize, uploadVideo])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'video/*': acceptedFormats
    },
    maxFiles: 1,
    disabled: uploading,
    maxSize: maxFileSize
  })

  // Handle file rejections
  const rejectionError = fileRejections[0]?.errors[0]?.message

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        {...getRootProps()} 
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'pointer-events-none opacity-60' : ''}
          ${error || rejectionError ? 'border-red-300 bg-red-50' : ''}
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
            <div className="flex justify-center">
              <Upload className="w-12 h-12 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-medium">
                {isDragActive ? 'Drop your video here' : 'Drag & drop or click to upload'}
              </p>
            </div>
            {(error || rejectionError) && (
              <div className="text-red-600 text-sm mt-2">
                <p>{error || rejectionError}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {!uploading && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Your video will be automatically transcribed and ready for caption generation
          </p>
        </div>
      )}
    </div>
  )
} 