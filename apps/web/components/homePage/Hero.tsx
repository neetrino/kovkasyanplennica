'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Ruslan_Display } from 'next/font/google';
import { useTranslation } from '../../lib/i18n-client';

const ruslanDisplay = Ruslan_Display({
  subsets: ['latin', 'cyrillic'],
  weight: '400',
});

/**
 * Desktop home hero — aligned to Figma HOME (node 134:256): JW_06330 photo (134:607),
 * header scrim (136:608), PATTERN 1 (134:268), vase (134:352), wordmark (134:325), CTAs (136:636).
 */
export function Hero() {
  const { t } = useTranslation();

  return (
    <section
      className="relative flex min-h-[809px] justify-center overflow-hidden"
      data-home-header-surface="dark"
      aria-labelledby="hero-heading"
    >
      {/* JW_06330 — full width; starts below fixed header (no negative margin / no upward crop) */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/hero/hero.png"
            alt=""
            className="absolute inset-0 size-full object-cover object-[center_70%]"
          />
        </div>
      </div>

      {/* PATTERN 1 — from top of hero section (below header), clipped by overflow-hidden */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-[2] h-[1109px] max-h-full w-[min(2365px,260vw)] max-w-none -translate-x-1/2"
        aria-hidden
      >
        <div className="relative h-full w-full">
          <Image
            src="/assets/hero/hero-pattern-figma.png"
            alt=""
            fill
            className="object-cover object-center"
            priority
            unoptimized
            sizes="100vw"
          />
        </div>
      </div>

      <div className="relative z-10 flex w-full max-w-[1440px] flex-col items-center px-4 pb-16 pt-12 md:pt-16 xl:pt-[100px] xl:pb-16">
        {/* Vase — Figma 134:352 (170×257) */}
        <div className="relative h-[257px] w-[170px] shrink-0">
          <Image
            src="/assets/hero/hero-vase-figma.svg"
            alt=""
            width={170}
            height={257}
            className="h-full w-full object-contain"
            priority
            unoptimized
          />
        </div>

        {/* Restaurant name — text wordmark (i18n), light on photo */}
        <h1
          id="hero-heading"
          className={`${ruslanDisplay.className} mt-[31px] max-w-[475px] text-center text-[#fadaac] drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]`}
        >
          <span className="block text-4xl font-normal tracking-tight sm:text-5xl md:text-6xl xl:text-7xl">
            {t('home.hero.restaurantName')}
          </span>
          <span className="mt-1 block text-2xl font-light lowercase italic sm:text-3xl md:text-4xl lg:text-5xl">
            {t('home.hero.restaurantSubtitle')}
          </span>
        </h1>

        {/* CTAs — Figma 136:636, gap 10px */}
        <div className="mt-[31px] flex flex-row flex-wrap items-center justify-center gap-[10px]">
          <Link
            prefetch
            href="/desktops"
            className="flex h-14 w-full min-w-[190px] max-w-[280px] shrink-0 items-center justify-center rounded-full border border-solid border-[#fadaac] bg-[rgba(255,255,255,0.06)] px-6 backdrop-blur-[3.5px] text-base font-semibold tracking-[0.32px] text-[#fadaac] transition-colors hover:bg-[rgba(255,255,255,0.12)] sm:w-auto sm:max-w-none"
          >
            {t('home.hero.bookButton')}
          </Link>
          <Link
            prefetch
            href="/products"
            className="flex h-14 w-full min-w-[190px] max-w-[280px] shrink-0 items-center justify-center rounded-full border border-solid border-[#fadaac] bg-[#fadaac] px-6 text-base font-bold tracking-[0.32px] text-[#2f3f3d] transition-colors hover:bg-[#f5d49a] sm:w-auto sm:max-w-none"
          >
            {t('home.hero.orderButton')}
          </Link>
        </div>
      </div>
    </section>
  );
}
