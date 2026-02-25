import Image from 'next/image';
import { Ruslan_Display } from 'next/font/google';

const ruslanDisplay = Ruslan_Display({
  subsets: ['latin', 'cyrillic'],
  weight: '400',
});

const ASSETS_BASE_PATH = '/assets/coming-soon';

export function ComingSoon() {
  return (
    <section className="relative overflow-hidden bg-[#ffe5c2] min-h-screen">
      {/* Decorative Pattern Background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/assets/hero/decorative-pattern.svg"
          alt=""
          fill
          className="object-cover opacity-30 rotate-180"
          priority={false}
          unoptimized
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-2 sm:px-4 lg:px-6 pt-0 sm:pt-0">
        <div className="relative mx-auto h-[480px] w-full max-w-[720px] sm:h-[540px] lg:h-[620px]">
          <Image
            src={`${ASSETS_BASE_PATH}/dish.png`}
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 720px"
            className="object-contain"
            unoptimized
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center pt-6 sm:pt-8 lg:pt-10">
            <h1
              className={`${ruslanDisplay.className} text-center text-[#2f3f3d] text-[56px] leading-[0.72] sm:text-[88px] lg:text-[128px]`}
            >
              Мы почти
              <br />
              готовы!
            </h1>

          
          </div>
        </div>
      </div>
    </section>
  );
}


