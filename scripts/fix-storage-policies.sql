-- Fix Supabase Storage RLS Policies for videos bucket
-- Run this in your Supabase SQL editor

-- First, let's see what policies exist
SELECT * FROM storage.policies WHERE bucket_id = 'videos';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous reads" ON storage.objects;

-- Create policy to allow anonymous uploads to videos bucket
CREATE POLICY "Allow anonymous uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'videos' 
  AND auth.role() = 'anon'
);

-- Create policy to allow anonymous reads from videos bucket
CREATE POLICY "Allow anonymous reads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'videos' 
  AND auth.role() = 'anon'
);

-- Create policy to allow anonymous updates (for metadata)
CREATE POLICY "Allow anonymous updates" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'videos' 
  AND auth.role() = 'anon'
);

-- Verify the policies were created
SELECT * FROM storage.policies WHERE bucket_id = 'videos'; 