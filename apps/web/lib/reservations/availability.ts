export type ReservationOccasion = 'birthday' | 'regular';

export type ReservationBusyInterval = {
  time: string;
  timeEnd: string;
};

export type ReservationIntervalRow = {
  status: string;
  time: string;
  timeEnd: string | null;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MINUTES_IN_HOUR = 60;
const ACTIVE_STATUS = 'cancelled';

export function normalizeReservationOccasion(value: unknown): ReservationOccasion | null {
  if (value !== 'birthday' && value !== 'regular') {
    return null;
  }
  return value;
}

export function parseTimeToMinutes(value: string): number | null {
  const match = TIME_PATTERN.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * MINUTES_IN_HOUR + minutes;
}

export function reservationIntervalToMinutes(
  time: string,
  timeEnd: string,
): { startM: number; endM: number } | null {
  const startM = parseTimeToMinutes(time);
  const endM = parseTimeToMinutes(timeEnd);
  if (startM == null || endM == null || endM <= startM) return null;
  return { startM, endM };
}

/** Minutes from `allSlots[endIdx]` to the next grid label (or previous gap after last slot). */
function slotMinutesAfterEndLabel(allSlots: readonly string[], endIdx: number): number {
  if (endIdx >= 0 && endIdx < allSlots.length - 1) {
    const cur = parseTimeToMinutes(allSlots[endIdx]!);
    const next = parseTimeToMinutes(allSlots[endIdx + 1]!);
    if (cur != null && next != null) return next - cur;
  }
  if (allSlots.length >= 2 && endIdx === allSlots.length - 1) {
    const prev = parseTimeToMinutes(allSlots[endIdx - 1]!);
    const last = parseTimeToMinutes(allSlots[endIdx]!);
    if (prev != null && last != null) return last - prev;
  }
  return MINUTES_IN_HOUR / 2;
}

/**
 * Half-open occupancy [startM, exclusiveEndM) for overlap checks.
 * Single grid step (30 min): end label is exclusive (next party may start at `timeEnd`).
 * Longer stays: `timeEnd` blocks the slot that starts at `timeEnd` (e.g. 11:30–14:00 blocks 14:00).
 */
export function reservationTimeRangeToOccupancyHalfOpen(
  time: string,
  timeEnd: string,
  allSlots: readonly string[],
): { startM: number; exclusiveEndM: number } | null {
  const base = reservationIntervalToMinutes(time, timeEnd);
  if (base == null) return null;
  const { startM, endM } = base;
  const startIdx = allSlots.indexOf(time);
  const endIdx = allSlots.indexOf(timeEnd);
  if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) {
    return { startM, exclusiveEndM: endM };
  }
  const segmentCount = endIdx - startIdx;
  if (segmentCount <= 1) {
    return { startM, exclusiveEndM: endM };
  }
  return { startM, exclusiveEndM: endM + slotMinutesAfterEndLabel(allSlots, endIdx) };
}

function parseDateToLocalDate(value: string): Date | null {
  const match = DATE_PATTERN.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  return new Date(year, monthIndex, day);
}

export function isPastTimeSlotForDate(
  date: string,
  time: string,
  now: Date = new Date(),
): boolean {
  const targetDate = parseDateToLocalDate(date);
  const targetMinutes = parseTimeToMinutes(time);
  if (!targetDate || targetMinutes == null) return true;

  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (targetDate.getTime() < nowDate.getTime()) return true;
  if (targetDate.getTime() > nowDate.getTime()) return false;

  const nowMinutes = now.getHours() * MINUTES_IN_HOUR + now.getMinutes();
  return targetMinutes < nowMinutes;
}

function isActiveReservation(status: string): boolean {
  return status !== ACTIVE_STATUS;
}

function intervalOverlapsHalfOpen(
  aStart: number,
  aExclusiveEnd: number,
  bStart: number,
  bExclusiveEnd: number,
): boolean {
  return aStart < bExclusiveEnd && bStart < aExclusiveEnd;
}

export function hasReservationTimeRangeConflict(
  requestedTime: string,
  requestedTimeEnd: string,
  existingReservations: readonly ReservationIntervalRow[],
  allSlots: readonly string[],
): boolean {
  const requested = reservationTimeRangeToOccupancyHalfOpen(requestedTime, requestedTimeEnd, allSlots);
  if (requested == null) return true;

  return existingReservations.some((reservation) => {
    if (!isActiveReservation(reservation.status)) return false;
    if (reservation.timeEnd == null || reservation.timeEnd.trim() === '') return false;
    const existing = reservationTimeRangeToOccupancyHalfOpen(reservation.time, reservation.timeEnd, allSlots);
    if (existing == null) return false;
    return intervalOverlapsHalfOpen(
      requested.startM,
      requested.exclusiveEndM,
      existing.startM,
      existing.exclusiveEndM,
    );
  });
}

function busyIntervalsToIntervalRows(
  busyIntervals: readonly ReservationBusyInterval[],
): ReservationIntervalRow[] {
  return busyIntervals.map((b) => ({
    status: 'confirmed',
    time: b.time,
    timeEnd: b.timeEnd,
  }));
}

export function getValidEndTimeSlots(
  start: string,
  allSlots: readonly string[],
  busyIntervals: readonly ReservationBusyInterval[],
): string[] {
  const startIdx = allSlots.indexOf(start);
  if (startIdx < 0) return [];
  const busyRows = busyIntervalsToIntervalRows(busyIntervals);
  return allSlots.filter((endSlot, idx) => {
    if (idx <= startIdx) return false;
    return !hasReservationTimeRangeConflict(start, endSlot, busyRows, allSlots);
  });
}

export function isStartTimeSlotBookable(
  start: string,
  allSlots: readonly string[],
  busyIntervals: readonly ReservationBusyInterval[],
): boolean {
  return getValidEndTimeSlots(start, allSlots, busyIntervals).length > 0;
}
