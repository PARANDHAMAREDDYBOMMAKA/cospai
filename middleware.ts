import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle WebContainer connection requests (rewrite to API route)
  if (pathname.startsWith('/webcontainer/connect/')) {
    const token = pathname.split('/webcontainer/connect/')[1]
    const url = request.nextUrl.clone()
    url.pathname = `/api/webcontainer/connect/${token}`
    console.log('[Middleware] Rewriting WebContainer connect:', pathname, '->', url.pathname)
    return NextResponse.rewrite(url)
  }

  // Apply auth middleware for protected routes
  const protectedPaths = [
    '/dashboard',
    '/editor',
    '/learn',
    '/api/projects',
    '/api/files',
    '/api/courses',
  ]

  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtectedPath) {
    return auth(request as any) as any
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/editor/:path*',
    '/learn/:path*',
    '/api/projects/:path*',
    '/api/files/:path*',
    '/api/courses/:path*',
    '/webcontainer/:path*',
  ],
}
