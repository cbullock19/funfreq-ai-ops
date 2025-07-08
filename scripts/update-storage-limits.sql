-- Update Supabase Storage bucket limits to allow larger files
-- Run this in your Supabase SQL editor

-- Update the videos bucket to allow larger files (up to 500MB)
UPDATE storage.buckets 
SET file_size_limit = 524288000  -- 500MB in bytes
WHERE id = 'videos';

-- Verify the change
SELECT id, name, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'videos'; 