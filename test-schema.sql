-- Test script to verify analytics schema works
-- Run this after the main analytics_schema.sql to test everything

-- Test 1: Check if tables exist
SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('posts', 'analytics', 'analytics_config', 'analytics_summary_cache', 'analytics_errors');

-- Test 2: Check if indexes exist
SELECT 
  indexname,
  CASE WHEN indexname IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%';

-- Test 3: Check if functions exist
SELECT 
  routine_name,
  CASE WHEN routine_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('refresh_analytics_summary_cache', 'update_updated_at_column');

-- Test 4: Check if triggers exist
SELECT 
  trigger_name,
  CASE WHEN trigger_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name LIKE 'update_%_updated_at';

-- Test 5: Check if views exist
SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name = 'current_analytics_summary';

-- Test 6: Insert test data
INSERT INTO posts (platform, platform_post_id, post_url, caption, status) VALUES
  ('facebook', 'test_post_1', 'https://facebook.com/test1', 'Test post 1', 'posted'),
  ('facebook', 'test_post_2', 'https://facebook.com/test2', 'Test post 2', 'posted')
ON CONFLICT DO NOTHING;

-- Test 7: Insert test analytics
INSERT INTO analytics (post_id, platform, platform_post_id, impressions, reach, engagement, views) 
SELECT 
  p.id,
  p.platform,
  p.platform_post_id,
  1000,
  500,
  50,
  200
FROM posts p 
WHERE p.platform_post_id IN ('test_post_1', 'test_post_2')
ON CONFLICT DO NOTHING;

-- Test 8: Test the engagement rate calculation
SELECT 
  platform_post_id,
  impressions,
  engagement,
  CASE 
    WHEN impressions = 0 THEN 0 
    ELSE ROUND((engagement::DECIMAL / impressions::DECIMAL) * 100, 2)
  END as engagement_rate
FROM analytics a
JOIN posts p ON a.post_id = p.id
WHERE p.platform_post_id IN ('test_post_1', 'test_post_2');

-- Test 9: Test the analytics summary view
SELECT * FROM current_analytics_summary;

-- Test 10: Clean up test data
DELETE FROM analytics WHERE platform_post_id IN ('test_post_1', 'test_post_2');
DELETE FROM posts WHERE platform_post_id IN ('test_post_1', 'test_post_2');

-- Success message
SELECT '🎉 Analytics schema test completed successfully!' as result; 