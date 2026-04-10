'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';

/**
 * Mobile Hero — логотип, название, кнопки Заказать / Забронировать.
 * Соответствует Figma mobile hero (node 54-985).
 */
export function MobileHero() {
  const { t } = useTranslation();
  return (
    <section
      className="relative overflow-hidden pt-8 pb-12 px-4"
      data-home-header-surface="dark"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <Image
          src="/assets/hero/hero.png"
          alt=""
          fill
          className="object-cover object-center"
          priority
          unoptimized
          sizes="100vw"
        />
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
            href="/products"
            className="flex h-14 w-full items-center justify-center rounded-full border border-solid border-[#fadaac] bg-[#fadaac] text-base font-bold tracking-[0.32px] text-[#2f3f3d]"
          >
            {t('home.hero.orderButton')}
          </Link>
          <Link
            href="/desktops"
            className="flex h-14 w-full items-center justify-center rounded-full border border-solid border-[#fadaac] bg-[rgba(255,255,255,0.06)] backdrop-blur-[3.5px] text-base font-semibold tracking-[0.32px] text-[#fadaac]"
          >
            {t('home.hero.bookButton')}
          </Link>
        </div>
      </div>
    </section>
  );
}
