'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import type { TableConfig } from './table-data';

interface ReservationForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
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
  guestCount: '1',
  note: '',
};

const TIME_SLOTS = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00',
];

interface ReservationModalProps {
  table: TableConfig;
  onClose: () => void;
  /** Ապրանքի տվյալներ spin wheel-ից (query params) */
  productTitle?: string | null;
  productImageUrl?: string | null;
  profitCents?: number | null;
}

export function ReservationModal({ table, onClose, productTitle, productImageUrl, profitCents }: ReservationModalProps) {
  const { user } = useAuth();
  const [form, setForm] = useState<ReservationForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<ReservationForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const didPrefillFromUser = useRef(false);

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

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Scroll is allowed when modal is open (no body overflow lock).

  const today = new Date().toISOString().split('T')[0];

  function validate(): boolean {
    const next: Partial<ReservationForm> = {};
    if (!form.firstName.trim()) next.firstName = 'Անունը պարտադիր է';
    if (!form.lastName.trim()) next.lastName = 'Ազգանունը պարտադիր է';
    if (!form.email.trim()) {
      next.email = 'Էլ. հասցեն պարտադիր է';
    } else if (
      form.email.indexOf('@') < 1 ||
      !form.email.slice(form.email.indexOf('@') + 1).includes('.')
    ) {
      next.email = 'Անվավեր էլ. հասցե';
    }
    if (!form.phone.trim()) next.phone = 'Հեռախոսը պարտադիր է';
    if (!form.date) next.date = 'Ամսաթիվը պարտադիր է';
    if (!form.time) next.time = 'Ժամը պարտադիր է';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

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
          tableLabel: table.label,
          tableSeats: table.seats,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          date: form.date,
          time: form.time,
          guestCount: parseInt(form.guestCount, 10) || 1,
          note: form.note.trim() || null,
          ...(productTitle && { productTitle: productTitle.trim() }),
          ...(productImageUrl && { productImageUrl: productImageUrl.trim() }),
          ...(profitCents != null && Number.isFinite(profitCents) && { profitCents: Math.round(Number(profitCents)) }),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Ամրագրումը ձախողվեց');
      }

      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Անհայտ սխալ';
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#2F3F3D] border border-[#3d504e] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-[#2F3F3D] border-b border-[#3d504e] px-6 py-5 flex items-start justify-between z-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7CB342] mb-1">
              Ամրագրում
            </p>
            <h2 className="text-[#fff4de] text-xl font-light italic">
              {table.label}
            </h2>
            <p className="text-[#fff4de]/50 text-xs mt-0.5">
              {table.seats} հոգի{table.byWindow ? ' · Պատուհանի կողքին' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#fff4de]/40 hover:text-[#fff4de] transition-colors mt-1 flex-shrink-0"
            aria-label="Փակել"
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
            <h3 className="text-[#fff4de] text-xl font-light italic mb-2">Ամրագրված է!</h3>
            <p className="text-[#fff4de]/60 text-sm mb-2">
              {table.label} · {form.date} · {form.time}
            </p>
            <p className="text-[#fff4de]/40 text-xs mb-8">
              Հաստատումը կուղարկվի {form.email} հասցեին
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 bg-[#7CB342] hover:bg-[#6aa535] text-white font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 text-sm uppercase tracking-widest"
            >
              Փակել
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="px-6 py-6 space-y-4">

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#fff4de]/50 mb-1.5">
                  Անուն <span className="text-[#7CB342]">*</span>
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={set('firstName')}
                  placeholder="Անի"
                  className={errors.firstName ? inputError : inputNormal}
                />
                {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#fff4de]/50 mb-1.5">
                  Ազգանուն <span className="text-[#7CB342]">*</span>
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={set('lastName')}
                  placeholder="Հakobyan"
                  className={errors.lastName ? inputError : inputNormal}
                />
                {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#fff4de]/50 mb-1.5">
                Էլ. հասցե <span className="text-[#7CB342]">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="ani@example.com"
                className={errors.email ? inputError : inputNormal}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#fff4de]/50 mb-1.5">
                Հեռախոս <span className="text-[#7CB342]">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+374 XX XXX XXX"
                className={errors.phone ? inputError : inputNormal}
              />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#fff4de]/50 mb-1.5">
                  Ամսաթիվ <span className="text-[#7CB342]">*</span>
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
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#fff4de]/50 mb-1.5">
                  Ժամ <span className="text-[#7CB342]">*</span>
                </label>
                <select
                  value={form.time}
                  onChange={set('time')}
                  className={`${errors.time ? inputError : inputNormal} appearance-none`}
                >
                  <option value="">Ընտրել</option>
                  {TIME_SLOTS.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
                {errors.time && <p className="text-red-400 text-xs mt-1">{errors.time}</p>}
              </div>
            </div>

            {/* Guest count */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#fff4de]/50 mb-1.5">
                Հյուրերի քանակ
              </label>
              <select
                value={form.guestCount}
                onChange={set('guestCount')}
                className={`${inputNormal} appearance-none`}
              >
                {Array.from({ length: table.seats }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n} հոգի</option>
                ))}
              </select>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#fff4de]/50 mb-1.5">
                Նշում (ոչ պարտադիր)
              </label>
              <textarea
                value={form.note}
                onChange={set('note')}
                placeholder="Ծննդյան տոն, ալերգիա, հատուկ ցանկություն..."
                rows={3}
                className={`${inputNormal} resize-none`}
              />
              {errors.note && <p className="text-red-400 text-xs mt-1">{errors.note}</p>}
            </div>

            {/* Submit */}
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
                  Ուղարկվում է...
                </>
              ) : (
                'Ամրագրել սեղանը'
              )}
            </button>

          </form>
        )}
      </div>
    </div>
  );
}
