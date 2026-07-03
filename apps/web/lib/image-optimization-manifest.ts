import manifestData from './image-optimization-manifest.json';

/** Optimized object keys known to exist (generated manifest + R2 upload). */
const OPTIMIZED_KEYS = new Set<string>();

/** Maps optimized output key → original source path or URL. */
const OUTPUT_TO_SOURCE = new Map<string, string>();

for (const entry of manifestData.entries) {
  for (const output of entry.outputs) {
    OPTIMIZED_KEYS.add(output.key);
    OUTPUT_TO_SOURCE.set(output.key, entry.source);
  }
}

export function isOptimizedKeyAvailable(key: string): boolean {
  return OPTIMIZED_KEYS.has(key);
}

export function getSourceForOptimizedKey(key: string): string | undefined {
  return OUTPUT_TO_SOURCE.get(key);
}

export function getOptimizedKeyCount(): number {
  return OPTIMIZED_KEYS.size;
}
