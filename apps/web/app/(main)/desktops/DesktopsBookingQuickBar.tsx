'use client';

import type { ReactNode } from 'react';
import { useTranslation } from '@/lib/i18n-client';
import { bookingQuickBarAssets } from './bookingQuickBar.assets';
import { RESERVATION_TIME_SLOTS } from './reservationTimeSlots';

const QUICK_BAR_MAX_GUESTS = 8;

export type QuickBookingValues = {
  date: string;
  time: string;
  guestCount: string;
};

type DesktopsBookingQuickBarProps = {
  value: QuickBookingValues;
  onChange: (next: QuickBookingValues) => void;
  onReserveClick: () => void;
  minDate: string;
};

function FieldShell({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[40px] bg-[rgba(245,220,187,0.3)] p-0">
      <div className="relative h-[54px] rounded-[48px] border border-white/10 bg-white/5">{children}</div>
    </div>
  );
}

export function DesktopsBookingQuickBar({
  value,
  onChange,
  onReserveClick,
  minDate,
}: DesktopsBookingQuickBarProps) {
  const { t } = useTranslation();

  function patch(partial: Partial<QuickBookingValues>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div
      className="mt-10 mb-10 overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.03] p-8 shadow-[0_24px_48px_rgba(0,0,0,0.25)] lg:rounded-[4rem] lg:p-14"
      data-name="booking-quick-bar"
    >
      <p className="mx-auto mb-8 max-w-[22rem] text-center text-base font-normal leading-6 text-white lg:max-w-none">
        {t('desktops.quickBar.tagline')}
      </p>

      <div className="mx-auto mb-8 flex max-w-4xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-center lg:gap-9">
        <div className="flex-1 lg:max-w-[200px]">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.1em] text-[#cbc0af] lg:text-left">
            {t('desktops.quickBar.date')}
          </p>
          <FieldShell>
            <img
              src={bookingQuickBarAssets.calendar}
              alt=""
              className="pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2"
              aria-hidden
            />
            <input
              type="date"
              value={value.date}
              min={minDate}
              onChange={(e) => patch({ date: e.target.value })}
              className="h-full w-full cursor-pointer rounded-[48px] border-0 bg-transparent pl-11 pr-10 text-sm text-[#fdfdfd] outline-none [color-scheme:dark]"
            />
            <img
              src={bookingQuickBarAssets.chevron}
              alt=""
              className="pointer-events-none absolute right-3 top-1/2 size-[21px] -translate-y-1/2 opacity-80"
              aria-hidden
            />
          </FieldShell>
        </div>

        <div className="flex-1 lg:max-w-[200px]">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.1em] text-[#cbc0af] lg:text-left">
            {t('desktops.quickBar.time')}
          </p>
          <FieldShell>
            <img
              src={bookingQuickBarAssets.clock}
              alt=""
              className="pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2"
              aria-hidden
            />
            <select
              value={value.time}
              onChange={(e) => patch({ time: e.target.value })}
              className="h-full w-full cursor-pointer appearance-none rounded-[48px] border-0 bg-transparent pl-11 pr-10 text-sm text-[#fdfdfd] outline-none"
            >
              <option value="">{t('desktops.modal.timePlaceholder')}</option>
              {RESERVATION_TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            <img
              src={bookingQuickBarAssets.chevron}
              alt=""
              className="pointer-events-none absolute right-3 top-1/2 size-[21px] -translate-y-1/2 opacity-80"
              aria-hidden
            />
          </FieldShell>
        </div>

        <div className="flex-1 lg:max-w-[200px]">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.1em] text-[#cbc0af] lg:text-left">
            {t('desktops.quickBar.guests')}
          </p>
          <FieldShell>
            <img
              src={bookingQuickBarAssets.guests}
              alt=""
              className="pointer-events-none absolute left-3 top-1/2 h-3 w-[18px] -translate-y-1/2"
              aria-hidden
            />
            <select
              value={value.guestCount}
              onChange={(e) => patch({ guestCount: e.target.value })}
              className="h-full w-full cursor-pointer appearance-none rounded-[48px] border-0 bg-transparent pl-11 pr-10 text-sm text-[#fdfdfd] outline-none"
            >
              {Array.from({ length: QUICK_BAR_MAX_GUESTS }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {t('desktops.modal.guestsOption').replace('{n}', String(n))}
                </option>
              ))}
            </select>
            <img
              src={bookingQuickBarAssets.chevron}
              alt=""
              className="pointer-events-none absolute right-3 top-1/2 size-[21px] -translate-y-1/2 opacity-80"
              aria-hidden
            />
          </FieldShell>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onReserveClick}
          className="h-14 min-w-[219px] rounded-[48px] bg-[#ffe5c2] px-8 text-base font-bold text-[#2f3f3d] transition-transform hover:bg-[#ffd9a8] active:scale-[0.98]"
        >
          {t('desktops.quickBar.cta')}
        </button>
      </div>
    </div>
  );
}
