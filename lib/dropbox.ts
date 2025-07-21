interface DropboxFile {
  name: string
  path_lower: string
  size: number
  server_modified: string
  content_hash: string
}

interface DropboxListResponse {
  entries: DropboxFile[]
  cursor?: string
  has_more: boolean
}

interface DropboxTemporaryLinkResponse {
  link: string
  metadata: DropboxFile
}

export class DropboxAPI {
  private accessToken: string
  private baseUrl = 'https://api.dropboxapi.com/2'

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async makeRequest<T>(
    endpoint: string, 
    method: 'POST' | 'GET' = 'POST',
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Dropbox API error (${response.status}): ${errorText}`)
    }

    return response.json()
  }

  async listDropboxVideos(folderPath: string): Promise<DropboxFile[]> {
    try {
      const response = await this.makeRequest<DropboxListResponse>('/files/list_folder', 'POST', {
        path: folderPath,
        recursive: false,
        include_media_info: false,
        include_deleted: false,
        include_has_explicit_shared_members: false,
        include_mounted_folders: true,
        include_non_downloadable_files: false
      })

      // Filter for video files
      const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm']
      const videoFiles = response.entries.filter(file => 
        file.name && videoExtensions.some(ext => 
          file.name.toLowerCase().endsWith(ext)
        )
      )

      return videoFiles
    } catch (error) {
      console.error('Error listing Dropbox videos:', error)
      throw new Error(`Failed to list videos from Dropbox: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getTemporaryLink(path: string): Promise<string> {
    try {
      const response = await this.makeRequest<DropboxTemporaryLinkResponse>('/files/get_temporary_link', 'POST', {
        path: path
      })

      return response.link
    } catch (error) {
      console.error('Error getting temporary link:', error)
      throw new Error(`Failed to get temporary link for ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async moveFile(fromPath: string, toPath: string): Promise<void> {
    try {
      await this.makeRequest('/files/move_v2', 'POST', {
        from_path: fromPath,
        to_path: toPath,
        allow_shared_folder: false,
        autorename: true,
        allow_ownership_transfer: false
      })
    } catch (error) {
      console.error('Error moving file:', error)
      throw new Error(`Failed to move file from ${fromPath} to ${toPath}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Helper function to create Dropbox API instance
export function createDropboxAPI(): DropboxAPI {
  const accessToken = process.env.DROPBOX_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error('DROPBOX_ACCESS_TOKEN environment variable is required')
  }
  return new DropboxAPI(accessToken)
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Helper function to format date
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
} 