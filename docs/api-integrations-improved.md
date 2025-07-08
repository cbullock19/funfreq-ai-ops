# API Integrations Guide

Real implementation details for integrating with each service. Copy-paste ready code examples.

## AssemblyAI (Video Transcription)

**Setup:**
```bash
npm install assemblyai
```

**Implementation:**
```javascript
// lib/ai/transcribe.js
import { AssemblyAI } from 'assemblyai'

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY
})

export async function transcribeVideo(videoUrl) {
  try {
    const transcript = await client.transcripts.transcribe({
      audio_url: videoUrl,
      auto_highlights: true,
      filter_profanity: false,
      format_text: true
    })
    
    return {
      success: true,
      text: transcript.text,
      confidence: transcript.confidence,
      highlights: transcript.auto_highlights_result?.results || []
    }
  } catch (error) {
    console.error('AssemblyAI error:', error)
    return { success: false, error: error.message }
  }
}
```

**API Route:**
```javascript
// pages/api/transcribe.js
import { transcribeVideo } from '../../lib/ai/transcribe'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { videoUrl } = req.body
  const result = await transcribeVideo(videoUrl)
  
  if (result.success) {
    res.json({ transcript: result.text, confidence: result.confidence })
  } else {
    res.status(500).json({ error: result.error })
  }
}
```

## OpenAI (Caption Generation)

**Setup:**
```bash
npm install openai
```

**Implementation:**
```javascript
// lib/ai/captions.js
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateCaption(transcript, platform = 'instagram') {
  const platformSpecs = {
    instagram: { maxLength: 2200, style: 'engaging with emojis' },
    tiktok: { maxLength: 150, style: 'short and punchy' },
    facebook: { maxLength: 500, style: 'informative and professional' }
  }
  
  const spec = platformSpecs[platform] || platformSpecs.instagram
  
  const prompt = `Create a ${spec.style} social media caption for ${platform} based on this video transcript. 

Guidelines:
- Keep under ${spec.maxLength} characters
- Include relevant hashtags (5-8 max)
- End with call to action to visit funfreq.com
- Make it Christ-centered and truth-focused
- Be engaging and shareable

Transcript: "${transcript}"

Return as JSON with this structure:
{
  "caption": "main caption text",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "cta": "call to action line"
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
    
    const result = JSON.parse(response.choices[0].message.content)
    return { success: true, ...result }
  } catch (error) {
    console.error('OpenAI error:', error)
    return { success: false, error: error.message }
  }
}
```

## Meta Graph API (Facebook + Instagram)

**Setup:**
Get tokens from Facebook Developer Console with these permissions:
- `pages_show_list`
- `pages_manage_posts` 
- `instagram_basic`
- `instagram_content_publish`

**Implementation:**
```javascript
// lib/publishing/meta.js
import axios from 'axios'

const META_API_BASE = 'https://graph.facebook.com/v18.0'

export async function postToInstagram(videoUrl, caption, hashtags) {
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN
  const IG_USER_ID = process.env.META_INSTAGRAM_ID
  
  try {
    // Step 1: Create media container
    const containerResponse = await axios.post(`${META_API_BASE}/${IG_USER_ID}/media`, {
      media_type: 'REELS',
      video_url: videoUrl,
      caption: `${caption}\n\n${hashtags.join(' ')}`,
      access_token: ACCESS_TOKEN
    })
    
    const creationId = containerResponse.data.id
    
    // Step 2: Publish the media
    const publishResponse = await axios.post(`${META_API_BASE}/${IG_USER_ID}/media_publish`, {
      creation_id: creationId,
      access_token: ACCESS_TOKEN
    })
    
    return {
      success: true,
      postId: publishResponse.data.id,
      postUrl: `https://instagram.com/p/${publishResponse.data.id}`
    }
  } catch (error) {
    console.error('Instagram publish error:', error.response?.data || error)
    return { success: false, error: error.message }
  }
}

export async function postToFacebook(videoUrl, caption, hashtags) {
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN
  const PAGE_ID = process.env.META_PAGE_ID
  
  try {
    const response = await axios.post(`${META_API_BASE}/${PAGE_ID}/videos`, {
      file_url: videoUrl,
      description: `${caption}\n\n${hashtags.join(' ')}`,
      access_token: ACCESS_TOKEN
    })
    
    return {
      success: true,
      postId: response.data.id,
      postUrl: `https://facebook.com/${response.data.id}`
    }
  } catch (error) {
    console.error('Facebook publish error:', error.response?.data || error)
    return { success: false, error: error.message }
  }
}
```

## TikTok Business API (Future)

**Note:** TikTok Business API requires business verification and approval. For now, manual posting recommended.

**Placeholder implementation:**
```javascript
// lib/publishing/tiktok.js
export async function postToTikTok(videoUrl, caption, hashtags) {
  // TODO: Implement when TikTok Business API access approved
  console.log('TikTok posting not yet implemented')
  return { success: false, error: 'TikTok API not implemented' }
}
```

## YouTube Data API (Future)

**Setup:**
1. Enable YouTube Data API in Google Cloud Console
2. Create OAuth 2.0 credentials
3. Get refresh token for server-side posting

**Placeholder:**
```javascript
// lib/publishing/youtube.js
export async function postToYouTube(videoUrl, title, description) {
  // TODO: Implement YouTube Shorts upload
  console.log('YouTube posting not yet implemented')
  return { success: false, error: 'YouTube API not implemented' }
}
```

## Supabase Storage

**Upload implementation:**
```javascript
// lib/storage/upload.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export async function uploadVideo(file, filename) {
  try {
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(`uploads/${filename}`, file)
    
    if (error) throw error
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(data.path)
    
    return { success: true, url: publicUrl, path: data.path }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: error.message }
  }
}
```

## Testing Endpoints

**Test transcription:**
```bash
curl -X POST http://localhost:3000/api/transcribe \
  -H "Content-Type: application/json" \
  -d '{"videoUrl":"https://your-video-url.mp4"}'
```

**Test caption generation:**
```bash
curl -X POST http://localhost:3000/api/generate-caption \
  -H "Content-Type: application/json" \
  -d '{"transcript":"Your video transcript here","platform":"instagram"}'
```

## Error Handling

All API functions return standardized response format:
```javascript
{
  success: boolean,
  data?: any,
  error?: string
}
```

Always check `success` before using `data` in your components.

---

*Keep this doc updated as you add more integrations!*