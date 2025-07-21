# Dropbox Integration Setup Guide

This guide explains how to configure the Dropbox integration for automatic video processing.

## Overview

The app now uses Dropbox instead of drag-and-drop uploads to eliminate file size limits and streamline the video processing workflow.

## Environment Variables

Add these variables to your `.env.local` file:

```bash
# Dropbox Configuration
DROPBOX_ACCESS_TOKEN=your_dropbox_access_token
DROPBOX_VIDEO_FOLDER_PATH=/Client Content Portals/FunFreq/Clipped Footage (Automation Step 1)
DROPBOX_PROCESSED_FOLDER_PATH=/Client Content Portals/FunFreq/Processed Videos
```

## Getting a Dropbox Access Token

1. **Create a Dropbox App**:
   - Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
   - Click "Create app"
   - Choose "Scoped access"
   - Choose "Full Dropbox" access
   - Name your app (e.g., "FunFreq Video Processor")

2. **Configure App Settings**:
   - In your app settings, add these permissions:
     - `files.metadata.read` - Read file metadata
     - `files.content.read` - Read file content
     - `files.content.write` - Write file content (for moving processed files)

3. **Generate Access Token**:
   - In your app settings, go to "OAuth 2" tab
   - Click "Generate" under "Generated access token"
   - Copy the token and add it to `DROPBOX_ACCESS_TOKEN`

## Folder Structure

The app expects this folder structure in your Dropbox:

```
/Client Content Portals/
  /FunFreq/
    /Clipped Footage (Automation Step 1)/  # Source videos
    /Processed Videos/                      # Processed videos (optional)
```

## How It Works

1. **Video Discovery**: The app lists all video files from the configured Dropbox folder
2. **Video Selection**: Users select a video from the list
3. **Processing**: The app gets a temporary link and processes the video through the existing pipeline
4. **File Management**: Optionally moves processed videos to a "Processed" folder

## Supported Video Formats

- `.mp4` - Most common, recommended
- `.mov` - Apple QuickTime format
- `.avi` - Windows video format
- `.mkv` - Matroska video format
- `.wmv` - Windows Media format
- `.flv` - Flash video format
- `.webm` - Web video format

## Benefits

- **No file size limits**: Videos are processed directly from Dropbox
- **Streamlined workflow**: No manual uploads required
- **Automatic organization**: Processed videos can be moved to separate folders
- **Better performance**: No client-side file handling

## Troubleshooting

### "Failed to fetch videos from Dropbox"

1. Check your `DROPBOX_ACCESS_TOKEN` is correct
2. Verify the `DROPBOX_VIDEO_FOLDER_PATH` exists
3. Ensure your Dropbox app has the required permissions

### "No videos found"

1. Check the folder path in `DROPBOX_VIDEO_FOLDER_PATH`
2. Verify the folder contains video files
3. Check file extensions are supported

### "Failed to process video"

1. Check the video file is accessible
2. Verify the temporary link generation is working
3. Check the database connection

## Security Notes

- Access tokens should be kept secure
- Tokens can be revoked and regenerated if compromised
- Consider using short-lived tokens for production
- Monitor app usage in Dropbox App Console

## API Endpoints

- `GET /api/dropbox/videos` - List videos from Dropbox
- `POST /api/dropbox/process` - Process selected video

## Migration from Upload System

The old drag-and-drop upload system has been completely replaced. All references to "upload" have been updated to "select from Dropbox" throughout the application. 