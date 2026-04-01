'use client';

import { TeamCarousel } from '@/components/TeamCarousel';
import { useTranslation } from '@/lib/i18n-client';

/** Bottom anchor union decorative — same as vacancies page */
const UNION_DECORATIVE_BOX_BOTTOM =
  'w-[300px] sm:w-[380px] md:w-[460px] lg:w-[520px] xl:w-[580px] aspect-square max-h-[580px]';

/**
 * Team page shell: vacancies-style background (#2F3F3D, hero vectors, union bottom).
 */
export function TeamPageClient() {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-full bg-[#2F3F3D] relative min-h-[60vh]">
      <div
        className="pointer-events-none absolute top-10 left-0 z-[2] w-[min(160px,36vw)] sm:w-[180px] md:w-[240px] select-none"
        aria-hidden
      >
        <img src="/hero-vector-2.svg" alt="" className="w-full h-auto object-contain object-left-top" />
      </div>
      <div
        className="pointer-events-none absolute top-10 right-0 z-[2] w-[min(160px,36vw)] sm:w-[180px] md:w-[240px] select-none"
        aria-hidden
      >
        <img
          src="/hero-vector-2.svg"
          alt=""
          className="w-full h-auto object-contain object-right-top scale-x-[-1]"
        />
      </div>

      <div
        className={`pointer-events-none absolute -bottom-20 left-1/2 z-[1] -translate-x-1/2 opacity-90 sm:-bottom-28 md:-bottom-72 ${UNION_DECORATIVE_BOX_BOTTOM}`}
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="h-full w-full object-contain" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[80px] sm:pt-[110px] pb-16 relative z-10">
        <header className="text-center mb-12 md:mb-16">
          <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.25em] text-[#7CB342] mb-3">
            {t('about.team.subtitle')}
          </p>
          <h1
            className="text-[#fff4de] text-4xl sm:text-5xl md:text-6xl font-light leading-tight"
            style={{ fontFamily: "'Sansation Light', sans-serif" }}
          >
            {t('about.team.title')}
          </h1>
        </header>

        <p className="text-center text-[#fff4de]/70 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-12 md:mb-16">
          {t('about.team.description')}
        </p>

        <div className="max-w-6xl mx-auto">
          <TeamCarousel />
        </div>
      </div>
    </div>
  );
}
