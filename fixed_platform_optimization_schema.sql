-- Add platform-specific caption columns to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS ai_captions JSONB DEFAULT '{}';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS final_captions JSONB DEFAULT '{}';

-- Add index for platform caption queries
CREATE INDEX IF NOT EXISTS idx_videos_ai_captions ON videos USING GIN(ai_captions);

-- Update existing records to have proper structure (fixed type conversion)
UPDATE videos 
SET ai_captions = jsonb_build_object(
  'instagram', jsonb_build_object(
    'caption', COALESCE(ai_caption, ''),
    'hashtags', COALESCE(to_jsonb(ai_hashtags), '[]'::jsonb),
    'char_count', LENGTH(COALESCE(ai_caption, '') || COALESCE(array_to_string(ai_hashtags, ' '), ''))
  )
)
WHERE ai_caption IS NOT NULL AND ai_captions = '{}';

