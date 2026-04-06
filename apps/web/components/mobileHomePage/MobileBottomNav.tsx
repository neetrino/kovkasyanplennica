'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchCart } from '@/app/(main)/cart/cart-fetcher';
import type { Cart } from '@/app/(main)/cart/types';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '../../lib/i18n-client';
import { HeaderSearchOverlay } from '../HeaderSearchOverlay';
import { NavCartIcon, NavHomeIcon, NavProfileIcon, NavSearchIcon } from './MobileBottomNavIcons';

/**
 * Mobile bottom navigation — Figma (nav-surface, chef FAB, icons).
 * Shown on all routes under the main layout (lg:hidden).
 */
const PREFETCH_ROUTES = ['/', '/mobile', '/products', '/cart', '/profile'] as const;

export function MobileBottomNav() {
  const { t } = useTranslation();
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const homeHref = pathname === '/mobile' ? '/mobile' : '/';
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadCount = async () => {
      try {
        const cart: Cart | null = await fetchCart(isLoggedIn, t);
        setCartItemCount(cart?.itemsCount ?? 0);
      } catch {
        setCartItemCount(0);
      }
    };

    loadCount();
    const onCartOrAuth = () => {
      void loadCount();
    };
    window.addEventListener('cart-updated', onCartOrAuth);
    window.addEventListener('auth-updated', onCartOrAuth);
    return () => {
      window.removeEventListener('cart-updated', onCartOrAuth);
      window.removeEventListener('auth-updated', onCartOrAuth);
    };
  }, [isLoggedIn, t]);

  useEffect(() => {
    for (const route of PREFETCH_ROUTES) {
      router.prefetch(route);
    }
  }, [router]);

  const isHomeActive = pathname === '/' || pathname === '/mobile';
  const isSearchActive =
    isSearchOpen || pathname === '/search' || pathname.startsWith('/search/');
  const isProductsActive = pathname === '/products' || pathname.startsWith('/products/');
  const isCartActive = pathname === '/cart' || pathname.startsWith('/cart/');
  const isProfileActive = pathname === '/profile' || pathname.startsWith('/profile/');

  return (
    <>
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto block w-full max-w-[375px] lg:hidden">
      <div className="relative h-[162px]">
        <div className="absolute inset-x-0 bottom-0 h-[128px] overflow-hidden ">
          <Image
            src="/assets/mobile-home/nav-surface.svg"
            alt=""
            fill
            priority
            aria-hidden
            className="object-fill bg-transparent"
          />
        </div>
        <Link
          href="/products"
          prefetch
          aria-label={t('home.header.navigation.delivery')}
          aria-current={isProductsActive ? 'page' : undefined}
          className={`absolute left-1/2 top-5 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-[#042628] shadow-[0_8px_20px_rgba(4,38,40,0.24)] transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#75bf5e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2f3f3d] ${
            isProductsActive ? 'ring-2 ring-[#75bf5e] ring-offset-2 ring-offset-[#2f3f3d]' : ''
          }`}
        >
          <Image src="/assets/mobile-home/nav-chef.svg" alt="" width={24} height={24} aria-hidden />
        </Link>
        <div className="absolute inset-x-0 bottom-[28px] flex items-center justify-between px-[30px]">
          <Link prefetch href={homeHref} aria-label={t('common.navigation.home')} className="flex h-12 w-12 items-center justify-center">
            <NavHomeIcon active={isHomeActive} />
          </Link>
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label={t('common.buttons.search')}
            aria-expanded={isSearchOpen}
            className="flex h-12 w-12 items-center justify-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F3F3D]/40"
          >
            <NavSearchIcon active={isSearchActive} />
          </button>
          <span className="h-12 w-12" aria-hidden />
          <Link
            prefetch
            href="/cart"
            aria-label={
              cartItemCount > 0
                ? `${t('common.navigation.cart')}, ${cartItemCount}`
                : t('common.navigation.cart')
            }
            className="relative flex h-12 w-12 items-center justify-center"
          >
            <NavCartIcon active={isCartActive} />
            {cartItemCount > 0 && (
              <span className="pointer-events-none absolute -right-0.5 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#C62828] px-1 text-[10px] font-bold leading-none text-white">
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
          </Link>
          <Link prefetch href="/profile" aria-label={t('common.navigation.profile')} className="flex h-12 w-12 items-center justify-center">
            <NavProfileIcon active={isProfileActive} />
          </Link>
        </div>
      </div>
    </div>
    <HeaderSearchOverlay
      open={isSearchOpen}
      onClose={() => setIsSearchOpen(false)}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
    />
    </>
  );
}
