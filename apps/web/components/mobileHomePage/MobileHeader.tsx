'use client';

import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';

/**
 * Mobile Header — Figma Frame1000002326 (node-id=75-2062).
 * Left: menu + search icons, Right: ВОЙТИ button.
 */
export function MobileHeader() {
  const { t } = useTranslation();

  return (
    <header className="w-full bg-[#ffe5c2] flex items-center justify-between gap-5 px-4 py-3 md:hidden">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative w-12 h-12 flex items-center justify-center rounded-full bg-[#2f3f3d]/10"
          aria-label={t('home.header.mobileMenu.ariaLabel')}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2f3f3d"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <Link
          href="/search"
          className="relative w-12 h-12 flex items-center justify-center rounded-full bg-[#2f3f3d]/10"
          aria-label={t('home.header.search.ariaLabel')}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2f3f3d"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </Link>
      </div>
      <Link
        href="/login"
        className="h-12 w-[153px] rounded-full bg-[#2f3f3d] border border-[#2f3f3d] text-white font-bold text-base tracking-[0.02em] flex items-center justify-center flex-shrink-0"
      >
        {t('home.header.login')}
      </Link>
    </header>
  );
}
