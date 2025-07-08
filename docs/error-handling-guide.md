# Error Handling Patterns

Complete error handling system for FunFreq AI Ops. Build bulletproof apps that handle failures gracefully.

## Core Error Classes

```javascript
// lib/errors/types.js
export class APIError extends Error {
  constructor(message, status, service, retryable = false) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.service = service
    this.retryable = retryable
    this.timestamp = new Date().toISOString()
  }
}

export class RateLimitError extends APIError {
  constructor(service, resetTime) {
    super(`Rate limit exceeded for ${service}`, 429, service, true)
    this.resetTime = resetTime
  }
}

export class ValidationError extends Error {
  constructor(message, fields = []) {
    super(message)
    this.name = 'ValidationError'
    this.fields = fields
  }
}

export class DatabaseError extends Error {
  constructor(message, code, details) {
    super(message)
    this.name = 'DatabaseError'
    this.code = code
    this.details = details
  }
}
```

## Retry Logic with Exponential Backoff

```javascript
// lib/utils/retry.js
export async function withRetry(
  fn, 
  maxAttempts = 3, 
  baseDelay = 1000,
  shouldRetry = (error) => error.retryable
) {
  let lastError

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (!shouldRetry(error) || attempt === maxAttempts) {
        throw error
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}
```

## Circuit Breaker Pattern

```javascript
// lib/utils/circuit-breaker.js
export class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold
    this.timeout = timeout
    this.failureCount = 0
    this.lastFailureTime = null
    this.state = 'CLOSED' // CLOSED, OPEN, HALF_OPEN
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.timeout) {
        throw new Error('Circuit breaker is OPEN')
      }
      this.state = 'HALF_OPEN'
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  onSuccess() {
    this.failureCount = 0
    this.state = 'CLOSED'
  }

  onFailure() {
    this.failureCount++
    this.lastFailureTime = Date.now()
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN'
    }
  }
}

export const assemblyAIBreaker = new CircuitBreaker(3, 30000)
export const openAIBreaker = new CircuitBreaker(5, 60000)
```

## API Error Handling

```javascript
// lib/api/with-error-handling.js
import { APIError, RateLimitError } from '../errors/types'
import { withRetry } from '../utils/retry'

export async function apiCallWithHandling(url, options = {}) {
  return withRetry(
    async () => {
      const response = await fetch(url, options)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 429) {
          const resetTime = response.headers.get('x-ratelimit-reset')
          throw new RateLimitError('API', resetTime)
        }
        
        throw new APIError(
          errorData.message || 'API request failed',
          response.status,
          'unknown',
          response.status >= 500
        )
      }
      
      return response.json()
    },
    3,
    1000,
    (error) => error instanceof RateLimitError || error.status >= 500
  )
}

// Service-specific wrappers
export async function callAssemblyAI(endpoint, data) {
  return apiCallWithHandling(`https://api.assemblyai.com/v2/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ASSEMBLYAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
}

export async function callOpenAI(data) {
  return apiCallWithHandling('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
}
```

## Database Error Handling

```javascript
// lib/database/with-error-handling.js
import { DatabaseError } from '../errors/types'

export async function dbOperation(operation) {
  try {
    const { data, error } = await operation()
    
    if (error) {
      throw new DatabaseError(
        getDatabaseErrorMessage(error),
        error.code,
        error.details
      )
    }
    
    return data
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error
    }
    
    throw new DatabaseError(
      'Database operation failed',
      'UNKNOWN_ERROR',
      error.message
    )
  }
}

function getDatabaseErrorMessage(error) {
  const errorMappings = {
    '23505': 'A record with this information already exists',
    '23503': 'Referenced record does not exist',
    '42P01': 'Database table not found',
    'PGRST301': 'Record not found',
    '08P01': 'Database connection failed'
  }
  
  return errorMappings[error.code] || 'Database operation failed'
}

// Usage example
export async function getVideo(id) {
  return dbOperation(() => 
    supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single()
  )
}
```

## React Error Boundary

```jsx
// components/errors/ErrorBoundary.jsx
import { Component } from 'react'
import { Button } from '../ui/Button'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error })
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 text-sm mb-6">
              We're sorry for the inconvenience. Please try again.
            </p>
            
            <div className="flex gap-3">
              <Button onClick={this.handleRetry} className="flex-1">
                Try Again
              </Button>
              <Button 
                variant="secondary"
                onClick={() => window.location.href = '/'}
                className="flex-1"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

## Custom Error Hook

```jsx
// hooks/useErrorHandler.js
import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'

export function useErrorHandler() {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAsync = useCallback(async (asyncFn, options = {}) => {
    const {
      onSuccess = () => {},
      onError = () => {},
      showToast = true,
      loadingState = true
    } = options

    try {
      if (loadingState) setIsLoading(true)
      setError(null)
      
      const result = await asyncFn()
      onSuccess(result)
      return result
    } catch (err) {
      const userMessage = getUserFriendlyMessage(err)
      setError(userMessage)
      
      if (showToast) {
        toast.error(userMessage)
      }
      
      onError(err)
      throw err
    } finally {
      if (loadingState) setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { error, isLoading, handleAsync, clearError }
}

function getUserFriendlyMessage(error) {
  if (error instanceof APIError) {
    switch (error.service) {
      case 'assemblyai':
        return 'Unable to transcribe video. You can add captions manually.'
      case 'openai':
        return 'Caption generation failed. Please try again.'
      case 'meta':
        return 'Publishing to social media failed. Check your connection.'
      default:
        return 'Something went wrong. Please try again.'
    }
  }
  
  if (error.message?.includes('network')) {
    return 'Network connection issue. Please check your internet.'
  }
  
  return 'An unexpected error occurred. Please try again.'
}
```

## Progressive Error Recovery

```jsx
// components/errors/ProgressiveRecovery.jsx
import { useState } from 'react'
import { Button } from '../ui/Button'

export function ProgressiveRecovery({ error, onRetry, children }) {
  const [retryCount, setRetryCount] = useState(0)

  if (!error) return children

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1)
    await onRetry()
  }

  const getRecoveryOptions = () => {
    if (retryCount === 0) {
      return {
        primary: { label: 'Try Again', action: handleRetry },
        secondary: null
      }
    }
    
    if (retryCount === 1) {
      return {
        primary: { label: 'Retry', action: handleRetry },
        secondary: { 
          label: 'Skip This Step', 
          action: () => onRetry({ skip: true }) 
        }
      }
    }
    
    return {
      primary: { 
        label: 'Continue Without This Feature', 
        action: () => onRetry({ skipFeature: true }) 
      },
      secondary: { 
        label: 'Contact Support', 
        action: () => window.open('mailto:support@funfreq.com') 
      }
    }
  }

  const options = getRecoveryOptions()

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="text-yellow-600 text-xl mr-3">⚠️</div>
        <div className="flex-1">
          <h3 className="font-medium text-yellow-900">
            {retryCount === 0 ? 'Something went wrong' : 
             retryCount === 1 ? 'Still having trouble' : 
             'Persistent issue detected'}
          </h3>
          <p className="text-yellow-800 text-sm mt-1">{error.message}</p>
          
          <div className="mt-3 flex gap-2">
            <Button 
              onClick={options.primary.action}
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {options.primary.label}
            </Button>
            
            {options.secondary && (
              <Button 
                onClick={options.secondary.action}
                variant="secondary"
                size="sm"
              >
                {options.secondary.label}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

## API Route Error Handler

```javascript
// lib/middleware/error-handler.js
export function withErrorHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (error) {
      console.error(`API Error in ${req.url}:`, error)
      
      const { status, message } = getErrorResponse(error)
      
      res.status(status).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error.stack 
        })
      })
    }
  }
}

function getErrorResponse(error) {
  if (error instanceof APIError) {
    return { status: error.status, message: error.message }
  }
  
  if (error instanceof ValidationError) {
    return { status: 400, message: 'Invalid request data' }
  }
  
  if (error instanceof DatabaseError) {
    return { status: 500, message: 'Database operation failed' }
  }
  
  return { status: 500, message: 'Internal server error' }
}

// Usage in API routes
export default withErrorHandler(async (req, res) => {
  // Your API logic here
  const result = await someOperation()
  res.json({ success: true, data: result })
})
```

## Smart Loading with Error Handling

```jsx
// components/ui/SmartLoader.jsx
import { useEffect, useState } from 'react'
import { LoadingSpinner } from './LoadingSpinner'
import { ProgressiveRecovery } from '../errors/ProgressiveRecovery'

export function SmartLoader({ 
  isLoading, 
  error, 
  children, 
  loadingMessage = 'Loading...', 
  onRetry 
}) {
  const [timeoutReached, setTimeoutReached] = useState(false)

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setTimeoutReached(true), 10000)
      return () => clearTimeout(timer)
    } else {
      setTimeoutReached(false)
    }
  }, [isLoading])

  if (error) {
    return <ProgressiveRecovery error={error} onRetry={onRetry}>{children}</ProgressiveRecovery>
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600 mt-2">{loadingMessage}</p>
        
        {timeoutReached && (
          <div className="mt-4 text-center">
            <p className="text-yellow-600 text-sm">Taking longer than usual...</p>
            <button 
              onClick={onRetry}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Try refreshing
            </button>
          </div>
        )}
      </div>
    )
  }

  return children
}
```

## Health Check System

```javascript
// pages/api/health.js
import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkAssemblyAI(),
    checkOpenAI(),
    checkMetaAPI()
  ])

  const results = checks.map((check, index) => ({
    service: ['database', 'assemblyai', 'openai', 'meta'][index],
    status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
    response_time: check.value?.responseTime || null,
    error: check.reason?.message || null
  }))

  const overallHealth = results.every(r => r.status === 'healthy')

  res.status(overallHealth ? 200 : 503).json({
    status: overallHealth ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: results
  })
}

async function checkDatabase() {
  const start = Date.now()
  await supabase.from('videos').select('id').limit(1)
  return { responseTime: Date.now() - start }
}

async function checkAssemblyAI() {
  const start = Date.now()
  const response = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: { 'authorization': process.env.ASSEMBLYAI_API_KEY },
    body: JSON.stringify({ audio_url: 'test' })
  })
  
  if (!response.ok && response.status !== 400) {
    throw new Error(`AssemblyAI returned ${response.status}`)
  }
  
  return { responseTime: Date.now() - start }
}

async function checkOpenAI() {
  const start = Date.now()
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
  })
  
  if (!response.ok) throw new Error(`OpenAI returned ${response.status}`)
  return { responseTime: Date.now() - start }
}

async function checkMetaAPI() {
  const start = Date.now()
  const response = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${process.env.META_ACCESS_TOKEN}`)
  
  if (!response.ok) throw new Error(`Meta API returned ${response.status}`)
  return { responseTime: Date.now() - start }
}
```

## Global Error Setup

```javascript
// pages/_app.js
import { ErrorBoundary } from '../components/errors/ErrorBoundary'
import { Toaster } from 'react-hot-toast'

// Global error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
  })
  
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
  })
}

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          success: { duration: 3000 },
          error: { duration: 5000 }
        }}
      />
    </ErrorBoundary>
  )
}
```

## Usage Examples

### Video Upload with Error Handling

```jsx
// components/forms/VideoUpload.jsx
import { useErrorHandler } from '../../hooks/useErrorHandler'
import { uploadVideo } from '../../lib/api'

export function VideoUpload({ onUploadComplete }) {
  const { error, isLoading, handleAsync, clearError } = useErrorHandler()
  const [progress, setProgress] = useState(0)

  const handleFileUpload = useCallback(async (files) => {
    const file = files[0]
    if (!file) return

    await handleAsync(
      async () => {
        const result = await uploadVideo(file, { onProgress: setProgress })
        onUploadComplete(result.video)
        return result
      },
      {
        onSuccess: () => {
          setProgress(0)
          toast.success('Video uploaded successfully!')
        },
        onError: () => setProgress(0)
      }
    )
  }, [handleAsync, onUploadComplete])

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex justify-between">
            <p className="text-red-800 text-sm">{error}</p>
            <button onClick={clearError} className="text-red-600">✕</button>
          </div>
        </div>
      )}
      
      <DropZone onDrop={handleFileUpload} disabled={isLoading} progress={progress} />
    </div>
  )
}
```

### AI Service with Graceful Degradation

```javascript
// lib/services/caption-service.js
export async function generateCaption(transcript) {
  try {
    // Try primary AI service
    return await openAIBreaker.execute(() => 
      callOpenAI({
        model: 'gpt-4',
        messages: [{ role: 'user', content: `Generate caption: ${transcript}` }]
      })
    )
  } catch (error) {
    console.warn('Primary AI service failed, trying fallback')
    
    try {
      // Try fallback service or simpler approach
      return await generateBasicCaption(transcript)
    } catch (fallbackError) {
      // Return manual option
      return {
        success: false,
        caption: null,
        error: 'AI caption generation unavailable. Please write caption manually.',
        canRetry: true
      }
    }
  }
}

function generateBasicCaption(transcript) {
  // Simple fallback - extract first sentence and add CTA
  const firstSentence = transcript.split('.')[0] + '.'
  return {
    success: true,
    caption: `${firstSentence}\n\nVisit funfreq.com for more`,
    hashtags: ['#FunFreq', '#Faith', '#Truth']
  }
}
```

## Quick Reference

### Error Handling Checklist
- [ ] API errors with retry logic
- [ ] Database connection issues  
- [ ] User input validation
- [ ] Network timeouts
- [ ] Rate limiting
- [ ] Circuit breakers for external services
- [ ] Progressive error recovery in UI
- [ ] Global error boundaries
- [ ] Health monitoring
- [ ] User-friendly error messages

### Common Patterns
```javascript
// 1. API call with retry
const result = await withRetry(() => apiCall(), 3)

// 2. Database operation with error handling
const data = await dbOperation(() => supabase.from('table').select())

// 3. Component with error recovery
<SmartLoader isLoading={loading} error={error} onRetry={refetch}>
  <YourComponent />
</SmartLoader>

// 4. Circuit breaker protection
const result = await circuitBreaker.execute(() => externalService())
```

This system gives you bulletproof error handling that keeps your app running smoothly even when things go wrong! 🛡️