'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';

/**
 * About Component
 * 
 * Секция "О нас" для главной страницы.
 * Включает два блока с изображениями интерьера ресторана и текстовым описанием.
 * Стилизована в соответствии с дизайном Figma.
 */
export function About() {
  const { t } = useTranslation();
  return (
    <section className="relative bg-[#ffe5c2] overflow-hidden py-16 md:py-24 lg:py-32 rounded-t-[47px] -mt-[45px] z-10">
      {/* Декоративные паттерны на фоне - как в Hero */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Вектор 1 - верхний правый угол, ближе к центру */}
        <div className="absolute top-8 right-8 md:top-12 md:right-12 lg:top-16 lg:right-16 w-[280px] h-[315px] md:w-[350px] md:h-[385px] lg:w-[420px] lg:h-[455px] ">
          <Image
            src="/hero-vector-1.svg"
            alt=""
            fill
            className="object-contain"
            aria-hidden="true"
            unoptimized
          />
        </div>
        
        {/* Вектор 2 - нижний левый угол, ближе к центру */}
        <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 lg:bottom-16 lg:left-16 w-[280px] h-[315px] md:w-[350px] md:h-[385px] lg:w-[420px] lg:h-[455px] rotate-180">
          <Image
            src="/hero-vector-2.svg"
            alt=""
            fill
            className="object-contain"
            aria-hidden="true"
            unoptimized
          />
        </div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Первая секция: Заголовок сверху, изображение слева, текст справа */}
        <div className="mb-16 md:mb-24">
          {/* Заголовок "О НАС" - центрированный сверху */}
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-[#2f3f3d] text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              {t('home.about.title')}
            </h2>
            {/* Vector7 декоративный паттерн под заголовком - из Figma */}
            <div className="relative w-[50%] max-w-[300px] h-[8px] md:h-[10px] lg:h-[12px] mt-4 mb-6 flex justify-center mx-auto">
              <Image
                src="/assets/hero/Vector7.svg"
                alt=""
                fill
                className="object-contain grayscale"
                aria-hidden="true"
                unoptimized
              />
            </div>
          </div>

          {/* Контент: изображение слева, текст справа */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Изображение интерьера - слева */}
            <div className="relative w-[713px] h-[762px] md:w-[462px] md:h-[762px] lg:w-[463px] lg:h-[300px] ml-4 md:ml-8 lg:ml-4">
              <div className="relative w-full h-full rounded-tr-[67px] overflow-hidden">
                <Image
                  src="/about.jpg"
                  alt={t('home.about.interiorAlt')}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
            </div>

            {/* Текст - справа */}
            <div className="flex flex-col justify-center">
              <p className="text-[#2f3f3d] text-base md:text-lg lg:text-xl leading-relaxed">
                {t('home.about.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Вторая секция: Текст слева, изображение справа */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Заголовок "О НАС" - слева */}
          <div className="lg:col-span-1 mb-8 lg:mb-0">
            <h2 className="text-[#2f3f3d] text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              {t('home.about.title')}
            </h2>
            
            {/* Текст */}
            <p className="text-[#2f3f3d] text-base md:text-lg lg:text-xl leading-relaxed">
              {t('home.about.description')}
            </p>
          </div>

          {/* Изображение интерьера - справа */}
          <div className="relative w-[713px] h-[762px] md:w-[462px] md:h-[762px] lg:w-[463px] lg:h-[300px] mr-4 md:mr-8 lg:mr-16 xl:mr-20">
          <div className="relative w-full h-full  overflow-hidden">
              <Image
                src="/-165 3.png"
                alt={t('home.about.interiorAlt')}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>
          </div>
        </div>

        {/* Кнопка "Узнать больше" - центрированная */}
        <div className="flex justify-center mt-12 md:mt-16 lg:mt-20">
          <Link
            href="/about"
            className="bg-[#3A4F48] text-white px-8 md:px-12 py-3 md:py-4 rounded-full font-semibold text-base md:text-lg tracking-wide hover:bg-[#2f3f3d] transition-all duration-300 min-w-[200px] text-center"
          >
            {t('home.about.learnMoreButton')}
          </Link>
        </div>
      </div>
    </section>
  );
}

