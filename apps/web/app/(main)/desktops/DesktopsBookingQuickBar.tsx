'use client';

import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { useTranslation } from '@/lib/i18n-client';
import { bookingQuickBarAssets } from './bookingQuickBar.assets';
import {
  BookingQuickBarDropdown,
  BookingQuickBarDropdownOption,
} from './DesktopsBookingQuickBar.dropdown';
import { RESERVATION_TIME_SLOTS } from './reservationTimeSlots';

const QUICK_BAR_MAX_GUESTS = 8;

export type QuickBookingValues = {
  date: string;
  time: string;
  timeEnd: string;
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
    <div className="rounded-[32px] bg-[rgba(245,220,187,0.3)] p-0">
      <div className="relative h-[46px] rounded-[40px] border border-white/10 bg-white/5 md:h-[48px]">
        {children}
      </div>
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
  const [openMenu, setOpenMenu] = useState<'time' | 'timeEnd' | 'guests' | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  function patch(partial: Partial<QuickBookingValues>) {
    onChange({ ...value, ...partial });
  }

  function openDatePicker() {
    const el = dateInputRef.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === 'function') {
        void el.showPicker();
        return;
      }
    } catch {
      // ignore
    }
    el.focus();
    el.click();
  }

  return (
    <div
      className="mt-6 mb-6 rounded-3xl border border-white/5 bg-white/[0.03] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.2)] md:mt-8 md:mb-8 md:p-6 lg:rounded-[2.5rem] lg:p-8"
      data-name="booking-quick-bar"
    >
      <p className="mx-auto mb-5 max-w-md text-center text-sm font-normal leading-snug text-white md:mb-6 md:text-base md:leading-6">
        {t('desktops.quickBar.tagline')}
      </p>

      <div className="mx-auto mb-5 flex max-w-3xl flex-col gap-5 md:mb-6 lg:flex-row lg:items-end lg:justify-center lg:gap-6">
        <div className="min-w-0 flex-1 lg:max-w-[180px]">
          <p className="mb-1.5 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-[#cbc0af] lg:text-left">
            {t('desktops.quickBar.date')}
          </p>
          <FieldShell>
            <label
              htmlFor="desktops-quick-bar-date"
              className="relative flex h-full w-full cursor-pointer items-center justify-start gap-1 rounded-[40px] pl-2.5 pr-2.5 md:gap-1.5 md:pl-3 md:pr-3"
              onClick={(e) => {
                e.preventDefault();
                openDatePicker();
              }}
            >
              <input
                ref={dateInputRef}
                id="desktops-quick-bar-date"
                type="date"
                value={value.date}
                min={minDate}
                onChange={(e) => patch({ date: e.target.value })}
                className="pointer-events-none absolute inset-0 z-[1] h-full min-h-0 w-full min-w-0 cursor-pointer rounded-[40px] border-0 opacity-0 outline-none [color-scheme:dark]"
              />
              <img
                src={bookingQuickBarAssets.calendar}
                alt=""
                className="pointer-events-none relative z-[2] mr-2 h-3.5 w-3.5 shrink-0 md:mr-2.5 md:h-[15px] md:w-[15px]"
                aria-hidden
              />
              <span className="pointer-events-none relative z-[2] min-w-0 flex-1 truncate text-left text-xs text-[#fdfdfd] md:text-sm">
                    {value.date
                  ? new Date(`${value.date}T12:00:00`).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '\u00a0'}
              </span>
              <img
                src={bookingQuickBarAssets.chevron}
                alt=""
                className="pointer-events-none relative z-[2] ml-2 size-[18px] shrink-0 opacity-80 md:size-[21px]"
                aria-hidden
              />
            </label>
          </FieldShell>
        </div>

        <div className="min-w-0 flex-1 lg:max-w-[200px]">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.1em] text-[#cbc0af] lg:text-left">
            {t('desktops.quickBar.time')}
          </p>
          <FieldShell>
            <BookingQuickBarDropdown
              listboxId="desktops-quick-bar-time"
              isOpen={openMenu === 'time'}
              onOpenChange={(open) => setOpenMenu(open ? 'time' : null)}
              iconSrc={bookingQuickBarAssets.clock}
              chevronSrc={bookingQuickBarAssets.chevron}
              triggerLabel={value.time || t('desktops.modal.timePlaceholder')}
              isPlaceholder={!value.time}
              triggerTextSize="sm"
              roundedClass="rounded-[48px]"
              ariaLabel={t('desktops.quickBar.time')}
              iconClassName="h-[15px] w-[15px]"
            >
              <BookingQuickBarDropdownOption
                selected={value.time === ''}
                onPick={() => {
                  patch({ time: '', timeEnd: '' });
                  setOpenMenu(null);
                }}
              >
                {t('desktops.modal.timePlaceholder')}
              </BookingQuickBarDropdownOption>
              {RESERVATION_TIME_SLOTS.map((slot) => (
                <BookingQuickBarDropdownOption
                  key={slot}
                  selected={value.time === slot}
                  onPick={() => {
                    const slots = RESERVATION_TIME_SLOTS as readonly string[];
                    const si = slots.indexOf(slot);
                    const ei = value.timeEnd ? slots.indexOf(value.timeEnd) : -1;
                    const keepEnd = si >= 0 && ei > si;
                    patch({ time: slot, timeEnd: keepEnd ? value.timeEnd : '' });
                    setOpenMenu(null);
                  }}
                >
                  {slot}
                </BookingQuickBarDropdownOption>
              ))}
            </BookingQuickBarDropdown>
          </FieldShell>
        </div>

        <div className="min-w-0 flex-1 lg:max-w-[200px]">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.1em] text-[#cbc0af] lg:text-left">
            {t('desktops.quickBar.timeEnd')}
          </p>
          <FieldShell>
            <BookingQuickBarDropdown
              listboxId="desktops-quick-bar-time-end"
              isOpen={openMenu === 'timeEnd'}
              onOpenChange={(open) => setOpenMenu(open ? 'timeEnd' : null)}
              iconSrc={bookingQuickBarAssets.clock}
              chevronSrc={bookingQuickBarAssets.chevron}
              triggerLabel={value.timeEnd || t('desktops.modal.timeEndPlaceholder')}
              isPlaceholder={!value.timeEnd}
              triggerTextSize="sm"
              roundedClass="rounded-[48px]"
              ariaLabel={t('desktops.quickBar.timeEnd')}
              iconClassName="h-[15px] w-[15px]"
            >
              <BookingQuickBarDropdownOption
                selected={value.timeEnd === ''}
                onPick={() => {
                  patch({ timeEnd: '' });
                  setOpenMenu(null);
                }}
              >
                {t('desktops.modal.timeEndPlaceholder')}
              </BookingQuickBarDropdownOption>
              {RESERVATION_TIME_SLOTS.filter((slot) => {
                if (!value.time) return false;
                const slots = RESERVATION_TIME_SLOTS as readonly string[];
                const si = slots.indexOf(value.time);
                const ei = slots.indexOf(slot);
                return si >= 0 && ei > si;
              }).map((slot) => (
                <BookingQuickBarDropdownOption
                  key={slot}
                  selected={value.timeEnd === slot}
                  onPick={() => {
                    patch({ timeEnd: slot });
                    setOpenMenu(null);
                  }}
                >
                  {slot}
                </BookingQuickBarDropdownOption>
              ))}
            </BookingQuickBarDropdown>
          </FieldShell>
        </div>

        <div className="min-w-0 flex-1 lg:max-w-[180px]">
          <p className="mb-1.5 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-[#cbc0af] lg:text-left">
            {t('desktops.quickBar.guests')}
          </p>
          <FieldShell>
            <BookingQuickBarDropdown
              listboxId="desktops-quick-bar-guests"
              isOpen={openMenu === 'guests'}
              onOpenChange={(open) => setOpenMenu(open ? 'guests' : null)}
              iconSrc={bookingQuickBarAssets.guests}
              chevronSrc={bookingQuickBarAssets.chevron}
              triggerLabel={t('desktops.modal.guestsOption').replace('{n}', value.guestCount)}
              isPlaceholder={false}
              triggerTextSize="xs"
              roundedClass="rounded-[40px]"
              ariaLabel={t('desktops.quickBar.guests')}
              iconClassName="h-2.5 w-4 md:h-3 md:w-[18px]"
            >
              {Array.from({ length: QUICK_BAR_MAX_GUESTS }, (_, i) => i + 1).map((n) => (
                <BookingQuickBarDropdownOption
                  key={n}
                  selected={value.guestCount === String(n)}
                  onPick={() => {
                    patch({ guestCount: String(n) });
                    setOpenMenu(null);
                  }}
                >
                  {t('desktops.modal.guestsOption').replace('{n}', String(n))}
                </BookingQuickBarDropdownOption>
              ))}
            </BookingQuickBarDropdown>
          </FieldShell>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onReserveClick}
          className="h-11 min-w-[200px] rounded-[40px] bg-[#ffe5c2] px-6 text-sm font-bold text-[#2f3f3d] transition-transform hover:bg-[#ffd9a8] active:scale-[0.98] md:h-12 md:min-w-[219px] md:rounded-[48px] md:px-8 md:text-base"
        >
          {t('desktops.quickBar.cta')}
        </button>
      </div>
    </div>
  );
}
