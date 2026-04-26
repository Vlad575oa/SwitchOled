import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const withSecurityHeaders = (response: NextResponse) => {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    return response;
  };

  // /admin routes — protection handled by layout (Node.js runtime, not Edge)
  // /api/admin routes — protection handled inside each route handler

  // Protect /account routes — server-side redirect to login
  if (pathname.startsWith('/account')) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return withSecurityHeaders(NextResponse.redirect(new URL('/auth/login?next=' + encodeURIComponent(pathname), request.url)));
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/account/:path*'],
};
