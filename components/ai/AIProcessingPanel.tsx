'use client'

import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'

interface ProcessingState {
  transcription: 'idle' | 'processing' | 'complete' | 'error'
  caption: 'idle' | 'processing' | 'complete' | 'error'
  transcriptProgress?: number  
  captionProgress?: number
}

interface AIProcessingPanelProps {
  video: {
    id: string
    status: string
    transcript?: string
    ai_caption?: string
    error_message?: string
  }
  onTranscriptionStart: () => void
  onCaptionStart: () => void
  onRefresh: () => void
}

export function AIProcessingPanel({ 
  video, 
  onTranscriptionStart, 
  onCaptionStart,
  onRefresh 
}: AIProcessingPanelProps) {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    transcription: 'idle',
    caption: 'idle'
  })

  // Update processing state based on video status
  useEffect(() => {
    const newState: ProcessingState = {
      transcription: 'idle',
      caption: 'idle'
    }

    // Determine transcription state
    if (video.status === 'transcribing') {
      newState.transcription = 'processing'
      newState.transcriptProgress = 75 // Simulated progress
    } else if (video.transcript) {
      newState.transcription = 'complete'
    } else if (video.status === 'error' && video.error_message?.includes('transcript')) {
      newState.transcription = 'error'
    }

    // Determine caption state
    if (video.status === 'generating') {
      newState.caption = 'processing'
      newState.captionProgress = 40 // Simulated progress
    } else if (video.ai_caption) {
      newState.caption = 'complete'
    } else if (video.status === 'error' && video.error_message?.includes('caption')) {
      newState.caption = 'error'
    }

    setProcessingState(newState)
  }, [video.status, video.transcript, video.ai_caption, video.error_message])

  // Auto-refresh for processing states
  useEffect(() => {
    if (processingState.transcription === 'processing' || processingState.caption === 'processing') {
      const interval = setInterval(() => {
        onRefresh()
      }, 2000)
      
      return () => clearInterval(interval)
    }
  }, [processingState.transcription, processingState.caption, onRefresh])

  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'processing':
        return (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>🔄</span>
          </div>
        )
      case 'complete':
        return <span className="text-green-600 text-lg">✅</span>
      case 'error':
        return <span className="text-red-600 text-lg">❌</span>
      default:
        return <span className="text-gray-400 text-lg">⏳</span>
    }
  }

  const getProgressBar = (progress?: number) => {
    if (!progress) return null
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    )
  }

  const getStatusText = (type: 'transcription' | 'caption', state: string) => {
    if (type === 'transcription') {
      switch (state) {
        case 'processing':
          return 'Analyzing audio content... (~30 seconds)'
        case 'complete':
          return 'Speech converted to text successfully'
        case 'error':
          return 'Failed to generate transcript'
        default:
          return 'Convert speech to text using AI'
      }
    } else {
      switch (state) {
        case 'processing':
          return 'Creating engaging captions... (~15 seconds)'
        case 'complete':
          return 'AI-generated captions ready for editing'
        case 'error':
          return 'Failed to generate captions'
        default:
          return 'Create social media captions from transcript'
      }
    }
  }

  const canStartCaption = processingState.transcription === 'complete'

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">AI Processing Pipeline</h3>
      
      <div className="space-y-6">
        {/* Transcription Step */}
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 transition-all duration-300 ease-in-out hover:border-gray-300">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {getStatusIcon(processingState.transcription)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">1. Generate Transcript</h4>
                  {processingState.transcription === 'processing' && (
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Processing
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {getStatusText('transcription', processingState.transcription)}
                </p>
                {getProgressBar(processingState.transcriptProgress)}
              </div>
            </div>
            
            <div className="ml-4">
              {processingState.transcription === 'idle' && (
                <Button 
                  size="sm" 
                  onClick={onTranscriptionStart}
                  className="whitespace-nowrap"
                >
                  Start Transcription
                </Button>
              )}
              
              {processingState.transcription === 'processing' && (
                <Button 
                  size="sm" 
                  disabled
                  className="whitespace-nowrap"
                >
                  Processing...
                </Button>
              )}
              
              {processingState.transcription === 'error' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={onTranscriptionStart}
                  className="whitespace-nowrap"
                >
                  Try Again
                </Button>
              )}
              
              {processingState.transcription === 'complete' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={onTranscriptionStart}
                  className="whitespace-nowrap"
                >
                  Regenerate
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Connection Line */}
        <div className="flex justify-center">
          <div className={`w-px h-6 transition-colors duration-300 ${
            processingState.transcription === 'complete' ? 'bg-green-400' : 'bg-gray-300'
          }`}></div>
        </div>

        {/* Caption Generation Step */}
        <div className={`border-2 border-dashed rounded-lg p-4 transition-all duration-300 ease-in-out ${
          canStartCaption 
            ? 'border-blue-200 bg-blue-50/30 hover:border-blue-300' 
            : 'border-gray-100 bg-gray-50/30 opacity-60'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {getStatusIcon(processingState.caption)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">2. Generate Caption</h4>
                  {processingState.caption === 'processing' && (
                    <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      Processing
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {canStartCaption 
                    ? getStatusText('caption', processingState.caption)
                    : 'Waiting for transcript to complete...'
                  }
                </p>
                {getProgressBar(processingState.captionProgress)}
              </div>
            </div>
            
            <div className="ml-4">
              {!canStartCaption && (
                <Button 
                  size="sm" 
                  disabled
                  className="whitespace-nowrap"
                >
                  Waiting...
                </Button>
              )}
              
              {canStartCaption && processingState.caption === 'idle' && (
                <Button 
                  size="sm" 
                  onClick={onCaptionStart}
                  className="whitespace-nowrap"
                >
                  Generate Caption
                </Button>
              )}
              
              {processingState.caption === 'processing' && (
                <Button 
                  size="sm" 
                  disabled
                  className="whitespace-nowrap"
                >
                  Processing...
                </Button>
              )}
              
              {processingState.caption === 'error' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={onCaptionStart}
                  className="whitespace-nowrap"
                >
                  Try Again
                </Button>
              )}
              
              {processingState.caption === 'complete' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={onCaptionStart}
                  className="whitespace-nowrap"
                >
                  Regenerate
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Success State */}
        {processingState.transcription === 'complete' && processingState.caption === 'complete' && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-xl">🎉</span>
              <div>
                <h4 className="font-medium text-green-900">AI Processing Complete!</h4>
                <p className="text-sm text-green-700">
                  Your content is ready to edit and customize below.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 