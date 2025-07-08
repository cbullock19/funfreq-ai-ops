# Instagram Publishing Setup Guide

This guide will help you set up Instagram publishing using the separate token approach, independent of Facebook.

## 🎯 **Current Status**
- ✅ **Facebook publishing** - Working with META_ACCESS_TOKEN + META_PAGE_ID
- ⏳ **Instagram publishing** - Ready to configure with separate tokens
- ✅ **Dual-token system** - Already implemented and tested

## 📋 **Required Environment Variables**

Add these to your `.env.local` file:

```env
# Facebook Publishing (Already working)
META_ACCESS_TOKEN=EAALKghCnDO4BPNYntoTH0Oynr0QdqfOxMXvbioXnFF66L3wrEhcXYF086mwb5uO4CB2lEYVMZA1ZB7ny417AFbeCLDrNa3XjycBRsZAz6t4Sqyd0ay4EDXhcZBcZA1S0xnAMgOxhJkEzn4YnQc5AKYQ1GvOIJZBXyXxkZCbsRG6ZAmLww3NS6ZCbo2W5CYd0NUAxYVtYfuZAS9WnhNqZA31ZBWDaeqBgGkdHVzBzTPufiGkZD
META_PAGE_ID=604489102757371

# Instagram Publishing (New - separate tokens)
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
INSTAGRAM_USER_ID=your_instagram_business_account_id_here
```

## 🔧 **Step-by-Step Setup**

### **Step 1: Meta Developer App Configuration**

1. **Go to Meta Developer Dashboard**: https://developers.facebook.com/
2. **Select your existing app** (same one used for Facebook)
3. **Add Instagram Basic Display Product**:
   - Click "Add Product" 
   - Find "Instagram Basic Display" and click "Set Up"
   - This enables Instagram API access

### **Step 2: Get Instagram Business Account ID**

**Manual Method (Recommended)**
1. Go to your Facebook Page Settings: https://www.facebook.com/pages/manage/
2. Select your page (ID: 604489102757371)
3. Navigate to "Instagram" section in the left sidebar
4. Click "Connect Account" if Instagram isn't connected
5. Make sure your Instagram account is set to **Business/Creator mode**
6. The Instagram Business Account ID will be displayed in the connection details

**Alternative: Graph API Explorer Method**
1. Go to https://developers.facebook.com/tools/explorer/
2. Select your app from dropdown
3. Use this query: `604489102757371?fields=instagram_business_account`
4. Look for the `instagram_business_account.id` in the response

### **Step 3: Get Instagram Access Token**

**Method 1: Graph API Explorer (Recommended)**
1. Go to https://developers.facebook.com/tools/explorer/
2. Select your app from dropdown
3. Click "Get Token" → "Get User Access Token"
4. Select these permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
5. Click "Generate Access Token"
6. Copy the generated token (it will be long-lived)

**Method 2: Instagram Basic Display API**
1. In your Meta app dashboard, go to "Instagram Basic Display"
2. Add your Instagram account as a test user
3. Generate a long-lived access token
4. Use the token with your Instagram Business Account ID

### **Step 4: Test Instagram Publishing**

1. **Add credentials to .env.local**:
   ```env
   INSTAGRAM_ACCESS_TOKEN=your_token_here
   INSTAGRAM_USER_ID=your_instagram_id_here
   ```

2. **Restart your app**:
   ```bash
   pkill -f "next dev" && npm run dev
   ```

3. **Test publishing**:
   - Upload a video
   - Select Instagram platform
   - Click "Publish Now"
   - Watch for Instagram-specific status updates

## 🎯 **Expected Results**

### **With Instagram Credentials Configured:**
- ✅ **Platform Selection**: Instagram shows as "Ready to publish"
- ✅ **Publishing**: Instagram posts will be published as Reels
- ✅ **Status Display**: Shows "✅ Published to Instagram" with timestamp
- ✅ **Post Links**: Direct links to Instagram posts

### **Without Instagram Credentials:**
- ⏭️ **Platform Selection**: Instagram shows as available but will be skipped
- ⏭️ **Publishing**: Instagram will be automatically skipped
- ⏭️ **Status Display**: Shows "⏭️ Instagram: Skipped: No credentials configured"

## 🔍 **Troubleshooting**

### **"No Instagram Business Account found"**
- Ensure Instagram account is connected to Facebook page
- Make sure Instagram account is in Business/Creator mode
- Check Facebook page settings for Instagram connection

### **"Instagram credentials not configured"**
- Verify INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID are set
- Check that tokens have proper permissions
- Ensure Instagram Basic Display product is added to app

### **"Instagram publish failed"**
- Check video format (Instagram supports MP4, MOV)
- Verify video meets Instagram requirements (max 90 seconds for Reels)
- Ensure caption doesn't exceed Instagram limits

## 📊 **Instagram Publishing Features**

### **What Works:**
- ✅ **Reels publishing** with captions and hashtags
- ✅ **Platform-specific captions** (Instagram-optimized)
- ✅ **Real-time status tracking** with post URLs
- ✅ **Error handling** with specific Instagram error messages
- ✅ **Mixed platform publishing** (Facebook + Instagram simultaneously)

### **Instagram-Specific Optimizations:**
- **Caption length**: Optimized for Instagram's 2200 character limit
- **Hashtag strategy**: Instagram-optimized hashtag suggestions
- **Video format**: Automatically publishes as Instagram Reels
- **Post URLs**: Direct links to published Instagram content

## 🚀 **Quick Test Commands**

Once you have your credentials, test them with these curl commands:

```bash
# Test Instagram Business Account ID
curl -X GET "https://graph.facebook.com/v18.0/YOUR_INSTAGRAM_USER_ID?access_token=YOUR_INSTAGRAM_ACCESS_TOKEN"

# Test Instagram permissions
curl -X GET "https://graph.facebook.com/v18.0/YOUR_INSTAGRAM_USER_ID/media?access_token=YOUR_INSTAGRAM_ACCESS_TOKEN"
```

## 🎯 **Next Steps**

1. **Get Instagram Business Account ID** using the manual method above
2. **Generate Instagram access token** with proper permissions
3. **Add credentials to .env.local** and restart app
4. **Test Instagram publishing** with a video
5. **Monitor publishing status** in the review interface

Your Instagram publishing will work independently of Facebook, giving you full control over both platforms! 🎉 