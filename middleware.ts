import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';
import { getCategoryRedirectTarget } from '@/lib/categoryRedirects';

const LEGACY_GONE_PATHS = new Set([
  '/company',
  '/info',
  '/license',
]);

const LEGACY_GONE_PREFIXES = [
  '/catalog/mashini_motocikli_tehnika-17',
  '/catalog/lego-11',
];

export async function middleware(request: NextRequest) {
  const { pathname, hostname, search } = request.nextUrl;
  const normalizedPath =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.replace(/\/+$/, "") : pathname;
  const canonicalOrigin = hostname === "www.gameshop24.ru" ? "https://gameshop24.ru" : request.nextUrl.origin;

  const withSecurityHeaders = (response: NextResponse) => {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    return response;
  };

  if (normalizedPath.startsWith("/catalog/") && normalizedPath.includes("copy")) {
    try {
      const url = new URL("/api/seo/resolve-copy", request.url);
      url.searchParams.set("path", normalizedPath);
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { targetUrl?: string | null };
        if (data.targetUrl) {
          return withSecurityHeaders(NextResponse.redirect(new URL(data.targetUrl), 301));
        }
      }
      const response = new NextResponse('Gone', { status: 410 });
      response.headers.set('Cache-Control', 'public, max-age=86400');
      return withSecurityHeaders(response);
    } catch {
      const response = new NextResponse('Gone', { status: 410 });
      response.headers.set('Cache-Control', 'public, max-age=86400');
      return withSecurityHeaders(response);
    }
  }

  const isLegacyGone =
    LEGACY_GONE_PATHS.has(normalizedPath) ||
    LEGACY_GONE_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix));

  if (isLegacyGone) {
    const response = new NextResponse('Gone', { status: 410 });
    response.headers.set('Cache-Control', 'public, max-age=86400');
    return withSecurityHeaders(response);
  }

  // /catalog → /catalog/all with canonical host (single-hop redirect)
  if (normalizedPath === '/catalog') {
    const target = new URL(`${canonicalOrigin}/catalog/all${search}`);
    return withSecurityHeaders(NextResponse.redirect(target, 301));
  }

  // Canonicalize host + trailing slash in a single redirect (except root)
  const hasTrailingSlash = pathname.length > 1 && pathname.endsWith("/");
  if (hostname === "www.gameshop24.ru" || hasTrailingSlash) {
    const target = new URL(`${canonicalOrigin}${normalizedPath}${search}`);
    return withSecurityHeaders(NextResponse.redirect(target, 301));
  }

  const categoryRedirectTarget = getCategoryRedirectTarget(normalizedPath);
  if (categoryRedirectTarget) {
    const target = new URL(`${canonicalOrigin}${categoryRedirectTarget}${search}`);
    return withSecurityHeaders(NextResponse.redirect(target, 301));
  }

  // /admin routes — protection handled by layout (Node.js runtime, not Edge)
  // /api/admin routes — protection handled inside each route handler

  // Protect /account routes — server-side redirect to login
  if (normalizedPath.startsWith('/account')) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return withSecurityHeaders(NextResponse.redirect(new URL('/auth/login?next=' + encodeURIComponent(normalizedPath), request.url)));
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    '/account/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sitemaps/|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|css|js|woff|woff2)$).*)',
  ],
};
