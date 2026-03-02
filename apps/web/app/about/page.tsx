'use client';

import Image from 'next/image';
import { TeamCarousel } from '../../components/TeamCarousel';
import { useTranslation } from '../../lib/i18n-client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

const STATS = [
  { value: '5+', labelKey: 'about.stats.yearsLabel' },
  { value: '500+', labelKey: 'about.stats.productsLabel' },
  { value: '10K+', labelKey: 'about.stats.customersLabel' },
  { value: '98%', labelKey: 'about.stats.satisfactionLabel' },
];

/**
 * About Us page — styled to match the products page visual language:
 * dark #2F3F3D bg, union-decorative.png overlays, #fff4de headings, #7CB342 accent.
 */
export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-full bg-[#2F3F3D] relative">

      {/* ── Decorative overlays (same pattern as products page) ── */}
     
      <div
        className="absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[400px] md:w-[480px] lg:w-[560px] xl:w-[640px] aspect-square max-h-[640px] pointer-events-none z-0 opacity-50"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[320px] sm:w-[400px] md:w-[480px] lg:w-[560px] xl:w-[640px] aspect-square max-h-[640px] pointer-events-none z-0 opacity-50"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>

      {/* ══════════════════════════════════
          HERO — full-height image + overlay
          ══════════════════════════════════ */}
      <section className="relative w-full h-[60vh] min-h-[420px] md:h-[72vh] overflow-hidden">
        <Image
          src="https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=1"
          alt="About us"
          fill
          className="object-cover object-center"
          priority
          unoptimized
        />
        {/* gradient overlay — darker at bottom so content is readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2F3F3D]/60 via-[#2F3F3D]/50 to-[#2F3F3D]" />

        {/* Hero text */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 pb-8">
          <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.25em] text-[#7CB342] mb-4">
            {t('about.subtitle')}
          </p>
          <h1 className="text-[#fff4de] text-5xl md:text-7xl lg:text-8xl xl:text-[100px] font-light italic leading-tight mb-6">
            {t('about.title')}
          </h1>
          <div className="w-40 md:w-64 opacity-80">
            <Image
              src="/assets/hero/Vector7.svg"
              alt=""
              width={256}
              height={12}
              className="object-contain mx-auto"
              aria-hidden
              unoptimized
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          STORY — image + description
          ══════════════════════════════════ */}
      <section className="relative z-10 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Image — left side */}
            <div className="relative w-full h-[380px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl group">
              <Image
                src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&dpr=1"
                alt="Our team"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                unoptimized
              />
              {/* subtle green accent frame */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-[#7CB342]/30 pointer-events-none" />
              {/* bottom-left badge */}
              <div className="absolute bottom-6 left-6 bg-[#2F3F3D]/85 backdrop-blur-sm rounded-xl px-5 py-3 border border-[#7CB342]/40">
                <p className="text-[#7CB342] text-2xl font-light italic">5+</p>
                <p className="text-[#fff4de]/80 text-xs uppercase tracking-widest mt-0.5">
                  {t('about.stats.yearsLabel')}
                </p>
              </div>
            </div>

            {/* Text — right side */}
            <div className="space-y-6">
              <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.25em] text-[#7CB342]">
                {t('about.story.subtitle')}
              </p>
              <h2 className="text-[#fff4de] text-4xl md:text-5xl lg:text-6xl font-light italic leading-tight">
                {t('about.story.title')}
              </h2>
              <div className="w-24 h-[2px] bg-[#7CB342]" />
              <div className="space-y-4 text-[#fff4de]/70 text-base md:text-lg leading-relaxed">
                <p>{t('about.description.paragraph1')}</p>
                <p>{t('about.description.paragraph2')}</p>
                <p>{t('about.description.paragraph3')}</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          STATS
          ══════════════════════════════════ */}
      <section className="relative z-10 py-16 border-y border-[#3d504e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {STATS.map((stat) => (
              <div
                key={stat.labelKey}
                className="text-center px-4 py-6 rounded-xl bg-[#3d504e]/40 border border-[#3d504e] hover:border-[#7CB342]/50 transition-colors duration-300"
              >
                <p className="text-[#7CB342] text-4xl md:text-5xl font-light italic mb-2">
                  {stat.value}
                </p>
                <p className="text-[#fff4de]/60 text-xs uppercase tracking-widest">
                  {t(stat.labelKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          TEAM
          ══════════════════════════════════ */}
      <section className="relative z-10 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.25em] text-[#7CB342] mb-4">
              {t('about.team.subtitle')}
            </p>
            <h2 className="text-[#fff4de] text-4xl md:text-5xl lg:text-6xl font-light italic mb-6">
              {t('about.team.title')}
            </h2>
            <div className="w-24 h-[2px] bg-[#7CB342] mx-auto mb-8" />
            <p className="text-[#fff4de]/60 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              {t('about.team.description')}
            </p>
          </div>

          {/* Carousel */}
          <div className="max-w-6xl mx-auto">
            <TeamCarousel />
          </div>

        </div>
      </section>

    </div>
  );
}
