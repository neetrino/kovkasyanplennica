'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { formatNavLabel } from '../../lib/formatNavLabel';
import { useTranslation } from '../../lib/i18n-client';
import { LANGUAGES, getStoredLanguage, setStoredLanguage } from '../../lib/language';
import type { LanguageCode } from '../../lib/language';

export function MobileHeader() {
  const pathname = usePathname();
  /** Figma mobile home frame (node 93:286) — logo + Бронь + menu; matches `/` and `/mobile`. */
  const isFigmaMobileHomeLayout = pathname === '/' || pathname === '/mobile';
  const figmaHomeLogoHref = pathname === '/mobile' ? '/mobile' : '/';
  const { t } = useTranslation();
  const { isLoggedIn, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const currentLang = getStoredLanguage();

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, []);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const handleLanguageSelect = (code: LanguageCode) => {
    if (code === currentLang) return;
    setStoredLanguage(code);
    closeMenu();
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      window.location.href = `/products?search=${encodeURIComponent(query)}`;
      return;
    }
    closeSearch();
  };

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
        closeSearch();
      }
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [closeMenu, closeSearch]);

  useEffect(() => {
    if (isFigmaMobileHomeLayout) {
      setHeaderVisible(true);
      return;
    }
    const onScroll = () => {
      const nextY = window.scrollY || document.documentElement.scrollTop || 0;
      const delta = nextY - lastScrollYRef.current;
      lastScrollYRef.current = nextY;
      if (nextY <= 10) return setHeaderVisible(true);
      if (delta > 4 && nextY > 24) return setHeaderVisible(false);
      if (delta < -6) setHeaderVisible(true);
    };
    lastScrollYRef.current = window.scrollY || document.documentElement.scrollTop || 0;
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isFigmaMobileHomeLayout]);

  return (
    <>
      {isFigmaMobileHomeLayout ? (
        <header className="sticky top-0 z-app-header bg-[#2f3f3d] lg:hidden">
          <div className="mx-auto flex w-full max-w-[375px] items-center justify-between px-4 pb-4 pt-[max(12px,env(safe-area-inset-top,0px))]">
            <Link href={figmaHomeLogoHref} className="shrink-0" aria-label="Kovkasyan Plennica home">
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
      ) : (
        <header
          className={`sticky top-0 z-app-header flex items-center justify-between gap-3 bg-[#2f3f3d] px-4 py-2.5 transition-transform duration-300 ease-out lg:hidden ${
            headerVisible ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
              aria-label={t('home.header.mobileMenu.ariaLabel')}
              aria-expanded={isMenuOpen}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
              aria-label={t('home.header.search.ariaLabel')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </div>
          <Link
            href="/login"
            className="flex h-10 w-[120px] shrink-0 items-center justify-center rounded-full border border-white/35 bg-transparent text-sm font-bold tracking-[0.02em] text-white"
          >
            {t('home.header.login')}
          </Link>
        </header>
      )}

      {!isFigmaMobileHomeLayout && isSearchOpen && (
        <div className="fixed inset-0 z-app-overlay lg:hidden" role="dialog" aria-modal="true" aria-label={t('home.header.search.ariaLabel')}>
          <div className="absolute inset-0 bg-[#2f3f3d]/25 backdrop-blur-[2px]" onClick={closeSearch} aria-hidden />
          <div className="absolute inset-x-0 top-0 bg-[#ffe5c2]/85 p-4 pt-6 shadow-lg backdrop-blur-sm">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
              <div className="flex h-12 flex-1 items-center gap-2 rounded-full border border-[#2f3f3d]/25 bg-white/60 pl-3 pr-4">
                <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2f3f3d]/10 text-[#2f3f3d]" aria-label={t('home.header.search.ariaLabel')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </button>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t('home.header.search.placeholder')}
                  className="min-w-0 flex-1 bg-transparent text-base text-[#2f3f3d] outline-none placeholder:text-[#2f3f3d]/65"
                  autoFocus
                  autoComplete="off"
                />
              </div>
              <button type="button" onClick={closeSearch} className="h-12 rounded-full bg-[#2f3f3d]/10 px-4 text-sm font-semibold text-[#2f3f3d]">
                {t('common.buttons.cancel')}
              </button>
            </form>
          </div>
        </div>
      )}

      {isMenuOpen && (
        <div className="fixed inset-0 z-app-overlay flex items-center justify-center p-4 lg:hidden" role="dialog" aria-modal="true" aria-label={t('home.header.mobileMenu.ariaLabel')}>
          <div className="absolute inset-0 bg-[#2f3f3d]/25 backdrop-blur-[2px]" onClick={closeMenu} aria-hidden />
          <div className="relative flex h-[280px] w-[280px] flex-col rounded-2xl bg-[#ffe5c2]/90 p-5 shadow-xl backdrop-blur-sm" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex justify-end">
              <button type="button" onClick={closeMenu} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2f3f3d]/10 text-[#2f3f3d]" aria-label={t('common.buttons.close')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-3">
              {isLoggedIn && (
                <button type="button" onClick={() => { logout(); closeMenu(); }} className="w-full rounded-full bg-[#2f3f3d]/15 py-3 text-sm font-semibold text-[#2f3f3d]">
                  {t('common.navigation.logout') || 'Logout'}
                </button>
              )}
              <Link href="/coming-soon" onClick={closeMenu} className="w-full rounded-full bg-[#2f3f3d]/15 py-3 text-center text-sm font-semibold text-[#2f3f3d]">
                {formatNavLabel(t('home.header.navigation.menu'))}
              </Link>
              <Link href="/about" onClick={closeMenu} className="w-full rounded-full bg-[#2f3f3d]/15 py-3 text-center text-sm font-semibold text-[#2f3f3d]">
                {formatNavLabel(t('home.header.navigation.about'))}
              </Link>
            </div>
            <div className="mt-3 border-t border-[#2f3f3d]/20 pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#2f3f3d]/70">{t('common.language.label')}</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(LANGUAGES) as LanguageCode[]).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleLanguageSelect(code)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold ${
                      currentLang === code ? 'bg-[#2f3f3d] text-[#ffe5c2]' : 'bg-[#2f3f3d]/15 text-[#2f3f3d]'
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
