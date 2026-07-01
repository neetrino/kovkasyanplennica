import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  healthProbeResponse,
  shouldBypassForUptimeProbe,
} from './lib/health/uptime-probe';

const MOBILE_UA =
  /Mobile|Android|iPhone|iPad|webOS|BlackBerry|IEMobile|Opera Mini/i;

/**
 * `/` — `x-home-variant` (mobile|desktop) so the server renders only one home tree (no duplicate RSC/data).
 *
 * Do not override Cache-Control here — Next.js ISR / route handlers set CDN-friendly headers.
 * Forcing `max-age=0, must-revalidate` on every page was waking Neon on each bot/monitor hit.
 */
export function proxy(request: NextRequest) {
  if (shouldBypassForUptimeProbe(request)) {
    return healthProbeResponse(request.method);
  }

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
    if (!cookieVariant) {
      res.cookies.set('home-variant', variant, {
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
        sameSite: 'lax',
      });
    }
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
