import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Lets crawlers / link-preview bots re-fetch HTML instead of serving a long-lived stale copy.
 * Telegram still caches previews on its side; combine with redeploy + @webpagebot or ?v= on the URL.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  // Typical static assets from /public (favicon, images, fonts, etc.)
  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  return response;
}

export const config = {
  matcher: '/:path*',
};
