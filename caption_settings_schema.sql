-- Caption Settings Schema
-- This table stores user-customizable settings for AI caption generation

CREATE TABLE IF NOT EXISTS caption_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO caption_settings (id, settings) 
VALUES (1, '{
    "systemPrompt": "You are a social media expert. Create engaging, platform-optimized captions from video transcripts. Focus on:\n- Hook the audience in the first line\n- Keep it conversational and engaging\n- Include relevant hashtags\n- End with a strong call-to-action\n- Optimize for each platform''s best practices",
    "tone": "casual",
    "customTone": "",
    "cta": "What do you think? Drop a comment below! 👇",
    "maxLength": 2200,
    "includeHashtags": true,
    "hashtagCount": 5,
    "platformSpecific": true,
    "facebookPrompt": "Facebook: Focus on community engagement, longer captions, and discussion starters.",
    "instagramPrompt": "Instagram: Visual storytelling, trending hashtags, and aesthetic appeal.",
    "tiktokPrompt": "TikTok: Trendy, short-form, viral potential, and youth-focused language.",
    "youtubePrompt": "YouTube: Detailed, educational, SEO-friendly, and community-focused.",
    "customVariables": {
        "brandName": "",
        "website": "",
        "handle": ""
    }
}')
ON CONFLICT (id) DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_caption_settings_updated_at ON caption_settings(updated_at);

-- Add RLS policies if needed
ALTER TABLE caption_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users (since this is global settings)
CREATE POLICY "Allow read access to caption settings" ON caption_settings
    FOR SELECT USING (true);

-- Allow insert/update for authenticated users
CREATE POLICY "Allow insert/update caption settings" ON caption_settings
    FOR ALL USING (true); 