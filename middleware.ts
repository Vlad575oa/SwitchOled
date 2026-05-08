import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';

const LEGACY_GONE_PATHS = new Set([
  '/company',
  '/company/',
  '/info',
  '/info/',
  '/license',
  '/license/',
  '/policy',
  '/policy/',
]);

const LEGACY_GONE_PREFIXES = [
  '/catalog/mashini_motocikli_tehnika-17',
  '/catalog/lego-11',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const withSecurityHeaders = (response: NextResponse) => {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    return response;
  };

  const isLegacyGone =
    LEGACY_GONE_PATHS.has(pathname) ||
    LEGACY_GONE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isLegacyGone) {
    const response = new NextResponse('Gone', { status: 410 });
    response.headers.set('Cache-Control', 'public, max-age=86400');
    return withSecurityHeaders(response);
  }

  // /catalog → /catalog/all (bare catalog path returns 404)
  if (pathname === '/catalog' || pathname === '/catalog/') {
    return withSecurityHeaders(NextResponse.redirect(new URL('/catalog/all', request.url), 301));
  }

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
  matcher: [
    '/account/:path*',
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|css|js|woff|woff2)$).*)',
  ],
};
