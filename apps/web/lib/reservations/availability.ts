import { RESERVATION_TIME_SLOTS } from '@/lib/reservations/time-slots';

export type ReservationOccasion = 'birthday' | 'regular';

type ReservationForConflictCheck = {
  status: string;
  time: string;
  occasion: string | null;
};

const LOCK_HOURS_BY_OCCASION: Record<ReservationOccasion, number> = {
  birthday: 6,
  regular: 2,
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MINUTES_IN_HOUR = 60;
const ACTIVE_STATUS = 'cancelled';

export function normalizeReservationOccasion(value: unknown): ReservationOccasion | null {
  if (value !== 'birthday' && value !== 'regular') {
    return null;
  }
  return value;
}

export function getReservationWindowEndMinutes(
  startMinutes: number,
  occasion: ReservationOccasion,
): number {
  return startMinutes + LOCK_HOURS_BY_OCCASION[occasion] * MINUTES_IN_HOUR;
}

export function parseTimeToMinutes(value: string): number | null {
  const match = TIME_PATTERN.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * MINUTES_IN_HOUR + minutes;
}

export function normalizeStoredOccasion(occasion: string | null): ReservationOccasion {
  return occasion === 'birthday' ? 'birthday' : 'regular';
}

function isActiveReservation(status: string): boolean {
  return status !== ACTIVE_STATUS;
}

function overlaps(
  requestedStartMinutes: number,
  requestedEndMinutes: number,
  existingStartMinutes: number,
  existingEndMinutes: number,
): boolean {
  return requestedStartMinutes < existingEndMinutes && existingStartMinutes < requestedEndMinutes;
}

export function hasReservationConflict(
  requestedTime: string,
  requestedOccasion: ReservationOccasion,
  existingReservations: readonly ReservationForConflictCheck[],
): boolean {
  const requestedStartMinutes = parseTimeToMinutes(requestedTime);
  if (requestedStartMinutes == null) return true;
  const requestedEndMinutes = getReservationWindowEndMinutes(
    requestedStartMinutes,
    requestedOccasion,
  );

  return existingReservations.some((reservation) => {
    if (!isActiveReservation(reservation.status)) return false;
    const existingStartMinutes = parseTimeToMinutes(reservation.time);
    if (existingStartMinutes == null) return false;
    const existingOccasion = normalizeStoredOccasion(reservation.occasion);
    const existingEndMinutes = getReservationWindowEndMinutes(existingStartMinutes, existingOccasion);
    return overlaps(
      requestedStartMinutes,
      requestedEndMinutes,
      existingStartMinutes,
      existingEndMinutes,
    );
  });
}

export function getUnavailableTimeSlots(
  requestedOccasion: ReservationOccasion,
  existingReservations: readonly ReservationForConflictCheck[],
): string[] {
  return RESERVATION_TIME_SLOTS.filter((slot) =>
    hasReservationConflict(slot, requestedOccasion, existingReservations),
  );
}
