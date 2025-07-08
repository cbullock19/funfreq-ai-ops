# Analytics Schema Setup Instructions

## 🚨 **IMMEDIATE ACTION REQUIRED**

The analytics system is ready but needs the database schema to be created. Follow these steps:

## 📋 **Step 1: Run the Analytics Schema**

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your FunFreq AI Ops project
   - Navigate to **SQL Editor**

2. **Copy and Paste the Schema**
   - Open the `analytics_schema.sql` file in your project
   - Copy the entire contents
   - Paste it into the Supabase SQL Editor

3. **Execute the Schema**
   - Click **Run** to execute the SQL
   - This will create all necessary tables and functions

**✅ FIXED:** The schema has been corrected to use the proper column name `posted_at` instead of `published_at`.

**✅ FIXED:** Function dependency issues resolved by using inline engagement rate calculations instead of function calls.

## 🧪 **Step 1.5: Test the Schema (Optional)**

To verify everything works correctly, run the test script:

1. **Copy the test script**
   - Open the `test-schema.sql` file in your project
   - Copy the entire contents
   - Paste it into the Supabase SQL Editor

2. **Run the test**
   - Click **Run** to execute the test
   - You should see all ✅ status indicators
   - The test will clean up after itself

## ✅ **What the Schema Creates:**

### Tables:
- `posts` - Tracks published content across platforms
- `analytics` - Stores platform-specific metrics
- `analytics_config` - Platform configuration and credentials
- `analytics_summary_cache` - Performance optimization
- `analytics_errors` - Error tracking and logging

### Functions:
- `refresh_analytics_summary_cache()` - Cache management
- `update_updated_at_column()` - Automatic timestamp updates

### Calculations:
- **Inline engagement rate calculations** - Handles division by zero safely
- **Platform-specific metrics** - Aggregated with proper error handling

### Indexes:
- Performance optimization for all queries
- Platform-specific lookups
- Time-based analytics queries

## 🔍 **Step 2: Verify Setup**

After running the schema, test the analytics API:

```bash
# Test the analytics endpoint
curl "http://localhost:3001/api/analytics?period=30"
```

You should see a response like:
```json
{
  "success": true,
  "data": {
    "total_videos": 0,
    "total_posts": 0,
    "total_views": 0,
    "total_engagement": 0,
    "total_reach": 0,
    "total_impressions": 0,
    "period_start": "2024-01-01T00:00:00.000Z",
    "period_end": "2024-01-31T23:59:59.999Z",
    "platforms": {}
  }
}
```

## 🎯 **Step 3: Test with Real Data**

1. **Publish a video to Facebook** through your app
2. **Check the analytics dashboard** at `/analytics`
3. **Verify real data appears** instead of placeholder zeros

## 🚧 **Troubleshooting**

### If you get database errors:
- Make sure you're in the correct Supabase project
- Check that the SQL executed without errors
- Verify all tables were created in the **Table Editor**

### If analytics API returns errors:
- Check the browser console for specific error messages
- Verify the `posts` table exists in your database
- Ensure all foreign key relationships are correct

### If no data appears:
- This is normal if you haven't published any content yet
- Publish a video to Facebook to see real analytics
- Check that your Facebook API credentials are configured

## 📊 **Expected Results**

After setup, your analytics dashboard should show:
- ✅ Real Facebook post counts (if you have published content)
- ✅ Actual metrics instead of placeholder zeros
- ✅ Platform status indicators (Facebook: Active, Others: Coming Soon)
- ✅ Working refresh and period selection

## 🔄 **Next Steps**

Once the schema is running:
1. **Publish content** to see real analytics
2. **Monitor the analytics dashboard** for performance insights
3. **Set up scheduled updates** for automatic data collection
4. **Prepare for Instagram/TikTok/YouTube** when those platforms are connected

---

**The analytics system is now ready to provide real performance insights across all your social media platforms!** 🚀 