'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface CarouselImage {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  position: 'left-large' | 'right-top' | 'right-bottom' | 'right-top-small';
}

const newFolderImageSources = [
  '/assets/New folder/JW_06812 1.webp',
  '/assets/New folder/JW_06330 1.webp',
  '/assets/New folder/JW_01463-редакт 1.webp',
  '/assets/New folder/JW_01347 1.webp',
  '/assets/New folder/JW_01522 1.webp',
  '/assets/New folder/JW_05698 1.webp',
  '/assets/New folder/JW_01369-редакт 1.webp',
];

const carouselImages: CarouselImage[] = [
  { id: '1', src: encodeURI(newFolderImageSources[0]), alt: 'Restaurant gallery image 1', width: 517, height: 690, position: 'left-large' },
  { id: '2', src: encodeURI(newFolderImageSources[1]), alt: 'Restaurant gallery image 2', width: 375, height: 749, position: 'right-top' },
  { id: '3', src: encodeURI(newFolderImageSources[2]), alt: 'Restaurant gallery image 3', width: 299, height: 431, position: 'right-top-small' },
  { id: '4', src: encodeURI(newFolderImageSources[3]), alt: 'Restaurant gallery image 4', width: 749, height: 375, position: 'right-bottom' },
  { id: '5', src: encodeURI(newFolderImageSources[4]), alt: 'Restaurant gallery image 5', width: 517, height: 690, position: 'left-large' },
  { id: '6', src: encodeURI(newFolderImageSources[5]), alt: 'Restaurant gallery image 6', width: 517, height: 690, position: 'right-top' },
  { id: '7', src: encodeURI(newFolderImageSources[6]), alt: 'Restaurant gallery image 7', width: 517, height: 690, position: 'right-bottom' },
];

const AUTO_PLAY_INTERVAL_MS = 3000;

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
      className="relative -mt-px w-full overflow-hidden bg-[#2f3f3d] pt-0 pb-16 md:pb-24"
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
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg transition-colors hover:bg-white pointer-events-auto md:h-12 md:w-12"
              aria-label="Previous slide"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="rotate-180"
              >
                <path
                  d="M9 18L15 12L9 6"
                  stroke="#2f3f3d"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg transition-colors hover:bg-white pointer-events-auto md:h-12 md:w-12"
              aria-label="Next slide"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 18L15 12L9 6"
                  stroke="#2f3f3d"
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

