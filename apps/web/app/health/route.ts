import { healthProbeResponse } from '@/lib/health/uptime-probe';

/**
 * Liveness probe at `/health` (common default for hosting monitors).
 * No database, Redis, or external services.
 */
export async function GET() {
  return healthProbeResponse('GET');
}

export async function HEAD() {
  return healthProbeResponse('HEAD');
}
