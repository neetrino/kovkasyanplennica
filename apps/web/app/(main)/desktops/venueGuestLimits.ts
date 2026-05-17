import { TABLES } from './table-data';

/** Largest table capacity — used for quick booking before a table is chosen. */
export const VENUE_MAX_GUESTS = Math.max(1, ...TABLES.map((table) => table.seats));

export function isVenueGuestCount(value: string): boolean {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 1 && n <= VENUE_MAX_GUESTS;
}

export function venueGuestCounts(): number[] {
  return Array.from({ length: VENUE_MAX_GUESTS }, (_, index) => index + 1);
}
