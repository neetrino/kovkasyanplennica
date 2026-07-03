'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';
import { DESKTOPS_ENABLED } from '@/lib/feature-flags';
import {
  buildHeroSrcSet,
  defaultHeroSrc,
  toOptimizedHeroUrl,
} from '@/lib/image-optimization';
import { toR2Url } from '@/lib/r2-assets';

/** Hero wordmark — 475×317 (~10 KB webp) */
const HERO_WORDMARK_WIDTH = 475;
const HERO_WORDMARK_HEIGHT = 317;

const HERO_BG_PATH = '/assets/hero/hero.png';
const HERO_PATTERN_PATH = '/assets/hero/hero-pattern-figma.png';

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
      {/* JW_06330 — LCP background (optimized WebP srcset) */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={defaultHeroSrc(HERO_BG_PATH)}
            srcSet={buildHeroSrcSet(HERO_BG_PATH)}
            sizes="100vw"
            alt=""
            fetchPriority="high"
            decoding="async"
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
            src={toOptimizedHeroUrl(HERO_PATTERN_PATH, 1200)}
            alt=""
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
      </div>

      <div className="relative z-10 flex w-full max-w-[1440px] flex-col items-center px-4 pb-16 pt-12 md:pt-16 xl:pt-[100px] xl:pb-16">
        {/* Vase — Figma 134:352 (170×257) */}
        <div className="relative h-[257px] w-[170px] shrink-0">
          <Image
            src={toR2Url('/assets/hero/hero-vase-figma.svg')}
            alt=""
            width={170}
            height={257}
            className="h-full w-full object-contain"
            unoptimized
          />
        </div>

        {/* Wordmark — brush title on dark hero; screen blend hides black plate */}
        <h1 id="hero-heading" className="mt-[31px] flex justify-center">
          <Image
            src={toR2Url('/assets/hero/hero-wordmark.webp')}
            alt={t('home.hero.logoAlt')}
            width={HERO_WORDMARK_WIDTH}
            height={HERO_WORDMARK_HEIGHT}
            className="h-auto w-[min(95vw,330px)] mix-blend-screen sm:w-[378px] md:w-[426px] xl:w-[475px]"
            priority
            sizes="(max-width: 640px) 330px, (max-width: 768px) 378px, (max-width: 1280px) 426px, 475px"
          />
        </h1>

        {/* CTAs — Figma 136:636, gap 10px */}
        <div className="mt-[31px] flex flex-row flex-wrap items-center justify-center gap-[10px]">
          {DESKTOPS_ENABLED && (
            <Link
              href="/desktops"
              className="flex h-14 w-full min-w-[190px] max-w-[280px] shrink-0 items-center justify-center rounded-full border border-solid border-[#fadaac] bg-[rgba(255,255,255,0.06)] px-6 backdrop-blur-[3.5px] text-base font-semibold tracking-[0.32px] text-[#fadaac] transition-colors hover:bg-[rgba(255,255,255,0.12)] sm:w-auto sm:max-w-none"
            >
              {t('home.hero.bookButton')}
            </Link>
          )}
          <Link
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
