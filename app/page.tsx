'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import Link from 'next/link'
import { AnalyticsSummary } from '@/lib/analytics/types'
import { 
  Video, 
  FileText, 
  Eye, 
  MessageSquare, 
  RefreshCw, 
  Cloud, 
  BarChart3, 
  Settings,
  CheckCircle,
  Clock,
  Target,
  XCircle,
  Play
} from 'lucide-react'
import { PlatformIcon } from '@/components/ui/PlatformIcon'

interface Video {
  id: string
  title: string
  status: string
  created_at: string
  published_platforms?: any
}

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardAnalytics()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch analytics
      const analyticsResponse = await fetch('/api/analytics?period=30&refresh=false')
      const analyticsResult = await analyticsResponse.json()

      if (analyticsResult.success) {
        setAnalytics(analyticsResult.data)
      } else {
        console.error('Failed to fetch dashboard analytics:', analyticsResult.error)
      }

      // Fetch recent videos
      const videosResponse = await fetch('/api/videos')
      const videosResult = await videosResponse.json()

      if (videosResult.success) {
        setVideos(videosResult.videos || [])
      } else {
        console.error('Failed to fetch videos:', videosResult.error)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboardAnalytics = fetchDashboardData

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }
  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Manage your video content automation pipeline
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={fetchDashboardAnalytics}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
            <Link href="/upload">
              <Button>
                <Cloud className="w-4 h-4 mr-2" />
                Select from Dropbox
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="mr-3">
                <Video className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? <LoadingSpinner size="sm" /> : formatNumber(analytics?.total_videos || 0)}
                </p>
                <p className="text-sm text-gray-600">Videos Processed</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="mr-3">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? <LoadingSpinner size="sm" /> : formatNumber(analytics?.total_posts || 0)}
                </p>
                <p className="text-sm text-gray-600">Posts Published</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="mr-3">
                <Eye className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? <LoadingSpinner size="sm" /> : formatNumber(analytics?.total_views || 0)}
                </p>
                <p className="text-sm text-gray-600">Total Views</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="mr-3">
                <MessageSquare className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? <LoadingSpinner size="sm" /> : formatNumber(analytics?.total_engagement || 0)}
                </p>
                <p className="text-sm text-gray-600">Total Engagement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Performance */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Platform Performance</h2>
            <p className="text-sm text-gray-600 mt-1">Last 30 days</p>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : analytics?.platforms.facebook ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatNumber(analytics.platforms.facebook.total_views)}
                  </p>
                  <p className="text-sm text-gray-600">Facebook Views</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {formatNumber(analytics.platforms.facebook.total_engagement)}
                  </p>
                  <p className="text-sm text-gray-600">Facebook Engagement</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {analytics.platforms.facebook.posts_count}
                  </p>
                  <p className="text-sm text-gray-600">Facebook Posts</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mb-4">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No analytics data yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Publish some content to see performance metrics here
                </p>
                <Link href="/upload">
                  <Button>
                    <Cloud className="w-4 h-4 mr-2" />
                    Select Your First Video
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Videos */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Videos</h2>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : videos.length > 0 ? (
              <div className="space-y-4">
                {videos.slice(0, 5).map((video) => (
                  <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div>
                        {video.status === 'posted' ? <CheckCircle className="w-6 h-6 text-green-600" /> : 
                         video.status === 'publishing' ? <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" /> : 
                         video.status === 'ready' ? <Target className="w-6 h-6 text-yellow-600" /> : 
                         video.status === 'failed' ? <XCircle className="w-6 h-6 text-red-600" /> : 
                         <Video className="w-6 h-6 text-gray-600" />}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{video.title}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            video.status === 'posted' ? 'bg-green-100 text-green-800' :
                            video.status === 'publishing' ? 'bg-blue-100 text-blue-800' :
                            video.status === 'ready' ? 'bg-yellow-100 text-yellow-800' :
                            video.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(video.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                                          <div className="flex items-center space-x-2">
                        {video.published_platforms && Object.keys(video.published_platforms).length > 0 && (
                          <div className="flex space-x-1">
                            {Object.entries(video.published_platforms).map(([platform, status]: [string, any]) => (
                              <div key={platform}>
                                {status.status === 'posted' && status.post_url ? (
                                  <a 
                                    href={status.post_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs hover:scale-110 transition-transform ${
                                      'bg-green-100 text-green-600'
                                    }`}
                                    title={`View on ${platform}`}
                                  >
                                    <PlatformIcon platform={platform as "facebook" | "instagram" | "tiktok" | "youtube"} size={12} />
                                  </a>
                                ) : (
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                    status.status === 'failed' ? 'bg-red-100 text-red-600' :
                                    status.status === 'publishing' ? 'bg-blue-100 text-blue-600' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    <PlatformIcon platform={platform as "facebook" | "instagram" | "tiktok" | "youtube"} size={12} />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <Link href={`/review/${video.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      </div>
                  </div>
                ))}
                {videos.length > 5 && (
                  <div className="text-center pt-4">
                    <Link href="/upload">
                      <Button variant="outline">View All Videos</Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mb-4">
                  <Video className="w-16 h-16 text-gray-400 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No videos processed yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Get started by selecting your first video from Dropbox to begin the automation process
                </p>
                <Link href="/upload">
                  <Button>
                    <Cloud className="w-4 h-4 mr-2" />
                    Select Your First Video
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/upload" className="block">
              <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="mb-2">
                  <Cloud className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-medium">Select from Dropbox</h3>
                <p className="text-sm text-gray-600">
                  Start the automation process with a video from Dropbox
                </p>
              </div>
            </Link>

            <Link href="/analytics" className="block">
              <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="mb-2">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-medium">View Analytics</h3>
                <p className="text-sm text-gray-600">
                  Track performance across all platforms
                </p>
                {analytics && (
                  <div className="mt-2 text-xs text-blue-600">
                    {analytics.total_posts} posts • {formatNumber(analytics.total_views)} views
                  </div>
                )}
              </div>
            </Link>

            <Link href="/settings" className="block">
              <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="mb-2">
                  <Settings className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-medium">Platform Settings</h3>
                <p className="text-sm text-gray-600">
                  Configure social media integrations
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
