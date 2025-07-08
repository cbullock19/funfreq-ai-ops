'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function TestUploadSimplePage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testSupabaseClient = async () => {
    setLoading(true)
    setResult('Testing...')
    
    try {
      // Test importing the client
      const { supabaseClient } = await import('@/lib/supabase-client')
      setResult('✅ Supabase client imported successfully')
      
      // Test bucket access
      const { data, error } = await supabaseClient.storage
        .from('videos')
        .list('', { limit: 1 })
      
      if (error) {
        setResult(`❌ Bucket access failed: ${error.message}`)
      } else {
        setResult(`✅ Bucket access successful. Found ${data?.length || 0} files`)
      }
      
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testEnvironmentVariables = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    setResult(`
Environment Variables Test:
- URL: ${url ? '✅ Set' : '❌ Missing'}
- Key: ${key ? '✅ Set' : '❌ Missing'}
- URL Preview: ${url ? url.substring(0, 30) + '...' : 'N/A'}
- Key Preview: ${key ? key.substring(0, 30) + '...' : 'N/A'}
    `)
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Simple Upload Test</h1>
      
      <div className="space-y-4">
        <Button 
          onClick={testEnvironmentVariables}
          className="mr-4"
        >
          Test Environment Variables
        </Button>
        
        <Button 
          onClick={testSupabaseClient}
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test Supabase Client'}
        </Button>
      </div>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="text-sm whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  )
} 