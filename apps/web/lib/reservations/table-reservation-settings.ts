import { db } from "@white-shop/db";
import { parseTimeToMinutes } from "@/lib/reservations/availability";
import { RESERVATION_TIME_SLOTS } from "@/lib/reservations/time-slots";

export const TABLE_RESERVATIONS_SETTINGS_KEY = "table-reservations" as const;

const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export type TableReservationSettingsResolved = {
  bookingFrom: string;
  bookingTo: string;
  blockDurationHours: number;
};

export const DEFAULT_TABLE_RESERVATION_SETTINGS: TableReservationSettingsResolved = {
  bookingFrom: "11:00",
  bookingTo: "22:00",
  blockDurationHours: 2,
};

export function filterTimeSlotsByBookingWindow(
  slots: readonly string[],
  bookingFrom: string,
  bookingTo: string,
): string[] {
  const fromM = parseTimeToMinutes(bookingFrom);
  const toM = parseTimeToMinutes(bookingTo);
  if (fromM == null || toM == null || fromM > toM) {
    return [...slots];
  }
  return slots.filter((slot) => {
    const m = parseTimeToMinutes(slot);
    return m != null && m >= fromM && m <= toM;
  });
}

export function resolveTableReservationSettingsFromJson(
  value: unknown,
): TableReservationSettingsResolved {
  const base = DEFAULT_TABLE_RESERVATION_SETTINGS;
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return { ...base };
  }
  const o = value as Record<string, unknown>;

  const bookingFrom =
    typeof o.bookingFrom === "string" && HH_MM.test(o.bookingFrom.trim())
      ? o.bookingFrom.trim()
      : base.bookingFrom;
  const bookingTo =
    typeof o.bookingTo === "string" && HH_MM.test(o.bookingTo.trim())
      ? o.bookingTo.trim()
      : base.bookingTo;

  let blockDurationHours = base.blockDurationHours;
  if (typeof o.blockDurationHours === "number" && Number.isFinite(o.blockDurationHours)) {
    blockDurationHours = Math.min(12, Math.max(1, Math.round(o.blockDurationHours)));
  } else if (typeof o.blockDurationHours === "string" && o.blockDurationHours.trim() !== "") {
    const p = parseInt(o.blockDurationHours, 10);
    if (Number.isFinite(p)) {
      blockDurationHours = Math.min(12, Math.max(1, p));
    }
  }

  const fromM = parseTimeToMinutes(bookingFrom);
  const toM = parseTimeToMinutes(bookingTo);
  if (fromM == null || toM == null || fromM > toM) {
    return { ...base };
  }

  return { bookingFrom, bookingTo, blockDurationHours };
}

export async function getTableReservationSettingsResolved(): Promise<
  TableReservationSettingsResolved & { timeSlots: string[] }
> {
  const row = await db.settings.findUnique({
    where: { key: TABLE_RESERVATIONS_SETTINGS_KEY },
  });
  const resolved = resolveTableReservationSettingsFromJson(row?.value);
  let timeSlots = filterTimeSlotsByBookingWindow(
    RESERVATION_TIME_SLOTS,
    resolved.bookingFrom,
    resolved.bookingTo,
  );
  if (timeSlots.length === 0) {
    timeSlots = filterTimeSlotsByBookingWindow(
      RESERVATION_TIME_SLOTS,
      DEFAULT_TABLE_RESERVATION_SETTINGS.bookingFrom,
      DEFAULT_TABLE_RESERVATION_SETTINGS.bookingTo,
    );
  }
  return { ...resolved, timeSlots };
}

export function isTimeInAllowedSlots(time: string, allowedSlots: readonly string[]): boolean {
  return allowedSlots.includes(time.trim());
}
