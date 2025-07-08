# 🔧 Facebook Token Fix Guide

## ❌ **Current Issue:**
Your Facebook access token has expired with the error: "The session is invalid because the user logged out."

## ✅ **Solution: Enhanced Token Management System**

I've built a comprehensive token management system that will:
- **Validate tokens** before use
- **Auto-refresh tokens** when they expire
- **Retry failed requests** with fresh tokens
- **Provide detailed diagnostics** for token issues

## 🛠️ **Immediate Steps:**

### 1. **Check Your Token Status**
Visit: `http://localhost:3000/facebook-token`

This page will show you:
- ✅ Token validity status
- ⏰ Expiration date
- 🔍 Detailed error messages
- 📋 Specific recommendations

### 2. **Get a New Access Token**

**Option A: Quick Fix (Manual)**
1. Go to [Facebook Developer Console](https://developers.facebook.com/)
2. Select your app
3. Go to "Tools" → "Graph API Explorer"
4. Generate a new access token with these permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_show_list`
5. Copy the new token to your `.env.local` file

**Option B: Long-term Solution (App Setup)**
1. Set up your Facebook app properly with:
   - `FACEBOOK_APP_ID`
   - `FACEBOOK_APP_SECRET`
   - `FACEBOOK_REFRESH_TOKEN`
2. This enables automatic token refresh

### 3. **Update Environment Variables**

Add these to your `.env.local`:

```bash
# Required (you already have these)
META_ACCESS_TOKEN=your_new_access_token_here
META_PAGE_ID=your_page_id_here

# Optional (for automatic refresh)
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
FACEBOOK_REFRESH_TOKEN=your_refresh_token_here
```

## 🔄 **How the New System Works:**

### **Before Publishing:**
1. **Validates token** using Facebook's debug endpoint
2. **Checks expiration** and warns if expiring soon
3. **Attempts refresh** if token is invalid

### **During Publishing:**
1. **Uses valid token** for API calls
2. **Detects token errors** automatically
3. **Refreshes token** and retries the request
4. **Provides clear error messages** if refresh fails

### **Error Handling:**
- ✅ **Token expired** → Auto-refresh and retry
- ✅ **Session invalid** → Auto-refresh and retry  
- ✅ **Permission denied** → Clear error message
- ✅ **Network issues** → Retry with exponential backoff

## 🧪 **Testing:**

1. **Check token status:** Visit `/facebook-token`
2. **Try publishing:** Upload a video and publish to Facebook
3. **Monitor logs:** Watch for token refresh messages
4. **Verify success:** Check that posts appear on Facebook

## 📊 **Expected Behavior:**

**With Valid Token:**
```
✅ Token validation successful
✅ Publishing to Facebook...
✅ Post published successfully
```

**With Expired Token:**
```
⚠️ Token expired, attempting refresh...
✅ Token refreshed successfully
✅ Retrying publish...
✅ Post published successfully
```

## 🚀 **Benefits:**

- **No more manual token updates** (with proper app setup)
- **Automatic retry logic** for failed requests
- **Clear diagnostics** when issues occur
- **Long-term token management** solution

## 🔗 **Quick Links:**

- **Token Status:** `http://localhost:3000/facebook-token`
- **Facebook Developer Console:** https://developers.facebook.com/
- **Graph API Explorer:** https://developers.facebook.com/tools/explorer/

Try the token status page first to see exactly what's wrong with your current token! 🎯 