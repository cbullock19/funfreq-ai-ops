-- Simple fix for Supabase Storage RLS Policies
-- Run this in your Supabase SQL editor

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous uploads to videos bucket
CREATE POLICY "Allow anonymous uploads to videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'videos'
);

-- Create policy to allow anonymous reads from videos bucket  
CREATE POLICY "Allow anonymous reads from videos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'videos'
);

-- Create policy to allow anonymous updates to videos bucket
CREATE POLICY "Allow anonymous updates to videos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'videos'
);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'; 