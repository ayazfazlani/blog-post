import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, service workers, and sitemaps
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('firebase-messaging-sw.js') ||
    pathname.includes('service-worker') ||
    pathname.startsWith('/sitemap') ||
    pathname === '/robots.txt'
  ) {
    return NextResponse.next();
  }

  // For login/register pages: if user is already logged in, redirect to dashboard
  if (pathname.startsWith('/admin-user-login') || pathname.startsWith('/register')) {
    const cookieToken = request.cookies.get('auth-token')?.value;
    if (cookieToken && JWT_SECRET) {
      try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        await jwtVerify(cookieToken, secret);
        // User is logged in, redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch {
        // Token invalid, allow access to login/register
        return NextResponse.next();
      }
    }
    // No token, allow access to login/register
    return NextResponse.next();
  }

  // Protect dashboard routes only
  if (pathname.startsWith('/dashboard')) {
    // First, check for token in cookie (set by login API)
    const cookieToken = request.cookies.get('auth-token')?.value;

    // If no cookie token, check Authorization header (for API calls)
    const authHeader = request.headers.get('authorization');
    const headerToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    const token = cookieToken || headerToken;

    if (!token) {
      const loginUrl = new URL('/admin-user-login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token
    try {
      if (!JWT_SECRET) {
        console.error('⚠️ JWT_SECRET is not set in environment variables');
        return NextResponse.redirect(new URL('/login', request.url));
      }
      const secret = new TextEncoder().encode(JWT_SECRET);
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch (error) {
      // Token invalid or expired - clear cookie and redirect
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
  ],
}