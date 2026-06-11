import { healthProbeResponse } from '@/lib/health/uptime-probe';

/**
 * Liveness probe — no database, Redis, or external services.
 * Point uptime monitors here (or `/health`) instead of `/` to avoid waking Neon compute.
 */
export async function GET() {
  return healthProbeResponse('GET');
}

export async function HEAD() {
  return healthProbeResponse('HEAD');
}
