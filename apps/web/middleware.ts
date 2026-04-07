import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MOBILE_UA =
  /Mobile|Android|iPhone|iPad|webOS|BlackBerry|IEMobile|Opera Mini/i;

/**
 * Lets crawlers / link-preview bots re-fetch HTML instead of serving a long-lived stale copy.
 * Telegram still caches previews on its side; combine with redeploy + @webpagebot or ?v= on the URL.
 *
 * `/` — `x-home-variant` (mobile|desktop) so the server renders only one home tree (no duplicate RSC/data).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  if (pathname === '/') {
    const requestHeaders = new Headers(request.headers);
    const cookieVariant = request.cookies.get('home-variant')?.value;
    const ua = request.headers.get('user-agent') ?? '';
    const variant =
      cookieVariant === 'mobile' || cookieVariant === 'desktop'
        ? cookieVariant
        : MOBILE_UA.test(ua)
          ? 'mobile'
          : 'desktop';
    requestHeaders.set('x-home-variant', variant);

    const res = NextResponse.next({
      request: { headers: requestHeaders },
    });
    res.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    if (!cookieVariant) {
      res.cookies.set('home-variant', variant, {
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
        sameSite: 'lax',
      });
    }
    return res;
  }

  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  return response;
}

export const config = {
  matcher: '/:path*',
};
