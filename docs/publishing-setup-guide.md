# Publishing Setup Guide

This guide will help you set up social media publishing for Instagram and Facebook using the Meta Graph API.

## 🚀 Publishing is Now Live!

The publishing functionality has been implemented and is ready to use. You can now:

✅ **Publish to Instagram** - Reels with captions and hashtags
✅ **Publish to Facebook** - Video posts with descriptions  
⏳ **TikTok** - Coming soon (requires business API approval)
⏳ **YouTube** - Coming soon (requires Google API setup)

## 📋 Required Environment Variables

Add these to your `.env.local` file:

```env
# Facebook Publishing (Required for Facebook)
META_ACCESS_TOKEN=your_facebook_access_token_here
META_PAGE_ID=your_facebook_page_id_here

# Instagram Publishing (Required for Instagram) 
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
INSTAGRAM_USER_ID=your_instagram_user_id_here
```

**🔥 NEW: Separate Token System**
- **Facebook and Instagram now use separate tokens** for better reliability
- **You can publish to Facebook without Instagram credentials** (and vice versa)
- **Mixed publishing:** If only Facebook is configured, Instagram will be skipped automatically

## ⚡ Quick Start: Test Facebook Publishing Now

**You already have working Facebook credentials!** Add these to your `.env.local`:

```env
META_ACCESS_TOKEN=EAALKghCnDO4BPNYntoTH0Oynr0QdqfOxMXvbioXnFF66L3wrEhcXYF086mwb5uO4CB2lEYVMZA1ZB7ny417AFbeCLDrNa3XjycBRsZAz6t4Sqyd0ay4EDXhcZBcZA1S0xnAMgOxhJkEzn4YnQc5AKYQ1GvOIJZBXyXxkZCbsRG6ZAmLww3NS6ZCbo2W5CYd0NUAxYVtYfuZAS9WnhNqZA31ZBWDaeqBgGkdHVzBzTPufiGkZD
META_PAGE_ID=604489102757371
```

Then restart your app and test Facebook publishing immediately! Instagram will be automatically skipped until you add those credentials later.

## 📱 **Instagram Publishing Setup**

For Instagram publishing, see the complete guide: **[Instagram Setup Guide](instagram-setup-guide.md)**

**Quick Instagram Setup:**
1. Add Instagram Basic Display to your Meta app
2. Get Instagram Business Account ID from Facebook page settings
3. Generate Instagram access token with proper permissions
4. Add to `.env.local`:
   ```env
   INSTAGRAM_ACCESS_TOKEN=your_instagram_token
   INSTAGRAM_USER_ID=your_instagram_business_id
   ```

## 🔧 Meta Graph API Setup

### Step 1: Facebook Developer Account

1. Go to [developers.facebook.com](https://developers.facebook.com/)
2. Create a developer account if you don't have one
3. Verify your account (may require phone number)

### Step 2: Create a Facebook App

1. Click "Create App" → "Business" → "Next"
2. App name: "FunFreq AI Ops" (or your preferred name)
3. App contact email: your email
4. Business Manager account: Create or select one
5. Click "Create App"

### Step 3: Add Instagram Basic Display

1. In your app dashboard, click "Add Product"
2. Find "Instagram Basic Display" and click "Set Up"
3. Go to Instagram Basic Display → Basic Display → Settings
4. Add your website URL and redirect URIs:
   - Valid OAuth Redirect URIs: `https://yourdomain.com/auth/callback`
   - Deauthorize Callback URL: `https://yourdomain.com/auth/deauthorize`
   - Data Deletion Request URL: `https://yourdomain.com/auth/delete`

### Step 4: Get Facebook Page Access

1. In App Dashboard, go to "App Review" → "Permissions and Features"
2. Request these permissions:
   - `pages_show_list` 
   - `pages_manage_posts`
   - `pages_read_engagement`

### Step 5: Get Instagram Business Account Access

1. Convert your Instagram account to a Business account if not already
2. Connect it to your Facebook Page
3. In App Dashboard, request these permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `instagram_manage_insights`

### Step 6: Generate Access Tokens

#### Option A: Graph API Explorer (Quick Test)

1. Go to [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)
2. Select your app from the dropdown
3. Click "Get Token" → "Get User Access Token"
4. Select required permissions
5. Copy the generated token

⚠️ **Note**: This token expires in 1-2 hours. For production, use Option B.

#### Option B: Long-lived Tokens (Production)

1. Use the short-lived token from Option A
2. Make this API call to extend it:

```bash
curl -X GET \
  "https://graph.facebook.com/v18.0/oauth/access_token" \
  -G \
  -d "grant_type=fb_exchange_token" \
  -d "client_id=YOUR_APP_ID" \
  -d "client_secret=YOUR_APP_SECRET" \
  -d "fb_exchange_token=SHORT_LIVED_TOKEN"
```

This gives you a 60-day token. For never-expiring tokens, exchange for a Page Access Token.

### Step 7: Get Your IDs

#### Facebook Page ID:
```bash
curl -X GET \
  "https://graph.facebook.com/v18.0/me/accounts" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Instagram Business Account ID:
```bash
curl -X GET \
  "https://graph.facebook.com/v18.0/YOUR_PAGE_ID" \
  -G \
  -d "fields=instagram_business_account" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🧪 Testing Your Setup

### Test Instagram Publishing

```bash
curl -X POST http://localhost:3000/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "your-video-id",
    "platforms": ["instagram"]
  }'
```

### Test Facebook Publishing

```bash
curl -X POST http://localhost:3000/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "your-video-id", 
    "platforms": ["facebook"]
  }'
```

## 🔒 Security Best Practices

### Environment Variables
Never commit API keys to version control:

```bash
# Add to .gitignore
.env.local
.env.production
```

### Token Management
- Use long-lived tokens for production
- Store tokens securely (consider encryption)
- Monitor token expiration and refresh as needed
- Implement proper error handling for expired tokens

### Rate Limiting
- Meta API has rate limits per app and per user
- Implement exponential backoff for failed requests
- Monitor API usage in Facebook Developer Console

## 📊 Platform Requirements

### Instagram
- **Video Format**: MP4, MOV
- **Duration**: 15 seconds to 10 minutes for Reels
- **Resolution**: Minimum 720p, recommended 1080p
- **Aspect Ratio**: 9:16 (vertical) for Reels
- **File Size**: Maximum 1GB

### Facebook
- **Video Format**: MP4, MOV, AVI
- **Duration**: Up to 240 minutes
- **Resolution**: Minimum 720p
- **File Size**: Maximum 10GB
- **Captions**: Automatically generated + your custom ones

## 🚨 Common Issues & Solutions

### "Invalid Access Token" Error
- Check token hasn't expired
- Verify correct permissions granted
- Regenerate token if needed

### "Instagram Account Not Found" Error  
- Ensure Instagram account is converted to Business
- Verify it's connected to your Facebook Page
- Check the Instagram Business Account ID is correct

### "Video Upload Failed" Error
- Verify video meets platform requirements
- Check file URL is publicly accessible
- Ensure video format is supported

### "Publishing Timeout" Error
- Meta API can take time to process videos
- Publishing happens in background - check status later
- Large files may take several minutes

## 📈 Monitoring & Analytics

### Check Publishing Status
The app automatically tracks publishing status in the `posts` table:

```sql
SELECT 
  v.title,
  p.platform,
  p.status,
  p.post_url,
  p.posted_at
FROM videos v
JOIN posts p ON v.id = p.video_id
ORDER BY p.posted_at DESC;
```

### Meta Insights API
For detailed analytics, integrate with Meta's Insights API:

```javascript
// Get Instagram post insights
const insights = await fetch(
  `https://graph.facebook.com/v18.0/${POST_ID}/insights` +
  `?metric=impressions,reach,likes,comments,shares` +
  `&access_token=${ACCESS_TOKEN}`
)
```

## 🔮 Future Platforms

### TikTok Business API
- Requires business verification
- Apply at [developers.tiktok.com](https://developers.tiktok.com/)
- Currently supports hashtag challenges and branded effects

### YouTube Data API
- Requires Google Cloud Project
- Set up OAuth 2.0 credentials  
- YouTube Shorts support available

## 🆘 Support

### Official Documentation
- [Meta for Developers](https://developers.facebook.com/docs/)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)

### Debugging Tools
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
- [Webhook Test Tool](https://developers.facebook.com/tools/webhooks/)

---

**Ready to publish!** 🚀 Once you've completed this setup, you can publish videos directly from the app's review interface. 