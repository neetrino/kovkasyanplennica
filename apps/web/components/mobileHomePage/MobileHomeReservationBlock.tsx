'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@/lib/i18n-client';
import { formatLocalISODate } from '@/lib/formatLocalISODate';
import { RESERVATION_TIME_SLOTS } from '../../app/(main)/desktops/reservationTimeSlots';

const MAX_GUESTS = 8;

type OpenMenu = 'time' | 'guests' | null;

function buildDesktopsHref(date: string, time: string, guestCount: string): string {
  const q = new URLSearchParams();
  if (date) q.set('date', date);
  if (time) q.set('time', time);
  if (guestCount) q.set('guests', guestCount);
  const s = q.toString();
  return s ? `/desktops?${s}` : '/desktops';
}

function triggerNativeDatePicker(input: HTMLInputElement | null): void {
  if (!input) return;
  try {
    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }
  } catch {
    // fall through to click()
  }
  input.click();
}

export function MobileHomeReservationBlock() {
  const { t } = useTranslation();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeRootRef = useRef<HTMLDivElement>(null);
  const guestsRootRef = useRef<HTMLDivElement>(null);

  const minDate = useMemo(() => formatLocalISODate(new Date()), []);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guestCount, setGuestCount] = useState('2');
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);

  useEffect(() => {
    if (!openMenu) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (openMenu === 'time' && timeRootRef.current?.contains(t)) return;
      if (openMenu === 'guests' && guestsRootRef.current?.contains(t)) return;
      setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [openMenu]);

  const dateLabel =
    date.length > 0
      ? new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '';

  const timeLabel = time || t('desktops.modal.timePlaceholder');
  const guestsLabel = t('desktops.modal.guestsOption').replace('{n}', guestCount);

  return (
    <>
      <section className="rounded-[24px] bg-white px-5 pb-9 pt-[22px] text-[#0a2533]">
        <h2 className="mb-[38px] text-center text-[16px] font-bold leading-[1.35]">
          {t('desktops.modal.homeCardTitle')}
        </h2>
        <div className="space-y-[19px]">
          <div className="relative flex h-12 w-full items-center rounded-[40px] bg-[#dbdbdb] px-5 text-left text-[14px]">
            <div className="pointer-events-none flex min-w-0 flex-1 items-center">
              <Image
                src="/assets/mobile-home/reserve-calendar.svg"
                alt=""
                width={16}
                height={16}
                className="shrink-0"
                aria-hidden
              />
              <span
                className={`ml-3 flex-1 truncate ${date ? 'text-[#0a2533]' : 'text-[#909090]'}`}
              >
                {dateLabel || '\u00a0'}
              </span>
              <Image
                src="/assets/mobile-home/reserve-chevron.svg"
                alt=""
                width={21}
                height={21}
                className="shrink-0"
                aria-hidden
              />
            </div>
            <input
              ref={dateInputRef}
              id="mobile-home-reserve-date"
              type="date"
              value={date}
              min={minDate}
              onChange={(e) => setDate(e.target.value)}
              tabIndex={-1}
              className="sr-only"
              aria-hidden
            />
            <button
              type="button"
              className="absolute inset-0 z-10 cursor-pointer rounded-[40px] border-0 bg-transparent p-0 [-webkit-tap-highlight-color:transparent]"
              aria-label={t('desktops.modal.date')}
              onClick={() => {
                triggerNativeDatePicker(dateInputRef.current);
              }}
            />
          </div>

          <div ref={timeRootRef} className="relative">
            <button
              type="button"
              aria-expanded={openMenu === 'time'}
              aria-haspopup="listbox"
              onClick={() => setOpenMenu((m) => (m === 'time' ? null : 'time'))}
              className="flex h-12 w-full items-center rounded-[40px] bg-[#dbdbdb] px-5 text-left text-[14px] text-[#0a2533]"
            >
              <Image src="/assets/mobile-home/reserve-clock.svg" alt="" width={16} height={16} aria-hidden />
              <span
                className={`ml-3 flex-1 truncate ${time ? 'text-[#0a2533]' : 'text-[#909090]'}`}
              >
                {timeLabel}
              </span>
              <Image src="/assets/mobile-home/reserve-chevron.svg" alt="" width={21} height={21} aria-hidden />
            </button>
            {openMenu === 'time' ? (
              <ul
                role="listbox"
                className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-56 overflow-y-auto rounded-2xl border border-black/10 bg-white py-1 shadow-lg"
              >
                <li>
                  <button
                    type="button"
                    role="option"
                    className="w-full px-3 py-2.5 text-left text-sm text-[#0a2533] hover:bg-black/5"
                    onClick={() => {
                      setTime('');
                      setOpenMenu(null);
                    }}
                  >
                    {t('desktops.modal.timePlaceholder')}
                  </button>
                </li>
                {RESERVATION_TIME_SLOTS.map((slot) => (
                  <li key={slot}>
                    <button
                      type="button"
                      role="option"
                      className="w-full px-3 py-2.5 text-left text-sm text-[#0a2533] hover:bg-black/5"
                      onClick={() => {
                        setTime(slot);
                        setOpenMenu(null);
                      }}
                    >
                      {slot}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div ref={guestsRootRef} className="relative">
            <button
              type="button"
              aria-expanded={openMenu === 'guests'}
              aria-haspopup="listbox"
              onClick={() => setOpenMenu((m) => (m === 'guests' ? null : 'guests'))}
              className="flex h-12 w-full items-center rounded-[40px] bg-[#dbdbdb] px-5 text-left text-[14px]"
            >
              <Image src="/assets/mobile-home/reserve-users.svg" alt="" width={16} height={16} aria-hidden />
              <span className="ml-3 flex-1 truncate text-[#0a2533]">{guestsLabel}</span>
              <Image src="/assets/mobile-home/reserve-chevron.svg" alt="" width={21} height={21} aria-hidden />
            </button>
            {openMenu === 'guests' ? (
              <ul
                role="listbox"
                className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-56 overflow-y-auto rounded-2xl border border-black/10 bg-white py-1 shadow-lg"
              >
                {Array.from({ length: MAX_GUESTS }, (_, i) => i + 1).map((n) => (
                  <li key={n}>
                    <button
                      type="button"
                      role="option"
                      className="w-full px-3 py-2.5 text-left text-sm text-[#0a2533] hover:bg-black/5"
                      onClick={() => {
                        setGuestCount(String(n));
                        setOpenMenu(null);
                      }}
                    >
                      {t('desktops.modal.guestsOption').replace('{n}', String(n))}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>

      <Link
        href={buildDesktopsHref(date, time, guestCount)}
        className="mt-5 flex h-14 items-center justify-center rounded-[48px] bg-[#75bf5e] text-[16px] font-bold leading-6 text-white"
      >
        {t('desktops.quickBar.cta')}
      </Link>
    </>
  );
}
