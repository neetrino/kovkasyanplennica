'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useTranslation } from '../lib/i18n-client';

export function Header() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const navigationLinks = [
    { href: '/', label: t('home.header.navigation.home') },
    { href: '/menu', label: t('home.header.navigation.menu') },
    { href: '/about', label: t('home.header.navigation.about') },
    { href: '/vacancies', label: t('home.header.navigation.vacancies') },
    { href: '/team', label: t('home.header.navigation.team') },
    { href: '/contact', label: t('home.header.navigation.contact') },
    { href: '/delivery', label: t('home.header.navigation.delivery') },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

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
            key={link.href}
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
          <div className="relative bg-[#ffe5c2] border border-black rounded-full h-12 w-[290px] flex items-center px-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('home.header.search.placeholder')}
              className="flex-1 bg-transparent text-[#2f3f3d] text-base font-medium placeholder:text-[rgba(47,63,61,0.65)] outline-none pr-8"
            />
            <button
              type="submit"
              className="absolute right-4 top-1/2 -translate-y-1/2"
              aria-label={t('home.header.search.ariaLabel')}
            >
              <svg
                width="16"
                height="16"
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

        {/* Login Button */}
        <Link
          href="/login"
          className="bg-[#2f3f3d] border border-[#2f3f3d] text-white px-5 py-2.5 rounded-full h-12 w-[172px] flex items-center justify-center font-bold text-base leading-6 tracking-[0.32px] hover:bg-[#1f2f2d] transition-colors"
        >
          {t('home.header.login')}
        </Link>
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
