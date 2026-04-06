'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '../../lib/i18n-client';

/**
 * Mobile bottom navigation — Figma (nav-surface, chef FAB, icons).
 * Shown on all routes under the main layout (lg:hidden).
 */
export function MobileBottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname() ?? '';
  const homeHref = pathname === '/mobile' ? '/mobile' : '/';

  const isHomeActive = pathname === '/' || pathname === '/mobile';
  const isSearchActive = pathname === '/search' || pathname.startsWith('/search/');
  const isCartActive = pathname === '/cart' || pathname.startsWith('/cart/');
  const isProfileActive = pathname === '/profile' || pathname.startsWith('/profile/');

  return (
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
        <div className="absolute left-1/2 top-5 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-[#042628] shadow-[0_8px_20px_rgba(4,38,40,0.24)]">
          <Image src="/assets/mobile-home/nav-chef.svg" alt="" width={24} height={24} aria-hidden />
        </div>
        <div className="absolute inset-x-0 bottom-[28px] flex items-center justify-between px-[30px]">
          <Link href={homeHref} aria-label={t('common.navigation.home')} className="flex h-12 w-12 items-center justify-center">
            <Image
              src={isHomeActive ? '/assets/mobile-home/nav-home-active.svg' : '/assets/mobile-home/nav-home.svg'}
              alt=""
              width={24}
              height={24}
            />
          </Link>
          <Link href="/search" aria-label={t('common.buttons.search')} className="flex h-12 w-12 items-center justify-center">
            <Image
              src={isSearchActive ? '/assets/mobile-home/nav-search-active.svg' : '/assets/mobile-home/nav-search.svg'}
              alt=""
              width={24}
              height={24}
            />
          </Link>
          <span className="h-12 w-12" aria-hidden />
          <Link href="/cart" aria-label={t('common.navigation.cart')} className="flex h-12 w-12 items-center justify-center">
            <Image
              src={isCartActive ? '/assets/mobile-home/nav-cart-active.svg' : '/assets/mobile-home/nav-cart.svg'}
              alt=""
              width={24}
              height={24}
            />
          </Link>
          <Link href="/profile" aria-label={t('common.navigation.profile')} className="flex h-12 w-12 items-center justify-center">
            <Image
              src={isProfileActive ? '/assets/mobile-home/nav-profile-active.svg' : '/assets/mobile-home/nav-profile.svg'}
              alt=""
              width={24}
              height={24}
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
