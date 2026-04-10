'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ABOUT_STORY_FIRST_KEYS, ABOUT_STORY_SECOND_KEYS } from '../../lib/about-story-home-keys';
import { useTranslation } from '../../lib/i18n-client';

const ABOUT_HOME_IMAGE_FIRST = encodeURI('/assets/New folder/JW_01347 1.webp');
const ABOUT_HOME_IMAGE_SECOND = encodeURI('/assets/New folder/JW_01369-редакт 1.webp');

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
    <section
      className="relative bg-[#ffe5c2] overflow-hidden py-16 md:py-24 lg:py-32 rounded-t-[47px] -mt-[45px] z-10"
      data-home-header-surface="cream"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Первая секция: Заголовок сверху, изображение слева, текст справа */}
        <div className="mb-16 md:mb-24">
          {/* Заголовок "О НАС" - центрированный сверху */}
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-[#2f3f3d] text-6xl md:text-7xl lg:text-8xl xl:text-[103px] font-light italic leading-[128px]">
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
                  src={ABOUT_HOME_IMAGE_FIRST}
                  alt={t('home.about.interiorAlt')}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
            </div>

            {/* Story copy from about.description (paragraphs 1–2) */}
            <div className="flex flex-col justify-center space-y-4">
              {ABOUT_STORY_FIRST_KEYS.map((key) => (
                <p
                  key={key}
                  className="text-[#2f3f3d] text-base md:text-lg lg:text-xl leading-relaxed"
                >
                  {t(`about.description.${key}`)}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Вторая секция: Текст слева, изображение справа */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Заголовок "О НАС" - слева */}
          <div className="lg:col-span-1 mb-8 lg:mb-0">
          <h2 className="text-[#2f3f3d] text-4xl md:text-7xl lg:text-8xl xl:text-[103px] font-light italic leading-[128px]">
              {t('home.about.title')}
            </h2>
            
            {/* Story copy from about.description (paragraphs 3–5) */}
            <div className="space-y-4">
              {ABOUT_STORY_SECOND_KEYS.map((key) => (
                <p key={key} className="text-[#2f3f3d] text-base md:text-lg lg:text-xl leading-relaxed">
                  {t(`about.description.${key}`)}
                </p>
              ))}
            </div>
          </div>

          {/* Изображение интерьера - справа */}
          <div className="relative w-[713px] h-[762px] md:w-[462px] md:h-[762px] lg:w-[463px] lg:h-[300px] mr-4 md:mr-8 lg:mr-16 xl:mr-20 translate-x-3 md:translate-x-4 lg:translate-x-6">
          <div className="relative w-full h-full rounded-tl-[67px] overflow-hidden">
              <Image
                src={ABOUT_HOME_IMAGE_SECOND}
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
            prefetch
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

