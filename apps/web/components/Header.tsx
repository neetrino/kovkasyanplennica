'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTranslation } from '../lib/i18n-client';
import { useAuth } from '../lib/auth/AuthContext';
import { fetchCart } from '../app/(main)/cart/cart-fetcher';
import { formatPrice, getStoredCurrency } from '../lib/currency';
import { formatNavLabel } from '../lib/formatNavLabel';
import {
  APP_SCROLL_REGION_DOM_ID,
  getAppScrollRegion,
} from '../lib/appScrollRegion';
import { HeaderSearchOverlay } from './HeaderSearchOverlay';
import type { Cart } from '../app/(main)/cart/types';

const HEADER_BG_HOME = 'bg-[#ffe5c2]';
const HEADER_BG_OTHER = 'bg-[#2F3F3D]';

/**
 * Desktop bar height — spacer matches fixed bar (`layout.tsx` min-h).
 * `min-h` prevents flex/scroll parents from shrinking the row below this height.
 */
const HEADER_DESKTOP_HEIGHT_CLASS = 'h-[104px] min-h-[104px] shrink-0';

/** Same numeric value as `HEADER_DESKTOP_HEIGHT_CLASS` — used to find which home section sits under the bar. */
const HEADER_BAR_HEIGHT_PX = 104;

/** Fixed header geometry matches scroll region `clientWidth` (scrollbar excluded), not full viewport. */
const HEADER_SCROLL_SYNC_LEFT_VAR = '--app-header-scroll-sync-left';
const HEADER_SCROLL_SYNC_WIDTH_VAR = '--app-header-scroll-sync-width';

type HomeHeaderSurface = 'cream' | 'dark';

function parseHomeHeaderSurface(
  value: string | undefined,
): HomeHeaderSurface | null {
  if (value === 'cream' || value === 'dark') return value;
  return null;
}

/**
 * Picks the home section whose vertical range contains the strip behind the fixed header.
 */
function pickHomeSectionSurface(sections: HTMLElement[]): HomeHeaderSurface | null {
  if (sections.length === 0) return null;
  const headerH = HEADER_BAR_HEIGHT_PX;
  for (const el of sections) {
    const r = el.getBoundingClientRect();
    if (r.top < headerH && r.bottom > headerH) {
      const s = parseHomeHeaderSurface(el.dataset.homeHeaderSurface);
      if (s) return s;
    }
  }
  let best = sections[0];
  let bestScore = Infinity;
  for (const el of sections) {
    const r = el.getBoundingClientRect();
    const mid = (r.top + r.bottom) / 2;
    const score = Math.abs(mid - headerH / 2);
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  return parseHomeHeaderSurface(best.dataset.homeHeaderSurface);
}

export function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const [homeHeaderSurface, setHomeHeaderSurface] =
    useState<HomeHeaderSurface>('cream');

  const isHomeCream = isHomePage && homeHeaderSurface === 'cream';
  const headerBg = isHomePage
    ? homeHeaderSurface === 'cream'
      ? HEADER_BG_HOME
      : HEADER_BG_OTHER
    : HEADER_BG_OTHER;

  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [currency, setCurrency] = useState(getStoredCurrency());
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navigationLinks = [
    { href: '/', label: t('home.header.navigation.home') },
    { href: '/products', label: t('home.header.navigation.delivery') },
    { href: '/about', label: t('home.header.navigation.about') },
    { href: '/coming-soon', label: t('home.header.navigation.vacancies') },
    { href: '/team', label: t('home.header.navigation.team') },
    { href: '/contact', label: t('home.header.navigation.contact') },
    { href: '/coming-soon', label: t('home.header.navigation.menu') },
  ];

  // Load cart total
  useEffect(() => {
    const loadCart = async () => {
      try {
        const cart: Cart | null = await fetchCart(isLoggedIn, t);
        if (cart && cart.totals) {
          setCartTotal(cart.totals.total);
        } else {
          setCartTotal(0);
        }
      } catch (error) {
        setCartTotal(0);
      }
    };

    loadCart();

    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCart();
    };

    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };

    const handleAuthUpdate = () => {
      loadCart();
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('currency-updated', handleCurrencyUpdate);
    window.addEventListener('auth-updated', handleAuthUpdate);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
      window.removeEventListener('auth-updated', handleAuthUpdate);
    };
  }, [isLoggedIn, t]);

  useEffect(() => {
    const root = document.documentElement;
    const clearSyncVars = () => {
      root.style.removeProperty(HEADER_SCROLL_SYNC_LEFT_VAR);
      root.style.removeProperty(HEADER_SCROLL_SYNC_WIDTH_VAR);
    };

    const scrollRoot = getAppScrollRegion();
    if (
      !scrollRoot ||
      scrollRoot === document.documentElement
    ) {
      clearSyncVars();
      return;
    }

    const applySync = () => {
      const r = scrollRoot.getBoundingClientRect();
      root.style.setProperty(HEADER_SCROLL_SYNC_LEFT_VAR, `${r.left}px`);
      root.style.setProperty(
        HEADER_SCROLL_SYNC_WIDTH_VAR,
        `${scrollRoot.clientWidth}px`,
      );
    };

    applySync();
    const ro = new ResizeObserver(() => {
      window.requestAnimationFrame(applySync);
    });
    ro.observe(scrollRoot);
    const onLayout = () => window.requestAnimationFrame(applySync);
    window.addEventListener('resize', onLayout);
    scrollRoot.addEventListener('scroll', onLayout, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onLayout);
      scrollRoot.removeEventListener('scroll', onLayout);
      clearSyncVars();
    };
  }, []);

  useEffect(() => {
    if (!isHomePage) {
      setHomeHeaderSurface('cream');
      return;
    }

    const getSections = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>('[data-home-header-surface]'),
      );

    const apply = () => {
      const next = pickHomeSectionSurface(getSections());
      if (next) setHomeHeaderSurface(next);
    };

    const scrollOpts = { passive: true } as const;
    const scrollCaptureOpts = { ...scrollOpts, capture: true } as const;
    const onScrollOrResize = () => {
      window.requestAnimationFrame(apply);
    };

    apply();
    const scrollRoot =
      document.getElementById(APP_SCROLL_REGION_DOM_ID) ?? document.body;
    scrollRoot.addEventListener('scroll', onScrollOrResize, scrollOpts);
    window.addEventListener('scroll', onScrollOrResize, scrollCaptureOpts);
    document.documentElement.addEventListener(
      'scroll',
      onScrollOrResize,
      scrollOpts,
    );
    window.addEventListener('resize', onScrollOrResize);

    const t = window.setTimeout(apply, 0);

    return () => {
      window.clearTimeout(t);
      scrollRoot.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, scrollCaptureOpts);
      document.documentElement.removeEventListener(
        'scroll',
        onScrollOrResize,
      );
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [isHomePage]);

  /** Same box on home for cream + dark so right-side icons align with the dark bar. */
  const logoBoxOther =
    'w-52 h-[96px] md:w-60 md:h-[100px] lg:w-72 lg:h-[100px]';

  return (
    <>
      <header
        className={`fixed top-0 z-app-header flex max-w-full min-w-0 [left:var(--app-header-scroll-sync-left,0px)] [width:var(--app-header-scroll-sync-width,100%)] items-center justify-between px-4 shadow-none transition-[height,box-shadow] duration-300 ease-in-out transition-colors duration-300 ease-in-out sm:px-6 lg:px-8 ${HEADER_DESKTOP_HEIGHT_CLASS} ${headerBg}`}
      >
      {/* Logo Section - Left: hero-logo on home, 121.png on other pages */}
      <div className="flex items-center gap-4 lg:gap-6">
        <Link
          prefetch
          href="/"
          className="flex shrink-0 items-center"
          aria-label={t('home.header.logoAlt')}
        >
          <div
            className={`relative shrink-0 transition-[width,height] duration-300 ease-out ${logoBoxOther}`}
          >
            <Image
              src={isHomeCream ? '/assets/hero/logo-kp.png' : '/hero-logo.png'}
              alt=""
              fill
              className="object-contain object-center"
              priority
              unoptimized
              sizes="(max-width: 768px) 208px, (max-width: 1024px) 240px, 288px"
            />
          </div>
        </Link>
      </div>

      {/* Navigation Menu - Center */}
      <nav className="hidden items-center gap-10 transition-[gap] duration-300 ease-out lg:flex">
        {navigationLinks.map((link) => (
          <Link
            key={link.label}
            prefetch
            href={link.href}
            className={`font-normal text-base leading-6 hover:opacity-80 transition-[font-size] duration-300 ease-out ${
              isHomeCream ? 'text-[#2f3f3d]' : 'text-[#ffe5c2]'
            }`}
          >
            {formatNavLabel(link.label)}
          </Link>
        ))}
      </nav>

      {/* Search and Login - Right */}
      <div className="flex items-center gap-5 transition-[gap] duration-300 ease-out">
        {/* Search — opens glass overlay with live results */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className={`relative flex h-10 w-[160px] items-center gap-2 rounded-full pl-2.5 pr-3 text-left transition-[height,width,padding] duration-300 ease-out hover:opacity-90 ${
              isHomeCream ? 'border border-black bg-[#ffe5c2]' : 'border border-white/30 bg-white/15'
            }`}
            aria-label={t('home.header.search.ariaLabel')}
            aria-expanded={isSearchOpen}
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={isHomeCream ? 'text-[#2f3f3d]' : 'text-white'}
              >
                <path
                  d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 14L11.1 11.1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span
              className={`min-w-0 flex-1 truncate text-sm font-medium ${isHomeCream ? 'text-[#2f3f3d]' : 'text-white'} ${!searchQuery.trim() ? (isHomeCream ? 'text-[rgba(47,63,61,0.65)]' : 'text-white/70') : ''}`}
            >
              {searchQuery.trim() ? searchQuery : t('home.header.search.placeholder')}
            </span>
          </button>
          <HeaderSearchOverlay
            open={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
        </div>

        {/* Cart Button */}
        <Link
          href="/cart"
          className={`rounded-[45px] flex items-center gap-1.5 bg-[#2F3F3D] hover:opacity-90 transition-opacity ${isLoggedIn ? 'h-10 min-w-[92px] px-3.5' : 'h-8 min-w-[80px] px-3'}`}
          aria-label={t('home.header.cart.ariaLabel') || 'Cart'}
        >
          <div className={`flex items-center justify-center ${isLoggedIn ? 'w-4 h-4' : 'w-3 h-3'}`}>
            <Image
              src="/assets/product-card/Icon.svg"
              alt=""
              width={16}
              height={16}
              className="object-contain max-w-full max-h-full"
              unoptimized
            />
          </div>
          <span className={`font-bold text-[#fff4de] ${isLoggedIn ? 'text-sm leading-5' : 'text-xs leading-4'}`}>
            {formatPrice(cartTotal, currency)}
          </span>
        </Link>

        {/* Login Button or User Icon with Dropdown */}
        {isLoggedIn ? (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="rounded-full h-10 w-10 flex items-center justify-center bg-[#ffe5c2] hover:opacity-90 transition-opacity"
              aria-label={t('home.header.profile.ariaLabel') || 'Profile'}
            >
              <Image
                src="/assets/product-card/439.png"
                alt=""
                width={40}
                height={40}
                className="object-contain rounded-full"
                unoptimized
              />
            </button>
            
            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-[#2f3f3d] hover:bg-gray-100 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      {t('common.navigation.profile') || 'Profile'}
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-[#2f3f3d] hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        {t('common.navigation.admin') || 'Admin'}
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-[#2f3f3d] hover:bg-gray-100 transition-colors"
                    >
                      {t('common.navigation.logout') || 'Logout'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className={`border px-3 py-1.5 rounded-full h-8 w-[100px] flex items-center justify-center font-semibold text-xs leading-4 tracking-[0.32px] transition-colors ${isHomeCream ? 'bg-[#2f3f3d] border-[#2f3f3d] text-white hover:bg-[#1f2f2d]' : 'bg-white/20 border-white/30 text-white hover:bg-white/30'}`}
          >
            {t('home.header.login')}
          </Link>
        )}
      </div>
    </header>
    </>
  );
}
