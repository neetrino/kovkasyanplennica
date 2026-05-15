'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient } from '@/lib/api-client';
import { formatPriceInCurrency } from '@/lib/currency';
import { useTranslation } from '@/lib/i18n-client';
import { Card, Button } from '@shop/ui';
import { AdminPaginationControls } from '../components/AdminNumericPagination';
import {
  adminAlertErrorClass,
  adminBulkDangerButtonClass,
  adminFormControlClass,
  adminPaginationMetaClass,
  adminSolidButtonClass,
  adminTableBodyClass,
  adminTableHeadCellClass,
  adminTableHeadRowClass,
  adminTableRowHoverClass,
  adminTableWrapClass,
  dashboardCardPadding,
  dashboardEmptyText,
  dashboardMainClass,
  dashboardRowMeta,
  dashboardRowPrimaryMedium,
} from '../components/dashboardUi';
import {
  getValidEndTimeSlotsForMultipleTables,
  isPastTimeSlotForDate,
  isStartTimeSlotBookableForMultipleTables,
  type ReservationBusyInterval,
} from '@/lib/reservations/availability';
import { TABLES, type TableConfig } from '../../desktops/table-data';
import { RESERVATION_TIME_SLOTS } from '@/lib/reservations/time-slots';

interface Reservation {
  id: string;
  tableId: string;
  tableLabel: string;
  tableSeats: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  timeEnd: string;
  occasion: 'birthday' | 'regular';
  guestCount: number;
  note: string | null;
  status: string;
  profitCents: number | null;
  productTitle: string | null;
  productImageUrl: string | null;
  createdAt: string;
}

interface ReservationCreateForm {
  tableIds: string[];
  date: string;
  time: string;
  timeEnd: string;
  occasion: '' | 'birthday' | 'regular';
  guestCount: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  note: string;
}

interface ReservationsResponse {
  data: Reservation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const STATUS_SELECT_SKIN: Record<string, string> = {
  pending:
    'border-admin-brand-2/25 bg-admin-warm/55 text-admin-brand ring-1 ring-inset ring-admin-brand/12',
  confirmed:
    'border-admin-brand-2/20 bg-admin-surface text-admin-brand ring-1 ring-inset ring-admin-brand/12',
  cancelled:
    'border-red-200/90 bg-red-50/90 text-red-900 ring-1 ring-inset ring-red-200/70',
};

const DISPLAY_DATE_LOCALE = 'ru-RU';
const INITIAL_CREATE_FORM: ReservationCreateForm = {
  tableIds: [],
  date: '',
  time: '',
  timeEnd: '',
  occasion: '',
  guestCount: '1',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  note: '',
};

/** Stored reservation date is usually YYYY-MM-DD from <input type="date"> — show as DD.MM.YYYY */
function formatStoredReservationDate(dateStr: string): string {
  const trimmed = dateStr.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (iso) {
    return `${iso[3]}.${iso[2]}.${iso[1]}`;
  }
  return trimmed;
}

function formatCreatedAtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(DISPLAY_DATE_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function orderedTablesFromIds(tableIds: readonly string[]): TableConfig[] {
  return TABLES.filter((table) => tableIds.includes(table.id));
}

function statusSelectClass(status: string): string {
  return (
    STATUS_SELECT_SKIN[status] ??
    'border-admin-brand-2/20 bg-admin-surface text-admin-muted ring-1 ring-inset ring-admin-brand-2/14'
  );
}

function reservationDateTimeValue(date: string, time: string): number {
  const normalizedDate = date.trim();
  const normalizedTime = time.trim();
  const value = Date.parse(`${normalizedDate}T${normalizedTime}:00`);
  return Number.isNaN(value) ? 0 : value;
}

export default function AdminDesktopsPage() {
  const { t } = useTranslation();
  const { isLoggedIn, canAccessAdmin, isLoading } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<ReservationsResponse['meta'] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [dateTimeSort, setDateTimeSort] = useState<'' | 'desc' | 'asc'>('');
  const [dateTimeSortMenuOpen, setDateTimeSortMenuOpen] = useState(false);
  const [createForm, setCreateForm] = useState<ReservationCreateForm>(INITIAL_CREATE_FORM);
  const [createBusyByTableId, setCreateBusyByTableId] = useState<Record<string, ReservationBusyInterval[]>>(
    {},
  );
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [manualBookingOpen, setManualBookingOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== '#admin-desktops-manual-booking') return;
    setManualBookingOpen(true);
    window.requestAnimationFrame(() => {
      document.getElementById('admin-desktops-manual-booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: page.toString(),
        limit: '20',
      };
      if (filterStatus) params.status = filterStatus;

      const response = await apiClient.get<ReservationsResponse>('/api/v1/admin/reservations', { params });
      setReservations(response.data || []);
      setMeta(response.meta || null);
    } catch {
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => {
    if (isLoggedIn && canAccessAdmin) {
      fetchReservations();
    }
  }, [isLoggedIn, canAccessAdmin, fetchReservations]);

  const dateTimeSortMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!dateTimeSortMenuOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (!dateTimeSortMenuRef.current?.contains(event.target as Node)) {
        setDateTimeSortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [dateTimeSortMenuOpen]);

  const selectedTables = orderedTablesFromIds(createForm.tableIds);
  const createBusyPerTable = useMemo(
    () => createForm.tableIds.map((id) => createBusyByTableId[id] ?? []),
    [createForm.tableIds, createBusyByTableId],
  );

  const tableIdsKey = createForm.tableIds.join(',');

  useEffect(() => {
    if (!createForm.date || createForm.tableIds.length === 0) {
      setCreateBusyByTableId({});
      return;
    }

    let cancelled = false;
    const ids = [...createForm.tableIds];

    async function loadCreateBusyAll() {
      const results = await Promise.all(
        ids.map(async (tableId) => {
          const search = new URLSearchParams({ tableId, date: createForm.date });
          try {
            const response = await apiClient.get<{ data?: { busyIntervals?: unknown } }>(
              `/api/v1/reservations?${search.toString()}`,
            );
            const raw = response.data?.busyIntervals;
            const intervals: ReservationBusyInterval[] = [];
            if (Array.isArray(raw)) {
              for (const item of raw) {
                if (typeof item !== 'object' || item === null) continue;
                const o = item as { time?: unknown; timeEnd?: unknown };
                if (typeof o.time === 'string' && typeof o.timeEnd === 'string') {
                  intervals.push({ time: o.time, timeEnd: o.timeEnd });
                }
              }
            }
            return { tableId, intervals };
          } catch {
            return { tableId, intervals: [] as ReservationBusyInterval[] };
          }
        }),
      );

      if (!cancelled) {
        const next: Record<string, ReservationBusyInterval[]> = {};
        for (const { tableId, intervals } of results) {
          next[tableId] = intervals;
        }
        setCreateBusyByTableId(next);
      }
    }

    void loadCreateBusyAll();
    return () => {
      cancelled = true;
    };
  }, [createForm.date, tableIdsKey]);

  useEffect(() => {
    if (!createForm.time || createForm.tableIds.length === 0) return;
    setCreateForm((prev) => {
      if (!prev.timeEnd) return prev;
      const perTable = prev.tableIds.map((id) => createBusyByTableId[id] ?? []);
      const ends = getValidEndTimeSlotsForMultipleTables(prev.time, RESERVATION_TIME_SLOTS, perTable);
      if (ends.includes(prev.timeEnd)) return prev;
      return { ...prev, timeEnd: '' };
    });
  }, [createForm.time, createForm.tableIds.length, createBusyByTableId, tableIdsKey]);

  const setCreateField = (field: keyof ReservationCreateForm, value: string) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
    setCreateError(null);
  };

  const toggleCreateTable = (tableId: string) => {
    setCreateForm((prev) => {
      const set = new Set(prev.tableIds);
      if (set.has(tableId)) {
        set.delete(tableId);
      } else {
        set.add(tableId);
      }
      const nextIds = TABLES.filter((table) => set.has(table.id)).map((table) => table.id);
      return { ...prev, tableIds: nextIds };
    });
    setCreateError(null);
  };

  const maxCreateGuests = selectedTables.reduce((sum, table) => sum + table.seats, 0) || 8;

  useEffect(() => {
    const n = parseInt(createForm.guestCount, 10) || 1;
    if (n <= maxCreateGuests) return;
    setCreateForm((prev) => ({ ...prev, guestCount: String(maxCreateGuests) }));
  }, [maxCreateGuests, createForm.guestCount]);

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTables.length === 0) {
      setCreateError(t('admin.desktopsReservations.create.validationTable'));
      return;
    }
    if (!createForm.firstName.trim() || !createForm.lastName.trim()) {
      setCreateError(t('admin.desktopsReservations.create.validationName'));
      return;
    }
    if (!createForm.email.trim()) {
      setCreateError(t('admin.desktopsReservations.create.validationEmail'));
      return;
    }
    if (!createForm.phone.trim()) {
      setCreateError(t('admin.desktopsReservations.create.validationPhone'));
      return;
    }
    if (!createForm.date || !createForm.time) {
      setCreateError(t('admin.desktopsReservations.create.validationDateTime'));
      return;
    }
    if (!createForm.timeEnd) {
      setCreateError(t('admin.desktopsReservations.create.validationTimeEnd'));
      return;
    }
    if (isPastTimeSlotForDate(createForm.date, createForm.time)) {
      setCreateError(t('admin.desktopsReservations.create.validationTimePast'));
      return;
    }

    setCreating(true);
    setCreateError(null);
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const guestCount = parseInt(createForm.guestCount, 10) || 1;
    let created = 0;

    try {
      for (const table of selectedTables) {
        const response = await fetch('/api/v1/admin/reservations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            tableId: table.id,
            tableLabel: t(`desktops.tables.${table.labelKey}`),
            tableSeats: table.seats,
            firstName: createForm.firstName.trim(),
            lastName: createForm.lastName.trim(),
            email: createForm.email.trim(),
            phone: createForm.phone.trim(),
            date: createForm.date,
            time: createForm.time,
            timeEnd: createForm.timeEnd,
            occasion: createForm.occasion || 'regular',
            guestCount,
            note: createForm.note.trim() || null,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const detail =
            typeof data.detail === 'string' ? data.detail : t('admin.desktopsReservations.create.failed');
          const tableLabel = t(`desktops.tables.${table.labelKey}`);
          const atTableMsg = t('admin.desktopsReservations.create.failedAtTable')
            .replace('{table}', tableLabel)
            .replace('{detail}', detail);
          const partial =
            created > 0
              ? `${t('admin.desktopsReservations.create.partialCreated')
                  .replace('{created}', String(created))
                  .replace('{total}', String(selectedTables.length))} `
              : '';
          throw new Error(`${partial}${atTableMsg}`);
        }
        created += 1;
      }

      setCreateForm(INITIAL_CREATE_FORM);
      setCreateBusyByTableId({});
      await fetchReservations();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : t('admin.desktopsReservations.create.failed');
      setCreateError(message);
      await fetchReservations();
    } finally {
      setCreating(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (visibleReservations.length === 0) return;
    setSelectedIds((prev) => {
      const allIds = visibleReservations.map((r) => r.id);
      const hasAll = allIds.every((id) => prev.has(id));
      return hasAll ? new Set() : new Set(allIds);
    });
  };

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch('/api/v1/admin/reservations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      await fetchReservations();
    } catch {
      alert(t('admin.desktopsReservations.alertUpdateFailed'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const confirmMsg = t('admin.desktopsReservations.bulkDeleteConfirm').replace(
      '{count}',
      String(selectedIds.size),
    );
    if (!confirm(confirmMsg)) return;
    setBulkDeleting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch('/api/v1/admin/reservations', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      setSelectedIds(new Set());
      await fetchReservations();
    } catch {
      alert(t('admin.desktopsReservations.alertDeleteFailed'));
    } finally {
      setBulkDeleting(false);
    }
  };

  const visibleReservations = useMemo(() => {
    if (!dateTimeSort) return reservations;
    return [...reservations].sort((a, b) => {
      const aValue = reservationDateTimeValue(a.date, a.time);
      const bValue = reservationDateTimeValue(b.date, b.time);
      return dateTimeSort === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [dateTimeSort, reservations]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
          <p className="text-sm text-admin-brand/55">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !canAccessAdmin) return null;

  const controlGridClass = `${adminFormControlClass} min-w-0`;

  return (
    <div className={dashboardMainClass}>
      <Card variant="admin" className="overflow-hidden p-0">
        <div className={`${dashboardCardPadding} space-y-5`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <header className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold tracking-tight text-admin-brand">{t('admin.desktopsReservations.title')}</h1>
              {meta ? (
                <p className="mt-1 text-base text-admin-brand/90">
                  {t('admin.desktopsReservations.totalSubtitle').replace('{count}', String(meta.total))}
                </p>
              ) : null}
            </header>
            <div className="flex flex-wrap items-center justify-start gap-3 sm:justify-end lg:flex-nowrap">
            <div className="flex min-w-0 max-w-full items-center gap-2 sm:min-w-[12rem]">
              <label
                htmlFor="desktop-reservation-status"
                className="shrink-0 whitespace-nowrap text-sm font-medium text-admin-brand/65"
              >
                {t('admin.desktopsReservations.statusFilter')}
              </label>
              <select
                id="desktop-reservation-status"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
                className={`${adminFormControlClass} min-w-0 flex-1 sm:w-auto sm:min-w-[12rem] sm:flex-none`}
              >
                <option value="">{t('admin.desktopsReservations.filterAll')}</option>
                <option value="pending">{t('admin.desktopsReservations.statusPending')}</option>
                <option value="confirmed">{t('admin.desktopsReservations.statusConfirmed')}</option>
                <option value="cancelled">{t('admin.desktopsReservations.statusCancelled')}</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                setManualBookingOpen(true);
                window.requestAnimationFrame(() => {
                  document.getElementById('admin-desktops-manual-booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-admin-brand-2/25 bg-white px-3 py-2 text-sm font-medium text-admin-brand shadow-sm transition-colors hover:bg-admin-surface/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand/25"
              aria-controls="admin-desktops-manual-booking-panel"
              aria-expanded={manualBookingOpen}
            >
              {t('admin.desktopsReservations.create.title')}
              <svg className="h-4 w-4 shrink-0 text-admin-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            </div>
          </div>
        </div>

        <div id="admin-desktops-manual-booking" className="scroll-mt-6 border-t border-admin-brand-2/12">
          <button
            type="button"
            onClick={() => setManualBookingOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-4 border-b border-admin-brand-2/12 px-5 py-5 text-left transition-colors hover:bg-admin-surface/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-admin-brand/20 sm:px-6"
            aria-expanded={manualBookingOpen}
            aria-controls="admin-desktops-manual-booking-panel"
            id="admin-desktops-manual-booking-heading"
          >
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-admin-brand">{t('admin.desktopsReservations.create.title')}</h2>
              <p className="mt-1 text-sm text-admin-brand/60">{t('admin.desktopsReservations.create.subtitle')}</p>
            </div>
            <svg
              className={`h-5 w-5 shrink-0 text-admin-muted transition-transform duration-200 ${manualBookingOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            id="admin-desktops-manual-booking-panel"
            hidden={!manualBookingOpen}
            className="border-t border-admin-brand-2/10 px-5 pb-5 pt-4 sm:px-6"
          >
          <form onSubmit={handleCreateReservation} aria-labelledby="admin-desktops-manual-booking-heading">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
              <fieldset className="min-w-0 rounded-lg border border-admin-brand-2/20 bg-admin-surface/30 p-3 lg:col-span-5">
                <legend className="px-1 text-sm font-medium text-admin-brand/80">
                  {t('admin.desktopsReservations.create.table')}
                </legend>
                <p className="mb-2 text-xs text-admin-brand/55">{t('admin.desktopsReservations.create.tablesHint')}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {TABLES.map((table) => {
                    const checked = createForm.tableIds.includes(table.id);
                    return (
                      <label
                        key={table.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-sm transition-colors ${
                          checked
                            ? 'border-admin-brand/35 bg-white text-admin-brand'
                            : 'border-admin-brand-2/15 bg-white/60 text-admin-brand/80 hover:border-admin-brand/25'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCreateTable(table.id)}
                          className="rounded border-admin-brand-2/35 text-admin-brand focus:ring-admin-brand/30"
                        />
                        <span className="min-w-0 truncate">{t(`desktops.tables.${table.labelKey}`)}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <input
                type="date"
                value={createForm.date}
                onChange={(e) => setCreateField('date', e.target.value)}
                className={controlGridClass}
              />

              <select
                value={createForm.time}
                onChange={(e) => {
                  setCreateForm((prev) => ({ ...prev, time: e.target.value, timeEnd: '' }));
                  setCreateError(null);
                }}
                className={controlGridClass}
              >
                <option value="">{t('admin.desktopsReservations.create.time')}</option>
                {RESERVATION_TIME_SLOTS.map((slot) => (
                  <option
                    key={slot}
                    value={slot}
                    disabled={
                      !isStartTimeSlotBookableForMultipleTables(
                        slot,
                        RESERVATION_TIME_SLOTS,
                        createBusyPerTable,
                      ) || isPastTimeSlotForDate(createForm.date, slot)
                    }
                  >
                    {slot}
                  </option>
                ))}
              </select>

              <select
                value={createForm.timeEnd}
                onChange={(e) => setCreateField('timeEnd', e.target.value)}
                disabled={!createForm.time}
                className={controlGridClass}
              >
                <option value="">{t('admin.desktopsReservations.create.timeEnd')}</option>
                {getValidEndTimeSlotsForMultipleTables(
                  createForm.time,
                  RESERVATION_TIME_SLOTS,
                  createBusyPerTable,
                ).map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>

              <select
                value={createForm.occasion}
                onChange={(e) => setCreateField('occasion', e.target.value)}
                className={controlGridClass}
              >
                <option value="">{t('admin.desktopsReservations.create.occasion')}</option>
                <option value="birthday">{t('admin.desktopsReservations.create.occasionBirthday')}</option>
                <option value="regular">{t('admin.desktopsReservations.create.occasionRegular')}</option>
              </select>

              <input
                type="text"
                value={createForm.firstName}
                onChange={(e) => setCreateField('firstName', e.target.value)}
                placeholder={t('admin.desktopsReservations.create.firstName')}
                className={controlGridClass}
              />
              <input
                type="text"
                value={createForm.lastName}
                onChange={(e) => setCreateField('lastName', e.target.value)}
                placeholder={t('admin.desktopsReservations.create.lastName')}
                className={controlGridClass}
              />
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateField('email', e.target.value)}
                placeholder={t('admin.desktopsReservations.create.email')}
                className={controlGridClass}
              />
              <input
                type="tel"
                value={createForm.phone}
                onChange={(e) => setCreateField('phone', e.target.value)}
                placeholder={t('admin.desktopsReservations.create.phone')}
                className={controlGridClass}
              />
              <select
                value={createForm.guestCount}
                onChange={(e) => setCreateField('guestCount', e.target.value)}
                className={controlGridClass}
              >
                {Array.from({ length: maxCreateGuests }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {t('admin.desktopsReservations.create.guests').replace('{n}', String(n))}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={createForm.note}
                onChange={(e) => setCreateField('note', e.target.value)}
                placeholder={t('admin.desktopsReservations.create.note')}
                className={`${controlGridClass} md:col-span-2 lg:col-span-3`}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              {createError ? (
                <p className={adminAlertErrorClass}>{createError}</p>
              ) : (
                <span className={dashboardEmptyText}>{t('admin.desktopsReservations.create.hint')}</span>
              )}
              <button
                type="submit"
                disabled={creating}
                className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60 ${adminSolidButtonClass}`}
              >
                {creating
                  ? t('admin.desktopsReservations.create.creating')
                  : t('admin.desktopsReservations.create.submit')}
              </button>
            </div>
          </form>
          </div>
        </div>
      </Card>

      <Card variant="admin" className={dashboardCardPadding}>
        {loading ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
            <p className={dashboardEmptyText}>{t('admin.desktopsReservations.loading')}</p>
          </div>
        ) : visibleReservations.length === 0 ? (
          <div className="py-16 text-center">
            <svg
              className="mx-auto mb-4 h-12 w-12 text-admin-brand/25"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className={dashboardEmptyText}>{t('admin.desktopsReservations.empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-admin-brand-2/15">
            <table className={adminTableWrapClass}>
              <thead className={adminTableHeadRowClass}>
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      aria-label={t('admin.desktopsReservations.selectAllAria')}
                      checked={
                        visibleReservations.length > 0 &&
                        visibleReservations.every((reservation) => selectedIds.has(reservation.id))
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-admin-brand-2/35 text-admin-brand focus:ring-admin-brand/30"
                    />
                  </th>
                  <th className={`${adminTableHeadCellClass} !px-4`}>{t('admin.desktopsReservations.colTable')}</th>
                  <th className={`${adminTableHeadCellClass} !px-4`}>{t('admin.desktopsReservations.colName')}</th>
                  <th className={`${adminTableHeadCellClass} !px-4`}>{t('admin.desktopsReservations.colContact')}</th>
                  <th className={`${adminTableHeadCellClass} !px-4`}>
                    <div ref={dateTimeSortMenuRef} className="relative inline-flex items-center gap-1.5">
                      <span>{t('admin.desktopsReservations.colDateTime')}</span>
                      <button
                        type="button"
                        onClick={() => setDateTimeSortMenuOpen((prev) => !prev)}
                        aria-label={t('admin.desktopsReservations.colDateTime')}
                        className="inline-flex h-5 w-5 items-center justify-center rounded text-admin-brand/75 transition-colors hover:bg-admin-surface hover:text-admin-brand focus:outline-none focus:ring-2 focus:ring-admin-brand/20"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {dateTimeSortMenuOpen ? (
                        <div className="absolute right-0 top-full z-20 mt-1 min-w-[6.75rem] rounded-md border border-admin-brand-2/20 bg-white py-1 shadow-md normal-case">
                          <button
                            type="button"
                            onClick={() => {
                              setDateTimeSort('desc');
                              setDateTimeSortMenuOpen(false);
                            }}
                            className="block w-full px-2 py-1 text-left text-xs font-medium text-admin-brand transition-colors hover:bg-admin-surface"
                          >
                            Новые
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDateTimeSort('asc');
                              setDateTimeSortMenuOpen(false);
                            }}
                            className="block w-full px-2 py-1 text-left text-xs font-medium text-admin-brand transition-colors hover:bg-admin-surface"
                          >
                            Старые
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </th>
                  <th className={`${adminTableHeadCellClass} !px-4`}>{t('admin.desktopsReservations.colOccasion')}</th>
                  <th className={`${adminTableHeadCellClass} !px-4`}>{t('admin.desktopsReservations.colGuests')}</th>
                  <th className={`${adminTableHeadCellClass} !px-4`}>{t('admin.desktopsReservations.colStatusShort')}</th>
                  <th
                    className={`${adminTableHeadCellClass} !px-4`}
                    title={t('admin.desktopsReservations.colProfitTitle')}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <svg
                        className="h-4 w-4 shrink-0 text-admin-muted"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {t('admin.desktopsReservations.colProfit')}
                    </span>
                  </th>
                  <th className={`${adminTableHeadCellClass} !px-4`}>{t('admin.desktopsReservations.colCreated')}</th>
                </tr>
              </thead>
              <tbody className={adminTableBodyClass}>
                {visibleReservations.map((r) => (
                  <tr key={r.id} className={adminTableRowHoverClass}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        aria-label={t('admin.desktopsReservations.selectRowAria').replace(
                          '{name}',
                          `${r.firstName} ${r.lastName}`,
                        )}
                        checked={selectedIds.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        className="rounded border-admin-brand-2/35 text-admin-brand focus:ring-admin-brand/30"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className={dashboardRowPrimaryMedium}>{r.tableLabel}</div>
                      <div className={dashboardRowMeta}>
                        {t('admin.desktopsReservations.seatsShort').replace('{n}', String(r.tableSeats))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={dashboardRowPrimaryMedium}>
                        {r.firstName} {r.lastName}
                      </div>
                      {r.note ? (
                        <div className="max-w-[180px] truncate text-xs text-admin-muted" title={r.note}>
                          {r.note}
                        </div>
                      ) : null}
                    </td>
                    <td className="max-w-[220px] px-4 py-4 text-sm text-admin-brand/85">
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="break-all">{r.email}</span>
                        <span className="text-admin-brand/65">{r.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={dashboardRowPrimaryMedium}>{formatStoredReservationDate(r.date)}</div>
                      <div className={dashboardRowMeta}>
                        {r.time}–{r.timeEnd}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-admin-brand/80">
                      {r.occasion === 'birthday'
                        ? t('admin.desktopsReservations.occasionBirthday')
                        : t('admin.desktopsReservations.occasionRegular')}
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-admin-brand/80">{r.guestCount}</td>
                    <td className="px-4 py-4">
                      <select
                        value={r.status}
                        disabled={updatingId === r.id}
                        onChange={(e) => void handleStatusChange(r.id, e.target.value)}
                        className={`max-w-[10.5rem] cursor-pointer rounded-md border px-2 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-admin-brand/25 disabled:opacity-50 ${statusSelectClass(r.status)}`}
                      >
                        <option value="pending">{t('admin.desktopsReservations.statusPending')}</option>
                        <option value="confirmed">{t('admin.desktopsReservations.statusConfirmed')}</option>
                        <option value="cancelled">{t('admin.desktopsReservations.statusCancelled')}</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex min-w-0 max-w-[220px] items-center gap-3">
                        {r.productImageUrl ? (
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-admin-brand-2/15 bg-admin-surface">
                            <img src={r.productImageUrl} alt="" className="h-full w-full object-cover" />
                          </div>
                        ) : null}
                        <div className="min-w-0 flex-1">
                          {r.productTitle ? (
                            <p className={`${dashboardRowPrimaryMedium} truncate`} title={r.productTitle}>
                              {r.productTitle}
                            </p>
                          ) : null}
                          <p className="text-sm text-admin-brand/70">
                            {r.profitCents != null ? formatPriceInCurrency(r.profitCents, 'AMD') : '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-4 text-xs ${dashboardRowMeta}`}>
                      {formatCreatedAtDate(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && reservations.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-admin-brand-2/12 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className={adminPaginationMetaClass}>
                {t('admin.desktopsReservations.selectedCount').replace('{count}', String(selectedIds.size))}
              </span>
              {selectedIds.size > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleBulkDelete()}
                  disabled={bulkDeleting}
                  className={adminBulkDangerButtonClass}
                >
                  {bulkDeleting
                    ? t('admin.desktopsReservations.bulkDeleting')
                    : t('admin.desktopsReservations.bulkDelete')}
                </Button>
              ) : null}
            </div>

            {meta && meta.totalPages > 1 ? (
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className={adminPaginationMetaClass}>
                  {meta.page} / {meta.totalPages}
                </span>
                <AdminPaginationControls
                  page={page}
                  totalPages={meta.totalPages}
                  onPageChange={(n) => setPage(n)}
                  previousLabel={t('admin.orders.previous')}
                  nextLabel={t('admin.orders.next')}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
