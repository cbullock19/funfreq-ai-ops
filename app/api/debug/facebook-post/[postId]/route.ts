import { NextRequest, NextResponse } from 'next/server'
import { FacebookAnalytics } from '@/lib/analytics/facebook'

export async function GET(req: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const { postId } = params
    const facebookAnalytics = new FacebookAnalytics()
    const postMetrics = [
      'post_impressions',
      'post_impressions_unique',
      'post_reactions_by_type_total',
      'post_clicks',
      'post_engaged_users',
      'post_video_views',
      'post_video_watch_time',
      'post_video_views_unique',
      'post_video_views_organic',
      'post_video_views_paid',
      'post_video_complete_views_organic',
      'post_video_complete_views_paid',
      'post_video_avg_time_watched',
      'post_video_view_time_by_age_bucket_and_gender',
      'post_video_view_time_by_country_id'
    ]
    const META_API_BASE = 'https://graph.facebook.com/v18.0'
    const url = `${META_API_BASE}/${postId}/insights`
    const paramsObj = {
      metric: postMetrics.join(','),
      access_token: process.env.META_ACCESS_TOKEN!
    }
    const urlWithParams = new URL(url)
    Object.entries(paramsObj).forEach(([key, value]) => {
      urlWithParams.searchParams.append(key, value.toString())
    })
    const response = await fetch(urlWithParams.toString())
    const data = await response.json()
    return NextResponse.json({
      postId,
      url: urlWithParams.toString(),
      raw: data
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
} 