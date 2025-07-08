'use client'

import { useState, useEffect } from 'react'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Header } from '@/components/layout/Header'
import { AnalyticsSummary, PlatformSummary } from '@/lib/analytics/types'
import { 
  BarChart3, 
  RefreshCw, 
  Calendar, 
  TrendingUp, 
  Eye, 
  MessageSquare, 
  ThumbsUp,
  Share2,
  Users,
  Activity,
  FileText,
  Video,
  CheckCircle,
  Settings
} from 'lucide-react'

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod] = useState(30) // days

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const response = await fetch(`/api/analytics?period=${period}&refresh=${refresh}`)
      const result = await response.json()

      if (result.success) {
        setAnalytics(result.data)
      } else {
        console.error('Failed to fetch analytics:', result.error)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatPercentage = (num: number | undefined): string => {
    return (num || 0).toFixed(2) + '%'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Performance insights across all platforms
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={period}
                onChange={(e) => setPeriod(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
              </select>
              <Button
                onClick={() => fetchAnalytics(true)}
                disabled={refreshing}
                variant="outline"
              >
                {refreshing ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Video className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Videos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics ? formatNumber(analytics.total_videos || 0) : '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics ? formatNumber(analytics.total_posts || 0) : '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics ? formatNumber(analytics.total_views || 0) : '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Engagement</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics ? formatNumber(analytics.total_engagement || 0) : '0'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Platform Performance</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {/* Instagram - Coming Soon */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-50">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      <PlatformIcon platform="instagram" size={24} />
                    </div>
                    <div>
                      <p className="font-medium">Instagram</p>
                      <p className="text-sm text-gray-600">Coming soon</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">-</p>
                    <p className="text-sm text-gray-600">-</p>
                  </div>
                </div>

                {/* Facebook - Active */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      <PlatformIcon platform="facebook" size={24} />
                    </div>
                    <div>
                      <p className="font-medium">Facebook</p>
                      <p className="text-sm text-gray-600">
                        {analytics?.platforms.facebook 
                          ? `${analytics.platforms.facebook.posts_count} posts`
                          : '0 posts'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {analytics?.platforms.facebook 
                        ? formatNumber(analytics.platforms.facebook.total_views)
                        : '0'
                      }
                    </p>
                    <p className="text-sm text-gray-600">
                      {analytics?.platforms.facebook 
                        ? formatNumber(analytics.platforms.facebook.total_engagement) + ' engagement'
                        : '0 engagement'
                      }
                    </p>
                  </div>
                </div>

                {/* TikTok - Coming Soon */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-50">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      <PlatformIcon platform="tiktok" size={24} />
                    </div>
                    <div>
                      <p className="font-medium">TikTok</p>
                      <p className="text-sm text-gray-600">Coming soon</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">-</p>
                    <p className="text-sm text-gray-600">-</p>
                  </div>
                </div>

                {/* YouTube - Coming Soon */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-50">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      <PlatformIcon platform="youtube" size={24} />
                    </div>
                    <div>
                      <p className="font-medium">YouTube</p>
                      <p className="text-sm text-gray-600">Coming soon</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">-</p>
                    <p className="text-sm text-gray-600">-</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Facebook Detailed Stats */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <PlatformIcon platform="facebook" size={20} />
                <h2 className="text-lg font-semibold text-gray-900">Facebook Performance</h2>
              </div>
            </div>
            <div className="p-6">
              {analytics?.platforms.facebook ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {formatNumber(analytics.platforms.facebook?.total_impressions ?? 0)}
                      </p>
                      <p className="text-sm text-gray-600">Impressions</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {formatNumber(analytics.platforms.facebook?.total_reach ?? 0)}
                      </p>
                      <p className="text-sm text-gray-600">Reach</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {formatNumber(analytics.platforms.facebook?.total_views ?? 0)}
                      </p>
                      <p className="text-sm text-gray-600">Views</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                                             <p className="text-2xl font-bold text-orange-600">
                         {formatPercentage(analytics.platforms.facebook?.average_engagement_rate ?? 0)}
                       </p>
                      <p className="text-sm text-gray-600">Engagement Rate</p>
                    </div>
                  </div>

                  {/* Top Performing Posts */}
                  {analytics.platforms.facebook.top_performing_posts.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Top Performing Posts</h3>
                      <div className="space-y-2">
                        {analytics.platforms.facebook.top_performing_posts.slice(0, 3).map((post, index) => (
                          <div key={post.post_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                              <div>
                                <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                  {post.title || 'Untitled'}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {formatNumber(post.metrics?.engagement ?? 0)} engagement
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {formatNumber(post.metrics?.views ?? 0)}
                              </p>
                              <p className="text-xs text-gray-600">views</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No Facebook data available</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Publish some content to see analytics here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-blue-900">
                Multi-Platform Analytics Coming Soon
              </h3>
              <p className="text-blue-700 mt-1">
                We're building comprehensive analytics for Instagram, TikTok, and YouTube. 
                Facebook analytics are now live! Connect your accounts to see performance 
                data across all platforms.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Facebook Active
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  <Settings className="w-3 h-3 mr-1" />
                  Instagram Coming Soon
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  <Settings className="w-3 h-3 mr-1" />
                  TikTok Coming Soon
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  <Settings className="w-3 h-3 mr-1" />
                  YouTube Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
} 