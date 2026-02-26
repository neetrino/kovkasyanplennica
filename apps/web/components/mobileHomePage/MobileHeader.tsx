'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';
import { useAuth } from '../../lib/auth/AuthContext';

/**
 * Mobile Header — Figma Frame1000002326 (node-id=75-2062).
 * Left: menu (popup with Logout, Menu, About us) + search icons, Right: ВОЙТИ button.
 * Search icon opens a popup overlay with search input.
 */
export function MobileHeader() {
  const { t } = useTranslation();
  const { isLoggedIn, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, []);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      window.location.href = `/products?search=${encodeURIComponent(q)}`;
      return;
    }
    closeSearch();
  };

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  useEffect(() => {
    if (!isSearchOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch();
    };
    document.addEventListener('keydown', onEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.body.style.overflow = '';
    };
  }, [isSearchOpen, closeSearch]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', onEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.body.style.overflow = '';
    };
  }, [isMenuOpen, closeMenu]);

  return (
    <>
      <header className="w-full bg-[#ffe5c2] flex items-center justify-between gap-5 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="relative w-12 h-12 flex items-center justify-center rounded-full bg-[#2f3f3d]/10"
            aria-label={t('home.header.mobileMenu.ariaLabel')}
            aria-expanded={isMenuOpen}
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
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
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
          </button>
        </div>
        <Link
          href="/login"
          className="h-10 w-[120px] rounded-full bg-[#2f3f3d] border border-[#2f3f3d] text-white font-bold text-sm tracking-[0.02em] flex items-center justify-center flex-shrink-0"
        >
          {t('home.header.login')}
        </Link>
      </header>

      {/* Search popup overlay */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-[100] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t('home.header.search.ariaLabel')}
        >
          <div
            className="absolute inset-0 bg-[#2f3f3d]/25 backdrop-blur-[2px]"
            onClick={closeSearch}
            aria-hidden
          />
          <div className="absolute inset-x-0 top-0 bg-[#ffe5c2]/85 backdrop-blur-sm shadow-lg p-4 pt-6 safe-area-inset-top">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
              <div className="flex-1 max-w-[260px] relative bg-white/60 backdrop-blur-sm border border-[#2f3f3d]/25 rounded-full h-12 flex items-center pl-3 pr-4 gap-2">
                <button
                  type="submit"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2f3f3d]/10 text-[#2f3f3d] flex-shrink-0"
                  aria-label={t('home.header.search.ariaLabel')}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </button>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('home.header.search.placeholder')}
                  className="flex-1 min-w-0 bg-transparent text-[#2f3f3d] text-base outline-none placeholder:text-[#2f3f3d]/65"
                  autoFocus
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                onClick={closeSearch}
                className="h-12 px-4 rounded-full bg-[#2f3f3d]/10 text-[#2f3f3d] font-semibold text-sm"
              >
                {t('common.buttons.cancel')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Menu popup: Logout, Menu, About us — centered square, transparent style */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-[100] lg:hidden flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('home.header.mobileMenu.ariaLabel')}
        >
          <div
            className="absolute inset-0 bg-[#2f3f3d]/25 backdrop-blur-[2px]"
            onClick={closeMenu}
            aria-hidden
          />
          <div
            className="relative w-[280px] h-[280px] bg-[#ffe5c2]/85 backdrop-blur-sm shadow-xl rounded-2xl p-5 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end mb-4">
              <button
                type="button"
                onClick={closeMenu}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2f3f3d]/10 text-[#2f3f3d] flex-shrink-0"
                aria-label={t('common.buttons.close')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-3 flex-1">
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-3 w-full rounded-full bg-[#2f3f3d]/15 text-[#2f3f3d] font-semibold text-sm hover:bg-[#2f3f3d]/25 transition-colors"
                >
                  {t('common.navigation.logout') || 'Logout'}
                </button>
              )}
              <Link
                href="/coming-soon"
                onClick={closeMenu}
                className="py-3 w-full rounded-full bg-[#2f3f3d]/15 text-[#2f3f3d] font-semibold text-sm hover:bg-[#2f3f3d]/25 transition-colors text-center"
              >
                {t('home.header.navigation.menu')}
              </Link>
              <Link
                href="/about"
                onClick={closeMenu}
                className="py-3 w-full rounded-full bg-[#2f3f3d]/15 text-[#2f3f3d] font-semibold text-sm hover:bg-[#2f3f3d]/25 transition-colors text-center"
              >
                {t('home.header.navigation.about')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
