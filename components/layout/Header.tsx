import Link from 'next/link'
import { Button } from '../ui/Button'

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl">🎥</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  FunFreq AI Ops
                </h1>
                <p className="text-xs text-gray-500">
                  Content Automation Platform
                </p>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/upload" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Upload
            </Link>
            <Link 
              href="/analytics" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Analytics
            </Link>
            <Link 
              href="/settings" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Settings
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Link href="/upload">
              <Button size="sm">
                Upload Video
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
} 