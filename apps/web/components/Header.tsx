'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useTranslation } from '../lib/i18n-client';
import { useAuth } from '../lib/auth/AuthContext';
import { fetchCart } from '../app/cart/cart-fetcher';
import { formatPrice, getStoredCurrency } from '../lib/currency';
import type { Cart } from '../app/cart/types';

export function Header() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [currency, setCurrency] = useState(getStoredCurrency());
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navigationLinks = [
    { href: '/', label: t('home.header.navigation.home') },
    { href: '/coming-soon', label: t('home.header.navigation.menu') },
    { href: '/coming-soon', label: t('home.header.navigation.about') },
    { href: '/coming-soon', label: t('home.header.navigation.vacancies') },
    { href: '/coming-soon', label: t('home.header.navigation.team') },
    { href: '/coming-soon', label: t('home.header.navigation.contact') },
    { href: '/coming-soon', label: t('home.header.navigation.delivery') },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

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

  return (
    <header className="relative w-full bg-[#ffe5c2] h-[106px] flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Logo Section - Left */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-32 h-32 md:w-36 md:h-36 lg:w-40 lg:h-40">
            <Image
              src="/assets/hero/logo-kp.png"
              alt={t('home.header.logoAlt')}
              width={160}
              height={160}
              className="object-contain"
              priority
              unoptimized
            />
          </div>
        
        </Link>
      </div>

      {/* Navigation Menu - Center */}
      <nav className="hidden lg:flex items-center gap-10">
        {navigationLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-[#2f3f3d] text-base font-normal leading-6 hover:opacity-80 transition-opacity"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Search and Login - Right */}
      <div className="flex items-center gap-5">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative">
          <div className="relative bg-[#ffe5c2] border border-black rounded-full h-10 w-[240px] flex items-center px-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('home.header.search.placeholder')}
              className="flex-1 bg-transparent text-[#2f3f3d] text-sm font-medium placeholder:text-[rgba(47,63,61,0.65)] outline-none pr-6"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-label={t('home.header.search.ariaLabel')}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#2f3f3d]"
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
            </button>
          </div>
        </form>

        {/* Cart Button */}
        <Link
          href="/coming-soon"
          className={`bg-[#2f3f3d] rounded-[45px] flex items-center gap-1.5 hover:bg-[#1f2f2d] transition-colors ${isLoggedIn ? 'h-10 px-2.5' : 'h-8 px-2'}`}
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
          <span className={`text-[#fff4de] font-bold ${isLoggedIn ? 'text-sm leading-5' : 'text-xs leading-4'}`}>
            {formatPrice(cartTotal, currency)}
          </span>
        </Link>

        {/* Login Button or User Icon with Dropdown */}
        {isLoggedIn ? (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="bg-[#2f3f3d] rounded-full h-10 w-10 flex items-center justify-center hover:bg-[#1f2f2d] transition-colors"
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
            className="bg-[#2f3f3d] border border-[#2f3f3d] text-white px-3 py-1.5 rounded-full h-8 w-[100px] flex items-center justify-center font-semibold text-xs leading-4 tracking-[0.32px] hover:bg-[#1f2f2d] transition-colors"
          >
            {t('home.header.login')}
          </Link>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="lg:hidden w-10 h-10 flex items-center justify-center text-[#2f3f3d]"
        aria-label={t('home.header.mobileMenu.ariaLabel')}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 12H21M3 6H21M3 18H21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </header>
  );
}
