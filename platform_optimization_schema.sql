-- Add platform-specific caption columns to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS ai_captions JSONB DEFAULT '{}';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS final_captions JSONB DEFAULT '{}';

-- Add published_platforms column to track publishing status per platform
ALTER TABLE videos ADD COLUMN IF NOT EXISTS published_platforms JSONB DEFAULT '{}';

-- The JSONB structure will be:
-- ai_captions: {
--   "instagram": { "caption": "text", "hashtags": ["#tag1"], "char_count": 150 },
--   "facebook": { "caption": "text", "hashtags": ["#tag1"], "char_count": 100 },
--   "tiktok": { "caption": "text", "hashtags": ["#tag1"], "char_count": 50 },
--   "youtube": { "caption": "text", "hashtags": ["#tag1"], "char_count": 200 }
-- }

-- published_platforms: {
--   "facebook": { "status": "published", "post_id": "12345", "post_url": "https://facebook.com/12345", "published_at": "2025-01-07T10:30:00Z" },
--   "instagram": { "status": "skipped", "reason": "No credentials configured" },
--   "tiktok": { "status": "failed", "error": "API rate limit exceeded", "failed_at": "2025-01-07T10:35:00Z" }
-- }

-- Add index for platform caption queries
CREATE INDEX IF NOT EXISTS idx_videos_ai_captions ON videos USING GIN(ai_captions);
CREATE INDEX IF NOT EXISTS idx_videos_published_platforms ON videos USING GIN(published_platforms);

-- Update existing records to have proper structure
UPDATE videos 
SET ai_captions = jsonb_build_object(
  'instagram', jsonb_build_object(
    'caption', COALESCE(ai_caption, ''),
    'hashtags', COALESCE(ai_hashtags, '[]'::jsonb),
    'char_count', LENGTH(COALESCE(ai_caption, '') || ARRAY_TO_STRING(COALESCE(ai_hashtags, '{}'), ' '))
  )
)
WHERE ai_caption IS NOT NULL AND ai_captions = '{}';

