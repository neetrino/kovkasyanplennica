export type SeatLabelSuffixKey = 'one' | 'few' | 'many';

/**
 * Վերին շարքի tile-ում սեղանը ~վերևի 61%-ում է (chairs ներքևում)։
 * `TableSeatLabel` layout `topRow` → Tailwind `top-[30%]` (պահել սինխրոն այս արժեքի հետ)։
 */
export const TOP_ROW_SEAT_LABEL_TOP_PERCENT = 30;

/**
 * Առաջին տող՝ մինչև 3 — թվեր, 4 նստատեղ — «3-4», 8+ — «7-8» (Figma)։
 */
export function formatSeatCountPrimary(seats: number): string {
  if (!Number.isFinite(seats) || seats < 1) {
    return '0';
  }
  const s = Math.floor(seats);
  if (s <= 3) {
    return String(s);
  }
  if (s === 4) {
    return '3-4';
  }
  if (s >= 8) {
    return '7-8';
  }
  return String(s);
}

/**
 * Երկրորդ տողի թարգմանության բանալի (ռուս. 1 персона / 2–4 персоны / 5+ персон)։
 */
export function getSeatLabelSuffixKey(seats: number): SeatLabelSuffixKey {
  if (!Number.isFinite(seats) || seats < 1) {
    return 'many';
  }
  const s = Math.floor(seats);
  if (s === 1) {
    return 'one';
  }
  if (s <= 4) {
    return 'few';
  }
  return 'many';
}
