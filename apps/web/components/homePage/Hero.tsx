'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';

/**
 * Hero Component
 * 
 * Главная секция главной страницы с логотипом, названием ресторана
 * и кнопками действий. Включает декоративные паттерны на фоне.
 */
export function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative bg-[#ffe5c2] overflow-hidden min-h-[809px] flex items-center justify-center">
      {/* Декоративные паттерны на фоне */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
     

       

        {/* Декоративный паттерн (Group 1000002324) - увеличенный и центрированный, сдвинут вверх */}
        <div className="absolute inset-[-20%] flex items-start justify-center pt-[-10%]">
          <div className="relative w-[130%] h-[100%] -translate-y-[13%]">
            <Image
              src="/assets/hero/decorative-pattern.svg"
              alt=""
              fill
              className="object-contain"
              aria-hidden="true"
              unoptimized
            />
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-16 md:py-24">
        {/* Логотип - точно как в Figma */}
        <div className="mb-8 md:mb-10 w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 xl:w-96 xl:h-96 relative ">
          <Image
            src="/assets/hero/121.png"
            alt={t('home.hero.logoAlt')}
            width={392}
            height={292}
            className="object-contain w-full h-full"
            priority
            unoptimized
          />
        </div>

        {/* Название ресторана - точно как в Figma */}
        <h1 className="text-center mb-12 md:mb-16">
          <span className="block text-[#2f3f3d] text-4xl md:text-2xl lg:text-2xl xl:text-7xl font-ravie text-3xl mb-2 tracking-tight">
            {t('home.hero.restaurantName')}
          </span>
          <span className="block text-[#2f3f3d] text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-light italic lowercase">
            {t('home.hero.restaurantSubtitle')}
          </span>
        </h1>

        {/* Кнопки действий */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-center justify-center w-full max-w-md px-4">
          {/* Кнопка "Забронировать" */}
          <Link
            href="/booking"
            className="w-full sm:w-auto bg-transparent border-2 border-[#2f3f3d] text-[#2f3f3d] px-6 md:px-8 py-3 md:py-3.5 rounded-full font-semibold text-sm md:text-base tracking-[0.32px] hover:bg-[#2f3f3d] hover:text-white transition-all duration-300 min-w-[190px] text-center"
          >
            {t('home.hero.bookButton')}
          </Link>

          {/* Кнопка "Заказать" */}
          <Link
            href="/menu"
            className="w-full sm:w-auto bg-[#2f3f3d] border-2 border-[#2f3f3d] text-white px-6 md:px-8 py-3 md:py-3.5 rounded-full font-bold text-sm md:text-base tracking-[0.32px] hover:bg-[#1f2f2d] transition-all duration-300 min-w-[190px] text-center"
          >
            {t('home.hero.orderButton')}
          </Link>
        </div>
      </div>
    </section>
  );
}
