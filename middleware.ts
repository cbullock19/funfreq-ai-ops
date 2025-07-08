import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Handle large file uploads for the upload API route
  if (request.nextUrl.pathname === '/api/upload' && request.method === 'POST') {
    // Set a higher timeout and body size limit for uploads
    const response = NextResponse.next()
    response.headers.set('max-body-size', '500mb')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/upload',
} 