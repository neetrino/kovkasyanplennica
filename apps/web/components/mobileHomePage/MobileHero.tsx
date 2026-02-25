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
 * Mobile Hero — логотип, название, кнопки Заказать / Забронировать.
 * Соответствует Figma mobile hero (node 54-985).
 */
export function MobileHero() {
  const { t } = useTranslation();
  return (
    <section className="relative bg-[#ffe5c2] overflow-hidden pt-8 pb-12 px-4">
      {/* Декоративный паттерн фона */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 flex items-start justify-center -translate-y-[13%]">
          <div className="relative w-[280%] h-[15%] min-h-[200px]">
            <Image
              src="/assets/hero/decorative-pattern.svg"
              alt=""
              fill
              className="object-contain"
              aria-hidden
              unoptimized
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Логотип */}
        <div className="relative w-[59%] max-w-[252px] aspect-[252/350] mb-4">
          <Image
            src="/assets/hero/121.png"
            alt={t('home.hero.logoAlt')}
            fill
            className="object-contain"
            priority
            unoptimized
            sizes="(max-width: 430px) 59vw, 252px"
          />
        </div>

        {/* Подзаголовок под логотипом (декоративная полоска из Figma) */}
        <div className="relative w-[54%] max-w-[234px] h-[4px] mb-6">
          <Image
            src="/assets/hero/Vector7.svg"
            alt=""
            fill
            className="object-contain"
            aria-hidden
            unoptimized
          />
        </div>

        {/* Кнопки: колонкой на мобильном */}
        <div className="w-full max-w-[385px] flex flex-col gap-2">
          <Link
            href="/coming-soon"
            className="w-full h-14 rounded-full bg-[#2f3f3d] border border-[#2f3f3d] text-white font-bold text-base tracking-[0.02em] flex items-center justify-center"
          >
            {t('home.hero.orderButton')}
          </Link>
          <Link
            href="/coming-soon"
            className="w-full h-14 rounded-full border-2 border-[#2f3f3d] text-[#2f3f3d] font-semibold text-base tracking-[0.02em] flex items-center justify-center"
          >
            {t('home.hero.bookButton')}
          </Link>
        </div>
      </div>
    </section>
  );
}
