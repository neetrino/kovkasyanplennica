'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n-client';

export interface ProfileMenuItem {
  id: string;
  label: string;
  icon: ReactNode;
}

interface ProfileMenuDrawerProps {
  tabs: ProfileMenuItem[];
  activeTab: string;
  onSelect: (_tabId: string) => void;
}

/**
 * Mobile profile tab picker: centered overlay matching the main mobile hamburger menu.
 */
export function ProfileMenuDrawer({ tabs, activeTab, onSelect }: ProfileMenuDrawerProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const close = useCallback(() => setOpen(false), []);

  const handleSelect = (tabId: string) => {
    onSelect(tabId);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [open, close]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-wide text-gray-800 shadow-sm"
        aria-label={t('profile.menu.openMenu')}
        aria-expanded={open}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6H20M4 12H16M4 18H12" />
        </svg>
        {t('profile.menu.buttonLabel')}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-app-overlay flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('profile.menu.title')}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={close} aria-hidden />
          <div
            className="relative flex max-h-[min(90vh,520px)] w-full max-w-[min(100%,304px)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#2f3f3d] p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-base font-semibold leading-snug text-white">{t('profile.menu.title')}</p>
              <button
                type="button"
                onClick={close}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white"
                aria-label={t('common.buttons.close')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelect(tab.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-full px-4 py-3 text-left text-sm font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#75bf5e] text-white'
                      : 'bg-white/10 text-white hover:bg-white/15'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex-shrink-0 [&_svg]:stroke-current">{tab.icon}</span>
                    <span className="truncate">{tab.label}</span>
                  </span>
                  <svg
                    className="h-4 w-4 shrink-0 opacity-90"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
