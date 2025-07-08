'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function TestUploadPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testSupabase = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-supabase')
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Upload Debug Test</h1>
      
      <Button 
        onClick={testSupabase} 
        disabled={loading}
        className="mb-6"
      >
        {loading ? 'Testing...' : 'Test Supabase Configuration'}
      </Button>

      {testResult && (
        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Test Results:</h2>
          <pre className="text-base overflow-auto bg-white p-4 rounded border font-mono">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Environment Variables:</h2>
        <div className="bg-gray-100 p-6 rounded-lg">
          <div className="space-y-3 text-lg">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-gray-700">NEXT_PUBLIC_SUPABASE_URL:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                process.env.NEXT_PUBLIC_SUPABASE_URL 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-gray-700">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 