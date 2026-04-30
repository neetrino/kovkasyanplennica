'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n-client';
import { getAppScrollRegion } from '@/lib/appScrollRegion';
import { formatLocalISODate } from '@/lib/formatLocalISODate';
import {
  getValidEndTimeSlots,
  isPastTimeSlotForDate,
  isStartTimeSlotBookable,
  type ReservationBusyInterval,
} from '@/lib/reservations/availability';
import type { TableConfig } from './table-data';
import { RESERVATION_TIME_SLOTS } from './reservationTimeSlots';

interface ReservationForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  timeEnd: string;
  occasion: string;
  guestCount: string;
  note: string;
}

const INITIAL_FORM: ReservationForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  date: '',
  time: '',
  timeEnd: '',
  occasion: '',
  guestCount: '1',
  note: '',
};

/** Max height of the card; inner scroll keeps the shell centered in the viewport. */
const MODAL_PANEL_MAX_HEIGHT_CLASS = 'max-h-[min(85dvh,52rem)]';

interface ReservationModalProps {
  table: TableConfig;
  onClose: () => void;
  /** Spin wheel query params */
  productTitle?: string | null;
  productImageUrl?: string | null;
  profitCents?: number | null;
  /** Վերևի quick-bar-ից ամսաթիվ / ժամ / հյուրեր */
  quickBarPrefill?: { date: string; time: string; timeEnd?: string; guestCount: string } | null;
}

export function ReservationModal({
  table,
  onClose,
  productTitle,
  productImageUrl,
  profitCents,
  quickBarPrefill,
}: ReservationModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState<ReservationForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<ReservationForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [busyIntervals, setBusyIntervals] = useState<ReservationBusyInterval[]>([]);
  const didPrefillFromUser = useRef(false);

  /** Lock app scroll root so `fixed` centering is stable while the dialog is open. */
  useEffect(() => {
    const root = getAppScrollRegion();
    if (!root) return;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = prev;
    };
  }, []);

  // Prefill from logged-in user once when modal opens
  useEffect(() => {
    if (user && !didPrefillFromUser.current) {
      didPrefillFromUser.current = true;
      setForm((prev) => ({
        ...prev,
        firstName: user.firstName?.trim() ?? prev.firstName,
        lastName: user.lastName?.trim() ?? prev.lastName,
        email: user.email?.trim() ?? prev.email,
        phone: user.phone?.trim() ?? prev.phone,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!quickBarPrefill) return;
    const raw = parseInt(quickBarPrefill.guestCount, 10);
    const guests = Math.min(
      table.seats,
      Math.max(1, Number.isFinite(raw) ? raw : 1),
    );
    setForm((prev) => ({
      ...prev,
      date: quickBarPrefill.date || prev.date,
      time: quickBarPrefill.time || prev.time,
      timeEnd: quickBarPrefill.timeEnd ?? prev.timeEnd,
      guestCount: String(guests),
    }));
  }, [
    table.id,
    table.seats,
    quickBarPrefill?.date,
    quickBarPrefill?.time,
    quickBarPrefill?.timeEnd,
    quickBarPrefill?.guestCount,
  ]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const today = formatLocalISODate(new Date());

  const tableTitle = t(`desktops.tables.${table.labelKey}`);

  const validate = useCallback((): boolean => {
    const next: Partial<ReservationForm> = {};
    const v = 'desktops.modal.validation';
    if (!form.firstName.trim()) next.firstName = t(`${v}.firstNameRequired`);
    if (!form.lastName.trim()) next.lastName = t(`${v}.lastNameRequired`);
    if (!form.email.trim()) {
      next.email = t(`${v}.emailRequired`);
    } else if (
      form.email.indexOf('@') < 1 ||
      !form.email.slice(form.email.indexOf('@') + 1).includes('.')
    ) {
      next.email = t(`${v}.emailInvalid`);
    }
    if (!form.phone.trim()) next.phone = t(`${v}.phoneRequired`);
    if (!form.date) next.date = t(`${v}.dateRequired`);
    if (!form.time) next.time = t(`${v}.timeRequired`);
    if (!form.timeEnd) next.timeEnd = t(`${v}.timeEndRequired`);
    if (form.date && form.time && isPastTimeSlotForDate(form.date, form.time)) {
      next.time = t(`${v}.timePast`);
    }
    if (form.time && form.timeEnd && form.timeEnd <= form.time) {
      next.timeEnd = t(`${v}.timeRangeInvalid`);
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form, t]);

  useEffect(() => {
    if (!form.date) {
      setBusyIntervals([]);
      return;
    }

    let cancelled = false;
    const search = new URLSearchParams({
      tableId: table.id,
      date: form.date,
    });

    async function loadBusy() {
      try {
        const res = await fetch(`/api/v1/reservations?${search.toString()}`);
        if (!res.ok) throw new Error('Failed to load reservation availability');
        const data: unknown = await res.json();
        const payload =
          typeof data === 'object' && data !== null && 'data' in data
            ? (data.data as { busyIntervals?: unknown })
            : null;
        const raw = Array.isArray(payload?.busyIntervals) ? payload.busyIntervals : [];
        const intervals: ReservationBusyInterval[] = [];
        for (const item of raw) {
          if (typeof item !== 'object' || item === null) continue;
          const o = item as { time?: unknown; timeEnd?: unknown };
          if (typeof o.time === 'string' && typeof o.timeEnd === 'string') {
            intervals.push({ time: o.time, timeEnd: o.timeEnd });
          }
        }

        if (!cancelled) {
          setBusyIntervals(intervals);
        }
      } catch {
        if (!cancelled) {
          setBusyIntervals([]);
        }
      }
    }

    void loadBusy();

    return () => {
      cancelled = true;
    };
  }, [form.date, table.id]);

  useEffect(() => {
    if (!form.time) return;
    setForm((prev) => {
      if (!prev.timeEnd) return prev;
      const ends = getValidEndTimeSlots(prev.time, RESERVATION_TIME_SLOTS, busyIntervals);
      if (ends.includes(prev.timeEnd)) return prev;
      return { ...prev, timeEnd: '' };
    });
  }, [form.time, busyIntervals]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: table.id,
          tableLabel: tableTitle,
          tableSeats: table.seats,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          date: form.date,
          time: form.time,
          timeEnd: form.timeEnd,
          occasion: form.occasion.trim() ? form.occasion : 'regular',
          guestCount: parseInt(form.guestCount, 10) || 1,
          note: form.note.trim() || null,
          ...(productTitle && { productTitle: productTitle.trim() }),
          ...(productImageUrl && { productImageUrl: productImageUrl.trim() }),
          ...(profitCents != null && Number.isFinite(profitCents) && { profitCents: Math.round(Number(profitCents)) }),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.detail === 'string' ? data.detail : t('desktops.modal.validation.submitFailed'),
        );
      }

      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : t('desktops.modal.validation.unknownError');
      setErrors({ note: msg });
    } finally {
      setSubmitting(false);
    }
  }

  function set(field: keyof ReservationForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      setErrors(prev => ({ ...prev, [field]: undefined }));
    };
  }

  const inputBase =
    'w-full bg-[#1e2b29] border rounded-xl px-4 py-3 text-[#fff4de] text-sm placeholder:text-[#fff4de]/30 focus:outline-none focus:ring-2 transition-all duration-200';
  const inputNormal = `${inputBase} border-[#3d504e] focus:border-[#7CB342] focus:ring-[#7CB342]/20`;
  const inputError  = `${inputBase} border-red-500/60 focus:border-red-400 focus:ring-red-400/20`;

  const modal = (
    <div
      className="fixed inset-0 z-app-overlay flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reservation-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label={t('desktops.modal.closeAria')}
        onClick={onClose}
      />
      <div
        className={`relative z-10 flex w-full max-w-xl flex-col ${MODAL_PANEL_MAX_HEIGHT_CLASS} overflow-hidden rounded-3xl border border-[#3d504e] bg-[#2F3F3D] shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-h-0 flex flex-col overflow-y-auto overscroll-contain">

        {/* Header */}
        <div className="sticky top-0 bg-[#2F3F3D] border-b border-[#3d504e] px-6 py-5 flex items-start justify-between z-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7CB342] mb-1">
              {t('desktops.modal.eyebrow')}
            </p>
            <h2 id="reservation-modal-title" className="text-[#fff4de] text-xl font-light italic">
              {tableTitle}
            </h2>
            <p className="text-[#fff4de]/50 text-xs mt-0.5">
              {t('desktops.tableCard.seats').replace('{n}', String(table.seats))}
              {table.byWindow ? t('desktops.modal.byWindowSuffix') : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#fff4de]/40 hover:text-[#fff4de] transition-colors mt-1 flex-shrink-0"
            aria-label={t('desktops.modal.closeAria')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#7CB342]/20 border border-[#7CB342]/40 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#7CB342]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-[#fff4de] text-xl font-light italic mb-2">
              {t('desktops.modal.successTitle')}
            </h3>
            <p className="text-[#fff4de]/60 text-sm mb-2">
              {tableTitle} · {form.date} · {form.time}–{form.timeEnd}
            </p>
            <p className="text-[#fff4de]/40 text-xs mb-8">
              {t('desktops.modal.successConfirm').replace('{email}', form.email)}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 bg-[#7CB342] hover:bg-[#6aa535] text-white font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 text-sm uppercase tracking-widest"
            >
              {t('desktops.modal.close')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="px-6 py-6 space-y-4">

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#fff4de]/50 mb-1.5">
                  {t('desktops.modal.firstName')} <span className="text-[#7CB342]">*</span>
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={set('firstName')}
                  placeholder={t('desktops.modal.placeholders.firstName')}
                  className={errors.firstName ? inputError : inputNormal}
                />
                {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#fff4de]/50 mb-1.5">
                  {t('desktops.modal.lastName')} <span className="text-[#7CB342]">*</span>
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={set('lastName')}
                  placeholder={t('desktops.modal.placeholders.lastName')}
                  className={errors.lastName ? inputError : inputNormal}
                />
                {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#fff4de]/50 mb-1.5">
                {t('desktops.modal.email')} <span className="text-[#7CB342]">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder={t('desktops.modal.placeholders.email')}
                className={errors.email ? inputError : inputNormal}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#fff4de]/50 mb-1.5">
                {t('desktops.modal.phone')} <span className="text-[#7CB342]">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder={t('desktops.modal.placeholders.phone')}
                className={errors.phone ? inputError : inputNormal}
              />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#fff4de]/50 mb-1.5">
                  {t('desktops.modal.occasion')}
                </label>
                <select
                  value={form.occasion}
                  onChange={set('occasion')}
                  className={`${errors.occasion ? inputError : inputNormal} appearance-none`}
                >
                  <option value="">{t('desktops.modal.occasionPlaceholder')}</option>
                  <option value="birthday">{t('desktops.modal.occasions.birthday')}</option>
                  <option value="regular">{t('desktops.modal.occasions.regular')}</option>
                </select>
                {errors.occasion && <p className="text-red-400 text-xs mt-1">{errors.occasion}</p>}
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#fff4de]/50 mb-1.5">
                  {t('desktops.modal.date')} <span className="text-[#7CB342]">*</span>
                </label>
                <input
                  type="date"
                  value={form.date}
                  min={today}
                  onChange={set('date')}
                  className={`${errors.date ? inputError : inputNormal} [color-scheme:dark]`}
                />
                {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#fff4de]/50 mb-1.5">
                {t('desktops.modal.guestCount')}
              </label>
              <select
                value={form.guestCount}
                onChange={set('guestCount')}
                className={`${inputNormal} appearance-none`}
              >
                {Array.from({ length: table.seats }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>
                    {t('desktops.modal.guestsOption').replace('{n}', String(n))}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#fff4de]/50 mb-1.5">
                  {t('desktops.modal.timeFrom')} <span className="text-[#7CB342]">*</span>
                </label>
                <select
                  value={form.time}
                  onChange={(e) => {
                    const nextTime = e.target.value;
                    setForm((prev) => ({ ...prev, time: nextTime, timeEnd: '' }));
                    setErrors((prev) => ({ ...prev, time: undefined, timeEnd: undefined }));
                  }}
                  className={`${errors.time ? inputError : inputNormal} appearance-none`}
                >
                  <option value="">{t('desktops.modal.timePlaceholder')}</option>
                  {RESERVATION_TIME_SLOTS.map((slot) => (
                    <option
                      key={slot}
                      value={slot}
                      disabled={
                        !isStartTimeSlotBookable(slot, RESERVATION_TIME_SLOTS, busyIntervals) ||
                        isPastTimeSlotForDate(form.date, slot)
                      }
                    >
                      {slot}
                    </option>
                  ))}
                </select>
                {errors.time && <p className="text-red-400 text-xs mt-1">{errors.time}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#fff4de]/50 mb-1.5">
                  {t('desktops.modal.timeTo')} <span className="text-[#7CB342]">*</span>
                </label>
                <select
                  value={form.timeEnd}
                  onChange={set('timeEnd')}
                  className={`${errors.timeEnd ? inputError : inputNormal} appearance-none`}
                  disabled={!form.time}
                >
                  <option value="">{t('desktops.modal.timeEndPlaceholder')}</option>
                  {getValidEndTimeSlots(form.time, RESERVATION_TIME_SLOTS, busyIntervals).map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                {errors.timeEnd && <p className="text-red-400 text-xs mt-1">{errors.timeEnd}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#fff4de]/50 mb-1.5">
                {t('desktops.modal.note')}
              </label>
              <textarea
                value={form.note}
                onChange={set('note')}
                placeholder={t('desktops.modal.placeholders.note')}
                rows={3}
                className={`${inputNormal} resize-none`}
              />
              {errors.note && <p className="text-red-400 text-xs mt-1">{errors.note}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-[#7CB342] hover:bg-[#6aa535] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 text-sm uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('desktops.modal.submitting')}
                </>
              ) : (
                t('desktops.modal.submit')
              )}
            </button>

          </form>
        )}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(modal, document.body);
}
