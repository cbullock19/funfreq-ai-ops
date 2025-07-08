# FunFreq AI Ops - Content Automation Platform

Transform raw videos into published social media posts with minimal human intervention using AI-powered automation.

## 🎯 Core Flow

**Upload Video** → **AI Transcription** → **AI Caption Generation** → **Manual Review** → **Multi-Platform Publishing** → **Analytics Tracking**

## ✨ Features

- **Video Upload**: Drag & drop interface with progress tracking
- **AI Transcription**: Powered by AssemblyAI for accurate speech-to-text
- **Smart Captions**: OpenAI generates platform-optimized social media captions
- **Multi-Platform Publishing**: Instagram, Facebook, TikTok, YouTube support
- **Analytics Dashboard**: Track performance across all platforms
- **Error Handling**: Comprehensive error recovery and user feedback

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL) 
- **Storage**: Supabase Storage
- **AI Services**: AssemblyAI (transcription) + OpenAI (captions)
- **Publishing**: Meta Graph API (Instagram/Facebook)
- **Deployment**: Vercel

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ 
- Supabase account
- AssemblyAI API key
- OpenAI API key

### 2. Installation

```bash
# Clone the repository (if from git)
git clone <repository-url>
cd funfreq-ai-ops

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### 3. Environment Setup

Create a `.env.local` file with your API keys:

```env
# Core Database & Storage
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# AI Services  
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Publishing (add later)
META_ACCESS_TOKEN=your_meta_access_token_here
META_PAGE_ID=your_meta_page_id_here
META_INSTAGRAM_ID=your_meta_instagram_id_here
```

### 4. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL commands from `docs/database-setup-guide.md` in your Supabase SQL Editor
3. Create a storage bucket called 'videos' in your Supabase Storage

### 5. Start Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
funfreq-ai-ops/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   └── upload/        # Video upload endpoint
│   ├── upload/            # Upload page
│   ├── analytics/         # Analytics dashboard
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Basic UI components
│   ├── forms/            # Form components
│   ├── video/            # Video-specific components
│   └── layout/           # Layout components
├── lib/                  # Utilities and configurations
│   ├── supabase.ts       # Database client
│   ├── errors/           # Error handling
│   └── utils/            # Helper functions
└── docs/                 # Documentation
```

## 🎥 How It Works

### 1. Video Upload
- Users drag & drop video files (MP4, MOV, AVI, MKV)
- Files are validated and uploaded to Supabase Storage
- Video metadata is stored in the database

### 2. AI Processing
- **Transcription**: AssemblyAI converts speech to text with confidence scores
- **Caption Generation**: OpenAI creates platform-specific captions and hashtags
- **Review**: Users can edit generated content before publishing

### 3. Publishing (Coming Soon)
- Multi-platform publishing to Instagram, Facebook, TikTok
- Scheduled posting capabilities
- Performance tracking and analytics

## 🔧 Configuration

### Database Schema

The application uses the following main tables:

- **videos**: Store video metadata, transcripts, and processing status
- **posts**: Track published content across platforms  
- **donations**: Attribution tracking for fundraising
- **platform_settings**: Store API credentials and configuration

See `docs/database-setup-guide.md` for complete schema and setup instructions.

### Error Handling

The application implements comprehensive error handling:

- **Retry Logic**: Exponential backoff for API failures
- **Circuit Breakers**: Prevent cascading failures
- **User Feedback**: Clear error messages and recovery options

See `docs/error-handling-guide.md` for implementation details.

## 🚦 Development Status

### ✅ Completed (MVP)
- [x] Project setup and configuration
- [x] Video upload with drag & drop
- [x] Database integration
- [x] Basic UI components and layout
- [x] Error handling foundation

### 🚧 In Progress
- [ ] AssemblyAI transcription integration
- [ ] OpenAI caption generation
- [ ] Review & edit interface

### 📋 Planned
- [ ] Meta Graph API integration
- [ ] Multi-platform publishing
- [ ] Analytics and tracking
- [ ] Scheduled posting
- [ ] User authentication

## 🔌 API Endpoints

### POST `/api/upload`
Upload video files to storage and create database records.

**Request**: FormData with 'video' file
**Response**: `{ success: boolean, video?: VideoData, error?: string }`

### POST `/api/transcribe` (Coming Soon)
Trigger AI transcription for uploaded videos.

### POST `/api/generate-caption` (Coming Soon) 
Generate AI-powered captions from transcripts.

### POST `/api/publish` (Coming Soon)
Publish content to social media platforms.

## 🏗 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📚 Documentation

- [Database Setup Guide](docs/database-setup-guide.md)
- [Component Architecture](docs/component-architecture.md) 
- [Error Handling Guide](docs/error-handling-guide.md)
- [API Integration Guide](docs/api-integrations-improved.md)
- [Deployment Guide](docs/deployment-guide.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions and support:
- Check the documentation in the `docs/` folder
- Open an issue on GitHub
- Review the error handling guide for troubleshooting

---

**Built with ❤️ for automated content creation**
