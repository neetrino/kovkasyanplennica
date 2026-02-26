'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';

/**y
 * Mobile About — два блока (картинка + текст), заголовок О НАС, кнопка Узнать больше.
 */
export function MobileAbout() {
  const { t } = useTranslation();
  return (
    <section className="relative bg-[#ffe5c2] rounded-t-[45px] -mt-[26px] pt-10 pb-12 px-4 z-10">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-8 right-0 w-[280px] h-[315px]">
          <img
            src="/hero-vector-1.svg"
            alt=""
            width={280}
            height={315}
            className="w-full h-full object-contain"
            style={{ filter: 'brightness(0) opacity(0.4)' }}
            aria-hidden
          />
        </div>
        <div className="absolute bottom-8 left-0 w-[280px] h-[315px] rotate-180">
          <img
            src="/hero-vector-2.svg"
            alt=""
            width={280}
            height={315}
            className="w-full h-full object-contain"
            style={{ filter: 'brightness(0) opacity(0.4)' }}
            aria-hidden
          />
        </div>
      </div>

      <div className="relative z-10 max-w-[430px] mx-auto">
        <h2 className="text-[#2f3f3d] text-[53px] leading-[68px] font-light italic text-right pr-6 mb-6">
          {t('home.about.title')}
        </h2>
        <div className="relative w-[180px] h-[5px] mx-auto mb-8">
          <Image src="/assets/hero/Vector7.svg" alt="" fill className="object-contain grayscale" aria-hidden unoptimized />
        </div>

        {/* Блок 1: картинка слева, текст справа */}
        <div className="mb-10">
          <div className="relative w-full aspect-[296/243] rounded-tr-[58px] overflow-hidden mb-4">
            <Image
              src="/about.jpg"
              alt={t('home.about.interiorAlt')}
              fill
              className="object-cover"
              sizes="(max-width: 430px) 100vw, 296px"
              unoptimized
            />
          </div>
          <p className="text-[#252525] text-base leading-5">
            {t('home.about.description')}
          </p>
        </div>

        {/* Блок 2: текст слева, картинка справа */}
        <div className="mb-10">
          <div className="relative w-full max-w-[254px] aspect-[254/209] rounded-tl-[58px] overflow-hidden ml-auto mb-4">
            <Image
              src="/-165 3.png"
              alt={t('home.about.interiorAlt')}
              fill
              className="object-cover"
              sizes="254px"
              unoptimized
            />
          </div>
          <p className="text-[#252525] text-base leading-5 text-right">
            {t('home.about.description')}
          </p>
        </div>

        <div className="flex justify-center">
          <Link
            href="/about"
            className="bg-[#2f3f3d] text-white h-14 min-w-[246px] rounded-[70px] font-bold text-base flex items-center justify-center"
          >
            {t('home.about.learnMoreButton')}
          </Link>
        </div>
      </div>
    </section>
  );
}
