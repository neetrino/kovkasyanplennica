'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { formatNavLabel } from '../../lib/formatNavLabel';
import { useTranslation } from '../../lib/i18n-client';
import { LANGUAGES, getStoredLanguage, setStoredLanguage } from '../../lib/language';
import type { LanguageCode } from '../../lib/language';

export function MobileHeader() {
  const pathname = usePathname();
  const logoHomeHref = pathname === '/mobile' ? '/mobile' : '/';
  const { t } = useTranslation();
  const { isLoggedIn, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const currentLang = getStoredLanguage();

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const handleLanguageSelect = (code: LanguageCode) => {
    if (code === currentLang) return;
    setStoredLanguage(code);
    closeMenu();
  };

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [closeMenu]);

  return (
    <>
      <header className="sticky top-0 z-app-header bg-[#2f3f3d] lg:hidden">
        <div className="mx-auto flex w-full max-w-[375px] items-center justify-between px-4 pb-4 pt-[max(12px,env(safe-area-inset-top,0px))]">
          <Link prefetch href={logoHomeHref} className="shrink-0" aria-label="Kovkasyan Plennica home">
            <Image
              src="/assets/mobile-home/logo-kp2.png"
              alt=""
              width={150}
              height={110}
              className="h-[110px] w-[150px] object-contain object-left"
              priority
            />
          </Link>
          <div className="flex shrink-0 items-center gap-[11px]">
            <Link
              prefetch
              href="/desktops"
              className="flex h-12 min-w-[116px] items-center justify-center rounded-[48px] bg-[#75bf5e] px-6 text-[16px] font-bold leading-6 text-white"
            >
              Бронь
            </Link>
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white"
              aria-label={t('home.header.mobileMenu.ariaLabel')}
              aria-expanded={isMenuOpen}
            >
              <span className="flex flex-col gap-1.5" aria-hidden>
                <span className="block h-0.5 w-5 rounded-full bg-[#75bf5e]" />
                <span className="block h-0.5 w-5 rounded-full bg-[#75bf5e]" />
                <span className="block h-0.5 w-5 rounded-full bg-[#75bf5e]" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-app-overlay flex items-center justify-center p-4 lg:hidden" role="dialog" aria-modal="true" aria-label={t('home.header.mobileMenu.ariaLabel')}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={closeMenu} aria-hidden />
          <div
            className="relative flex max-h-[min(90vh,480px)] w-[280px] flex-col overflow-y-auto rounded-2xl border border-white/10 bg-[#2f3f3d] p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={closeMenu}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
                aria-label={t('common.buttons.close')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-3">
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="w-full rounded-full bg-white/10 py-3 text-sm font-semibold text-white"
                >
                  {t('common.navigation.logout') || 'Logout'}
                </button>
              )}
              <Link
                prefetch={false}
                href="/products"
                onClick={closeMenu}
                className="w-full rounded-full bg-white/10 py-3 text-center text-sm font-semibold text-white"
              >
                {formatNavLabel(t('home.header.navigation.menu'))}
              </Link>
              <Link
                prefetch={false}
                href="/coming-soon"
                onClick={closeMenu}
                className="w-full rounded-full bg-white/10 py-3 text-center text-sm font-semibold text-white"
              >
                {formatNavLabel(t('home.header.navigation.delivery'))}
              </Link>
              <Link prefetch={false} href="/about" onClick={closeMenu} className="w-full rounded-full bg-white/10 py-3 text-center text-sm font-semibold text-white">
                {formatNavLabel(t('home.header.navigation.about'))}
              </Link>
            </div>
            <div className="mt-3 border-t border-white/15 pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">{t('common.language.label')}</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(LANGUAGES) as LanguageCode[]).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleLanguageSelect(code)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold ${
                      currentLang === code ? 'bg-[#75bf5e] text-white' : 'bg-white/10 text-white'
                    }`}
                  >
                    {LANGUAGES[code].nativeName}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
