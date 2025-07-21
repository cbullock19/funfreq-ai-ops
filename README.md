# FunFreq AI Ops - Social Media Content Automation Platform

A scalable web application for automating social media content creation and publishing across multiple platforms. Built with Next.js, Supabase, and AI services.

## 🚀 Features

- **Multi-Platform Publishing**: Facebook, Instagram, TikTok, YouTube (Facebook fully implemented)
- **AI-Powered Content Generation**: Automatic caption and hashtag generation
- **Dropbox Integration**: Direct video processing from Dropbox folders (no file size limits)
- **Video Processing**: Transcribe and optimize videos for different platforms
- **Analytics Dashboard**: Track performance across all platforms
- **Token Management**: Secure OAuth integration with social media platforms
- **Professional UI**: Clean, modern interface with professional icons

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage
- **AI Services**: OpenAI GPT-4, AssemblyAI
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Facebook Developer account
- OpenAI API key
- AssemblyAI API key

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/funfreq-ai-ops.git
cd funfreq-ai-ops
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your environment variables (see [Environment Variables](#environment-variables) section).

### 4. Database Setup

Run the database migrations:

```bash
# Run these SQL files in your Supabase SQL editor:
# - platform_optimization_schema.sql
# - facebook_tokens_schema.sql
# - analytics_schema.sql
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🔧 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `META_ACCESS_TOKEN` | Facebook page access token | `EAALKghCnDO4BPNCe1ZA2i5fpbG7...` |
| `META_PAGE_ID` | Facebook page ID | `604489102757371` |
| `META_APP_ID` | Facebook app ID | `123456789012345` |
| `META_APP_SECRET` | Facebook app secret | `abcdef1234567890abcdef1234567890` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `ASSEMBLYAI_API_KEY` | AssemblyAI API key | `your_assemblyai_key` |
| `DROPBOX_ACCESS_TOKEN` | Dropbox access token | `sl.xxx...` |
| `DROPBOX_VIDEO_FOLDER_PATH` | Dropbox folder path | `/Client Content Portals/FunFreq/Clipped Footage (Automation Step 1)` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `NEXT_PUBLIC_APP_URL` | App URL for OAuth | `http://localhost:3000` |
| `ANALYTICS_ENABLED` | Enable analytics | `true` |
| `DROPBOX_PROCESSED_FOLDER_PATH` | Dropbox processed folder path | Not set (files not moved) |

## 🚀 Deployment

### Deploy to Vercel

1. **Connect to GitHub**:
   - Push your code to GitHub
   - Connect your repository to Vercel

2. **Configure Environment Variables**:
   - Go to your Vercel project settings
   - Add all environment variables from `.env.example`
   - Update URLs to use your production domain

3. **Deploy**:
   - Vercel will automatically deploy on push to main branch
   - Or manually deploy from the Vercel dashboard

### Production Checklist

- [ ] All environment variables set in Vercel
- [ ] Database migrations run in Supabase
- [ ] Facebook app configured with production domain
- [ ] OAuth redirect URIs updated for production
- [ ] SSL certificates configured
- [ ] Analytics tracking enabled

## 📱 Platform Setup

### Facebook Setup

1. **Create Facebook App**:
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app
   - Add Facebook Login product

2. **Configure OAuth**:
   - Set redirect URI: `https://your-domain.com/facebook-token`
   - Add required permissions: `pages_manage_posts`, `pages_read_engagement`

3. **Get Page Access Token**:
   - Use the admin setup page in the app
   - Or manually generate a long-lived token

### Other Platforms

- **Instagram**: Coming soon
- **TikTok**: Coming soon  
- **YouTube**: Coming soon

## 🏗️ Project Structure

```
funfreq_ops/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin pages
│   ├── analytics/         # Analytics dashboard
│   ├── review/            # Video review pages
│   ├── settings/          # Platform settings
│   └── upload/            # Video upload
├── components/            # React components
│   ├── ai/               # AI processing components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   ├── ui/               # UI components
│   └── video/            # Video components
├── lib/                  # Utility libraries
│   ├── analytics/        # Analytics services
│   ├── errors/           # Error handling
│   └── utils/            # Utility functions
├── docs/                 # Documentation
└── scripts/              # Utility scripts
```

## 🔍 API Endpoints

### Video Management
- `GET /api/dropbox/videos` - List videos from Dropbox
- `POST /api/dropbox/process` - Process selected Dropbox video
- `POST /api/upload/record` - Create video record (legacy)
- `GET /api/videos` - List all videos
- `GET /api/videos/[id]` - Get video details
- `PATCH /api/videos/[id]` - Update video

### Publishing
- `POST /api/publish` - Publish video to platforms
- `POST /api/generate-caption` - Generate AI captions
- `POST /api/transcribe` - Transcribe video

### Analytics
- `GET /api/analytics` - Get analytics summary
- `GET /api/facebook/token-status` - Check Facebook token

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@funfreq.com or create an issue in this repository.

## 🔄 Changelog

### v1.0.0 (Current)
- Initial release
- Facebook integration
- AI-powered content generation
- Video processing pipeline
- Analytics dashboard
- Multi-platform publishing system
