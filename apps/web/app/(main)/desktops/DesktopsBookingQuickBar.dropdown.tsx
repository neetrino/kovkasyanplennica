'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

const DROPDOWN_LIST_CLASS =
  'absolute left-0 right-0 top-full z-[50] mt-1 max-h-56 overflow-y-auto rounded-2xl border border-white/10 bg-[#2f3e3e] py-1 shadow-[0_12px_32px_rgba(0,0,0,0.35)] [color-scheme:dark]';

const OPTION_BTN_BASE =
  'w-full cursor-pointer px-3 py-2.5 text-left text-sm text-[#fdfdfd] transition-colors hover:bg-white/10 focus:bg-white/10 focus:outline-none';

const OPTION_SELECTED = 'bg-white/[0.12]';

type BookingQuickBarDropdownProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  iconSrc: string;
  chevronSrc: string;
  triggerLabel: string;
  /** When true, trigger text uses muted color (placeholder). */
  isPlaceholder: boolean;
  triggerTextSize: 'sm' | 'xs';
  roundedClass: string;
  listboxId: string;
  ariaLabel: string;
  iconClassName: string;
  children: ReactNode;
};

/**
 * Custom listbox for quick bar — native `<select>` lists stay OS-white; this matches the date field / dark UI.
 */
export function BookingQuickBarDropdown({
  isOpen,
  onOpenChange,
  iconSrc,
  chevronSrc,
  triggerLabel,
  isPlaceholder,
  triggerTextSize,
  roundedClass,
  listboxId,
  ariaLabel,
  iconClassName,
  children,
}: BookingQuickBarDropdownProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      onOpenChange(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onOpenChange]);

  const textSizeClass = triggerTextSize === 'sm' ? 'text-sm' : 'text-xs md:text-sm';

  return (
    <div ref={rootRef} className="relative h-full w-full">
      <button
        type="button"
        id={`${listboxId}-trigger`}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        onClick={() => onOpenChange(!isOpen)}
        className={`flex h-full w-full cursor-pointer items-center ${roundedClass} pl-2.5 pr-2.5 text-left md:pl-3 md:pr-3`}
      >
        <img
          src={iconSrc}
          alt=""
          className={`pointer-events-none mr-2 shrink-0 ${iconClassName}`}
          aria-hidden
        />
        <span
          className={`min-w-0 flex-1 truncate ${textSizeClass} ${isPlaceholder ? 'text-[#fdfdfd]/55' : 'text-[#fdfdfd]'}`}
        >
          {triggerLabel}
        </span>
        <img
          src={chevronSrc}
          alt=""
          className={`pointer-events-none ml-2 size-[18px] shrink-0 opacity-80 transition-transform md:size-[21px] ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {isOpen ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={`${listboxId}-trigger`}
          className={DROPDOWN_LIST_CLASS}
        >
          {children}
        </ul>
      ) : null}
    </div>
  );
}

type DropdownOptionProps = {
  selected: boolean;
  onPick: () => void;
  children: ReactNode;
};

export function BookingQuickBarDropdownOption({ selected, onPick, children }: DropdownOptionProps) {
  return (
    <li role="none">
      <button
        type="button"
        role="option"
        aria-selected={selected}
        className={`${OPTION_BTN_BASE} ${selected ? OPTION_SELECTED : ''}`}
        onClick={() => {
          onPick();
        }}
      >
        {children}
      </button>
    </li>
  );
}
