'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTranslation } from '../../lib/i18n-client';

interface CarouselImage {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

const carouselImages: CarouselImage[] = [
  { id: '1', src: '/assets/carousel/image-1.png', alt: 'Bar interior', width: 517, height: 690 },
  { id: '2', src: '/assets/carousel/image-2.png', alt: 'Architectural detail', width: 375, height: 749 },
  { id: '3', src: '/assets/carousel/image-3.png', alt: 'Fresh salad', width: 299, height: 431 },
  { id: '4', src: '/assets/carousel/image-4.png', alt: 'Martini glass', width: 749, height: 375 },
  { id: '5', src: '/assets/carousel/image-1.png', alt: 'Bar interior', width: 517, height: 690 },
];

/**
 * Mobile Image Carousel — մոբայլ գլխավորի կարուսել, HomePageImageCarousel-ի նման։
 * Մեկ գլխավոր նկար սլայդով, նախ/հաջորդ և dots ინդիկատոր։
 */
export function MobileImageCarousel() {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev === 0 ? carouselImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev === carouselImages.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  const current = carouselImages[currentIndex];

  return (
    <section className="relative w-full bg-[#2f3f3d] -mt-[26px] pt-10 pb-12 px-4 z-10 overflow-hidden">
      <div className="relative max-w-[430px] mx-auto">
        {/* Գլխավոր նկար */}
        <div className="relative w-full aspect-[4/5] max-h-[380px] rounded-[10px] overflow-hidden">
          <Image
            src={current.src}
            alt={current.alt}
            fill
            className="object-cover rounded-[10px]"
            sizes="(max-width: 430px) 100vw, 430px"
            priority={currentIndex === 0}
            unoptimized
          />
        </div>

        {/* Նախ / Հաջորդ */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between px-1 pointer-events-none">
          <button
            type="button"
            onClick={goToPrevious}
            className="relative w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors pointer-events-auto shadow-lg"
            aria-label="Previous slide"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-180">
              <path d="M9 18L15 12L9 6" stroke="#2f3f3d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="relative w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors pointer-events-auto shadow-lg"
            aria-label="Next slide"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="#2f3f3d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-[6px] ${
                index === currentIndex ? 'bg-white/37 w-[17px] h-[8px]' : 'bg-[#fadaac] w-[8px] h-[8px]'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Выбрать стол + դեկորատիվ hero-vector-1 */}
        <div className="relative flex justify-center mt-12">
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[380px] h-[180px] pointer-events-none opacity-80">
            <img
              src="/assets/hero/decorative-pattern.svg"
              alt=""
              width={280}
              height={160}
              className="w-full h-full object-contain object-bottom"
              style={{ filter: 'brightness(0) opacity(0.5)' }}
              aria-hidden
            />
          </div>
          <Link
            href="/coming-soon"
            className="relative z-10 bg-[#FFF4DE] text-[#2f3f3d] h-14 min-w-[246px] max-w-full rounded-[70px] font-bold text-base flex items-center justify-center hover:opacity-95 transition-opacity"
          >
            {t('home.footer.booking.selectTableButton')}
          </Link>
        </div>
      </div>
    </section>
  );
}
