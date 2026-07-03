'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { HOME_CAROUSEL_IMAGE_HREFS } from '@/lib/home/home-carousel-images';

interface CarouselImage {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  position: 'left-large' | 'right-top' | 'right-bottom' | 'right-top-small';
}

const carouselImages: CarouselImage[] = [
  { id: '1', src: HOME_CAROUSEL_IMAGE_HREFS[0], alt: 'Restaurant gallery image 1', width: 517, height: 690, position: 'left-large' },
  { id: '2', src: HOME_CAROUSEL_IMAGE_HREFS[1], alt: 'Restaurant gallery image 2', width: 375, height: 749, position: 'right-top' },
  { id: '3', src: HOME_CAROUSEL_IMAGE_HREFS[2], alt: 'Restaurant gallery image 3', width: 299, height: 431, position: 'right-top-small' },
  { id: '4', src: HOME_CAROUSEL_IMAGE_HREFS[3], alt: 'Restaurant gallery image 4', width: 749, height: 375, position: 'right-bottom' },
  { id: '5', src: HOME_CAROUSEL_IMAGE_HREFS[4], alt: 'Restaurant gallery image 5', width: 517, height: 690, position: 'left-large' },
  { id: '6', src: HOME_CAROUSEL_IMAGE_HREFS[5], alt: 'Restaurant gallery image 6', width: 517, height: 690, position: 'right-top' },
  { id: '7', src: HOME_CAROUSEL_IMAGE_HREFS[6], alt: 'Restaurant gallery image 7', width: 517, height: 690, position: 'right-bottom' },
];

const AUTO_PLAY_INTERVAL_MS = 3000;

const CAROUSEL_ARROW_BUTTON_CLASS =
  'group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/95 shadow-[0_4px_14px_rgba(0,0,0,0.18)] pointer-events-auto transition-[transform,box-shadow,background-color,border-color] duration-200 ease-out hover:scale-105 hover:border-white/50 hover:bg-white hover:shadow-[0_8px_24px_rgba(0,0,0,0.22)] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 md:h-12 md:w-12';

export function HomePageImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-rotate carousel with slower pacing
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselImages.length);
    }, AUTO_PLAY_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? carouselImages.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prevIndex) => 
      prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  // Get current slide images
  const getCurrentSlideImages = () => {
    const startIndex = currentIndex;
    const images = [];
    
    // Left large image
    const leftImage = carouselImages[startIndex % carouselImages.length];
    images.push({ ...leftImage, position: 'left-large' });
    
    // Right top images (2 small images)
    const rightTop1 = carouselImages[(startIndex + 1) % carouselImages.length];
    const rightTop2 = carouselImages[(startIndex + 2) % carouselImages.length];
    images.push({ ...rightTop1, position: 'right-top-small' });
    images.push({ ...rightTop2, position: 'right-top' });
    
    // Right bottom image
    const rightBottom = carouselImages[(startIndex + 3) % carouselImages.length];
    images.push({ ...rightBottom, position: 'right-bottom' });
    
    return images;
  };

  const currentImages = getCurrentSlideImages();

  return (
    <section
      className="relative isolate [contain:layout] -mt-px w-full overflow-hidden bg-[#2f3f3d] pt-0 pb-16 md:pb-24"
      data-home-header-surface="dark"
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Grid + arrows: arrows anchored to image grid only (not dots) — stable vertical center */}
        <div className="relative">
          <div className="relative grid min-h-[350px] grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
            {/* Left Large Image */}
            <div className="relative h-[300px] w-full shrink-0 overflow-hidden rounded-[10px] md:h-[350px] lg:h-[400px]">
              <Image
                src={currentImages[0].src}
                alt={currentImages[0].alt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover rounded-[10px]"
                priority
                fetchPriority="high"
                decoding="async"
                unoptimized
              />
            </div>

            {/* Right Side - Two Images Stacked */}
            <div className="flex min-h-0 w-full shrink-0 flex-col gap-4">
              {/* Top Right - Two Small Images */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative h-[150px] w-full shrink-0 overflow-hidden rounded-[10px] md:h-[170px] lg:h-[200px]">
                  <Image
                    src={currentImages[1].src}
                    alt={currentImages[1].alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover rounded-[10px]"
                    priority
                    fetchPriority="high"
                    decoding="async"
                    unoptimized
                  />
                </div>
                <div className="relative h-[150px] w-full shrink-0 overflow-hidden rounded-[10px] md:h-[170px] lg:h-[200px]">
                  <Image
                    src={currentImages[2].src}
                    alt={currentImages[2].alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover rounded-[10px]"
                    priority
                    fetchPriority="high"
                    decoding="async"
                    unoptimized
                  />
                </div>
              </div>

              {/* Bottom Right - Large Image */}
              <div className="relative h-[150px] w-full shrink-0 overflow-hidden rounded-[10px] md:h-[170px] lg:h-[200px]">
                <Image
                  src={currentImages[3].src}
                  alt={currentImages[3].alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover rounded-[10px]"
                  priority
                  fetchPriority="high"
                  decoding="async"
                  unoptimized
                />
              </div>
            </div>
          </div>

          {/* Navigation Arrows — positioned vs grid wrapper only */}
          <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[1] flex -translate-y-1/2 items-center justify-between px-6 md:px-8 lg:px-12">
            <button
              type="button"
              onClick={goToPrevious}
              className={CAROUSEL_ARROW_BUTTON_CLASS}
              aria-label="Previous slide"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="rotate-180 transition-transform duration-200 ease-out group-hover:translate-x-[-1px]"
                aria-hidden
              >
                <path
                  d="M9 18L15 12L9 6"
                  className="stroke-[#2f3f3d] transition-colors duration-200 group-hover:stroke-[#1f2a28]"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={goToNext}
              className={CAROUSEL_ARROW_BUTTON_CLASS}
              aria-label="Next slide"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-transform duration-200 ease-out group-hover:translate-x-px"
                aria-hidden
              >
                <path
                  d="M9 18L15 12L9 6"
                  className="stroke-[#2f3f3d] transition-colors duration-200 group-hover:stroke-[#1f2a28]"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

          {/* Dots: active = white core + halo; inactive = cream (larger, tighter gap) */}
          <div className="mt-8 flex items-center justify-center gap-1">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToSlide(index)}
                className="flex h-11 w-11 shrink-0 items-center justify-center"
                aria-label={`Go to slide ${index + 1}`}
              >
                {index === currentIndex ? (
                  <span className="relative flex h-9 w-9 items-center justify-center">
                    <span
                      className="absolute size-[22px] rounded-full bg-white/35"
                      aria-hidden
                    />
                    <span className="relative size-3 rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.28)]" />
                  </span>
                ) : (
                  <span className="size-4 rounded-full bg-[#fadaac] opacity-90 transition-opacity duration-300 hover:opacity-100" />
                )}
              </button>
            ))}
          </div>
      </div>
    </section>
  );
}

