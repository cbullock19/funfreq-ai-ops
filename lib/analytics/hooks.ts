import { useState, useEffect, useCallback } from 'react'
import { AnalyticsSummary } from './types'

export function useAnalytics(period: number = 30, autoRefresh: boolean = true) {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async (refresh = false) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/analytics?period=${period}&refresh=${refresh}`)
      const result = await response.json()

      if (result.success) {
        setAnalytics(result.data)
      } else {
        setError(result.error || 'Failed to fetch analytics')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Auto-refresh every 5 minutes if enabled
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchAnalytics(true)
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [fetchAnalytics, autoRefresh])

  const refresh = useCallback(() => {
    fetchAnalytics(true)
  }, [fetchAnalytics])

  return {
    analytics,
    loading,
    error,
    refresh
  }
}

export function useAnalyticsSummary() {
  const [summary, setSummary] = useState<{
    totalVideos: number
    totalPosts: number
    totalViews: number
    totalEngagement: number
  }>({
    totalVideos: 0,
    totalPosts: 0,
    totalViews: 0,
    totalEngagement: 0
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch('/api/analytics?period=30')
        const result = await response.json()

        if (result.success && result.data) {
          setSummary({
            totalVideos: result.data.total_videos,
            totalPosts: result.data.total_posts,
            totalViews: result.data.total_views,
            totalEngagement: result.data.total_engagement
          })
        }
      } catch (error) {
        console.error('Failed to fetch analytics summary:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [])

  return { summary, loading }
}

export function usePlatformAnalytics(platform: 'facebook' | 'instagram' | 'tiktok' | 'youtube') {
  const [platformData, setPlatformData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlatformData = async () => {
      try {
        const response = await fetch(`/api/analytics?period=30&platform=${platform}`)
        const result = await response.json()

        if (result.success && result.data?.platforms?.[platform]) {
          setPlatformData(result.data.platforms[platform])
        }
      } catch (error) {
        console.error(`Failed to fetch ${platform} analytics:`, error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlatformData()
  }, [platform])

  return { platformData, loading }
} 