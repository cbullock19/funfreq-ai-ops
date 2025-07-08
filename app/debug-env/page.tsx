'use client'

export default function DebugEnvPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Environment Variables Debug</h1>
      
      <div className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Client-side Environment Variables:</h2>
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
        
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <div className="mt-4 p-3 bg-blue-50 rounded border">
            <p className="font-semibold text-gray-700">URL Preview:</p>
            <p className="text-blue-600 font-mono text-sm">{process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...</p>
          </div>
        )}
        
        {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && (
          <div className="mt-4 p-3 bg-blue-50 rounded border">
            <p className="font-semibold text-gray-700">Key Preview:</p>
            <p className="text-blue-600 font-mono text-sm">{process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 30)}...</p>
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <a href="/test-upload" className="text-blue-600 hover:underline">
          Go to Upload Test Page →
        </a>
      </div>
    </div>
  )
} 