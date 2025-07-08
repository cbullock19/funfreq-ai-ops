# FunFreq AI Ops - Setup Guide

Follow these steps to get your development environment up and running.

## 🚀 Quick Setup

### 1. Environment Variables

Create a `.env.local` file in the root directory with the following content:

```env
# Core Database & Storage
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# AI Services
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Publishing (optional for now)
META_ACCESS_TOKEN=your_meta_access_token_here
META_PAGE_ID=your_meta_page_id_here
META_INSTAGRAM_ID=your_meta_instagram_id_here

# Environment
NODE_ENV=development
```

### 2. Get Your API Keys

#### Supabase Setup:
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (2-3 minutes)
3. Go to Project Settings → API
4. Copy the following:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

#### Database Schema:
1. In your Supabase dashboard, go to SQL Editor
2. Create a new query and copy/paste the SQL from `docs/database-setup-guide.md`
3. Run the query to create all tables and functions

#### Storage Setup:
1. In Supabase dashboard, go to Storage
2. Create a new bucket called `videos`
3. Make sure it's set to public (for now)

#### AssemblyAI:
1. Sign up at [assemblyai.com](https://www.assemblyai.com/)
2. Get your API key from the dashboard
3. Add it as `ASSEMBLYAI_API_KEY`

#### OpenAI:
1. Sign up at [platform.openai.com](https://platform.openai.com/)
2. Create an API key
3. Add it as `OPENAI_API_KEY`

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

## ✅ Verification Checklist

- [ ] Created `.env.local` with all required environment variables
- [ ] Supabase project created and configured
- [ ] Database schema applied successfully
- [ ] Storage bucket 'videos' created
- [ ] AssemblyAI API key obtained
- [ ] OpenAI API key obtained
- [ ] Dependencies installed
- [ ] Development server starts without errors
- [ ] Can access http://localhost:3000

## 🚨 Common Issues

### Build Errors
If you get build errors about missing environment variables:
- Make sure `.env.local` exists and has all required variables
- Restart the development server after adding environment variables

### Database Connection Issues
- Verify your Supabase URL and keys are correct
- Check that your Supabase project is active
- Ensure RLS policies are set up correctly

### Upload Failures
- Verify Supabase storage bucket exists and is named 'videos'
- Check that your service role key has proper permissions
- Ensure file size limits are appropriate

## 🔧 Optional: Meta API Setup (for publishing)

This can be done later when you're ready to add publishing features:

1. Create a Facebook Developer account
2. Create a Facebook App
3. Get Instagram Business Account access
4. Obtain necessary tokens and IDs

## 🎯 Next Steps

Once setup is complete:
1. Visit the dashboard at http://localhost:3000
2. Try uploading a test video
3. Check that the video appears in your Supabase database
4. Review the application structure and documentation

## 💡 Tips

- Keep your API keys secure and never commit them to version control
- Use different Supabase projects for development and production
- Monitor your API usage to avoid unexpected costs
- Test with small video files first

---

Need help? Check the documentation in the `docs/` folder or open an issue on GitHub. 