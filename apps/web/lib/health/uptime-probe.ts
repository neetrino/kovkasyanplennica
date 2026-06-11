import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Paths for external monitors — never SSR or touch DB. */
export const HEALTH_PROBE_PATHS = new Set([
  '/health',
  '/healthz',
  '/ready',
  '/live',
  '/api/health',
]);

const UPTIME_MONITOR_UA_RE =
  /uptimerobot|pingdom|statuscake|site24x7|betteruptime|better[\s-]?stack|hetrix|freshping|datadog|updown\.io|nodeping|cronitor|kube-probe|elb-healthchecker|googlehc|amazon-route53-health-check|vercel-screenshot/i;

export function isHealthProbePath(pathname: string): boolean {
  return HEALTH_PROBE_PATHS.has(pathname);
}

export function isUptimeMonitorRequest(request: NextRequest): boolean {
  const ua = request.headers.get('user-agent') ?? '';
  if (UPTIME_MONITOR_UA_RE.test(ua)) {
    return true;
  }

  const probeSecret = process.env.HEALTH_PROBE_SECRET?.trim();
  if (probeSecret && request.headers.get('x-health-probe') === probeSecret) {
    return true;
  }

  return false;
}

export function healthProbeResponse(method: string): NextResponse {
  const headers = {
    'Cache-Control': 'no-store',
    'X-Health-Probe': '1',
  };

  if (method === 'HEAD') {
    return new NextResponse(null, { status: 200, headers });
  }

  return NextResponse.json(
    { status: 'ok', ts: new Date().toISOString() },
    { headers },
  );
}

export function shouldBypassForUptimeProbe(request: NextRequest): boolean {
  const method = request.method;
  if (method !== 'GET' && method !== 'HEAD') {
    return false;
  }

  const { pathname } = request.nextUrl;
  return isHealthProbePath(pathname) || isUptimeMonitorRequest(request);
}
