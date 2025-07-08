'use client'

export default function CompressVideoPage() {
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Video Compression Guide</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-blue-800 mb-2">Why 50MB Limit?</h2>
        <p className="text-blue-700">
          Supabase free tier has a 50MB file size limit for storage. To upload larger videos, 
          you'll need to compress them or upgrade to a paid plan.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-3">Online Compression Tools</h2>
            <ul className="space-y-2 text-gray-700">
              <li>• <a href="https://www.onlinevideoconverter.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Online Video Converter</a></li>
              <li>• <a href="https://www.youcompress.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">YouCompress</a></li>
              <li>• <a href="https://www.freeconvert.com/video-compressor" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">FreeConvert</a></li>
              <li>• <a href="https://www.media.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Media.io</a></li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">Desktop Software</h2>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>HandBrake</strong> (Free, cross-platform)</li>
              <li>• <strong>FFmpeg</strong> (Command line, advanced)</li>
              <li>• <strong>Adobe Media Encoder</strong> (Paid, professional)</li>
              <li>• <strong>VLC Media Player</strong> (Free, basic compression)</li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-3">Recommended Settings</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">For 50MB target:</h3>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• Resolution: 720p or lower</li>
                <li>• Bitrate: 1-2 Mbps</li>
                <li>• Format: MP4 (H.264)</li>
                <li>• Audio: AAC, 128kbps</li>
                <li>• Duration: Keep under 5-10 minutes</li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">Quick Tips</h2>
            <ul className="space-y-2 text-gray-700">
              <li>• Reduce resolution from 1080p to 720p</li>
              <li>• Lower the bitrate (quality vs size trade-off)</li>
              <li>• Trim unnecessary parts of the video</li>
              <li>• Use MP4 format for best compatibility</li>
              <li>• Consider splitting long videos into parts</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Need Larger Files?</h3>
            <p className="text-yellow-700 text-sm">
              Upgrade to Supabase Pro ($25/month) to upload files up to 5GB, 
              or use external storage services like AWS S3 or Cloudinary.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <a 
          href="/upload" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← Back to Upload
        </a>
      </div>
    </div>
  )
} 