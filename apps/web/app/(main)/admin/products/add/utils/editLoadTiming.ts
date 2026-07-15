const isDev = process.env.NODE_ENV === 'development';

let pageLoadStart: number | null = null;

export function markEditPageLoadStart(): void {
  if (!isDev || typeof performance === 'undefined') {
    return;
  }
  pageLoadStart = performance.now();
}

export function markEditTiming(label: string, extra?: Record<string, unknown>): void {
  if (!isDev || typeof performance === 'undefined') {
    return;
  }
  const elapsedMs =
    pageLoadStart != null ? Math.round(performance.now() - pageLoadStart) : null;
}

export function measureEditAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (!isDev || typeof performance === 'undefined') {
    return fn();
  }
  const start = performance.now();
  markEditTiming(`${label} start`);
  return fn().finally(() => {
    markEditTiming(`${label} end`, { durationMs: Math.round(performance.now() - start) });
  });
}
