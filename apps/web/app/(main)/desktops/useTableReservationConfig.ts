'use client';

import { useEffect, useState } from 'react';
import { RESERVATION_TIME_SLOTS } from './reservationTimeSlots';

export type TableReservationClientConfig = {
  bookingFrom: string;
  bookingTo: string;
  blockDurationHours: number;
  timeSlots: readonly string[];
};

const DEFAULT: TableReservationClientConfig = {
  bookingFrom: '11:00',
  bookingTo: '22:00',
  blockDurationHours: 2,
  timeSlots: RESERVATION_TIME_SLOTS,
};

export function useTableReservationConfig(): {
  config: TableReservationClientConfig;
  loading: boolean;
} {
  const [config, setConfig] = useState<TableReservationClientConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/v1/reservations/config');
        if (!res.ok) throw new Error('config fetch failed');
        const json: unknown = await res.json();
        const raw =
          typeof json === 'object' && json !== null && 'data' in json ? (json as { data: unknown }).data : null;
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
          throw new Error('bad payload');
        }
        const d = raw as {
          bookingFrom?: unknown;
          bookingTo?: unknown;
          blockDurationHours?: unknown;
          timeSlots?: unknown;
        };
        const slots = Array.isArray(d.timeSlots)
          ? d.timeSlots.filter((x): x is string => typeof x === 'string')
          : [];
        if (slots.length === 0) throw new Error('empty slots');

        const bookingFrom = typeof d.bookingFrom === 'string' ? d.bookingFrom : DEFAULT.bookingFrom;
        const bookingTo = typeof d.bookingTo === 'string' ? d.bookingTo : DEFAULT.bookingTo;
        const blockDurationHours =
          typeof d.blockDurationHours === 'number' && Number.isFinite(d.blockDurationHours)
            ? d.blockDurationHours
            : DEFAULT.blockDurationHours;

        if (!cancelled) {
          setConfig({ bookingFrom, bookingTo, blockDurationHours, timeSlots: slots });
        }
      } catch {
        if (!cancelled) {
          setConfig(DEFAULT);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { config, loading };
}
