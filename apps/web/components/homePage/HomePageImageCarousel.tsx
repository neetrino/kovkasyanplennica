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

// Note: Images should be placed in /public/assets/carousel/ directory
// You can download them from Figma or use placeholder images
const carouselImages: CarouselImage[] = [
  {
    id: '1',
    src: '/assets/carousel/image-1.png',
    alt: 'Bar interior',
    width: 517,
    height: 690,
    position: 'left-large',
  },
  {
    id: '2',
    src: '/assets/carousel/image-2.png',
    alt: 'Architectural detail',
    width: 375,
    height: 749,
    position: 'right-top',
  },
  {
    id: '3',
    src: '/assets/carousel/image-3.png',
    alt: 'Fresh salad',
    width: 299,
    height: 431,
    position: 'right-top-small',
  },
  {
    id: '4',
    src: '/assets/carousel/image-4.png',
    alt: 'Martini glass',
    width: 749,
    height: 375,
    position: 'right-bottom',
  },
  {
    id: '5',
    src: '/assets/carousel/image-1.png',
    alt: 'Bar interior',
    width: 517,
    height: 690,
    position: 'left-large',
  },
];

export function HomePageImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselImages.length);
    }, 5000);

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
    <section className="relative w-full bg-[#2f3f3d] py-16 md:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Carousel Container */}
        <div className="relative">
          {/* Images Grid */}
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[350px]">
            {/* Left Large Image */}
            <div className="relative w-full h-[300px] md:h-[350px] lg:h-[400px] rounded-[10px] overflow-hidden">
              <Image
                src={currentImages[0].src}
                alt={currentImages[0].alt}
                fill
                className="object-cover rounded-[10px]"
                priority
                unoptimized
              />
            </div>

            {/* Right Side - Two Images Stacked */}
            <div className="flex flex-col gap-4">
              {/* Top Right - Two Small Images */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative w-full h-[150px] md:h-[170px] lg:h-[200px] rounded-[10px] overflow-hidden">
                  <Image
                    src={currentImages[1].src}
                    alt={currentImages[1].alt}
                    fill
                    className="object-cover rounded-[10px]"
                    unoptimized
                  />
                </div>
                <div className="relative w-full h-[150px] md:h-[170px] lg:h-[200px] rounded-[10px] overflow-hidden">
                  <Image
                    src={currentImages[2].src}
                    alt={currentImages[2].alt}
                    fill
                    className="object-cover rounded-[10px]"
                    unoptimized
                  />
                </div>
              </div>

              {/* Bottom Right - Large Image */}
              <div className="relative w-full h-[150px] md:h-[170px] lg:h-[200px] rounded-[10px] overflow-hidden">
                <Image
                  src={currentImages[3].src}
                  alt={currentImages[3].alt}
                  fill
                  className="object-cover rounded-[10px]"
                  unoptimized
                />
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="absolute left-0 right-0 top-[45%] -translate-y-1/2 flex items-center justify-between px-6 md:px-8 lg:px-12 pointer-events-none">
            <button
              onClick={goToPrevious}
              className="relative w-10 h-10 md:w-12 md:h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors pointer-events-auto shadow-lg"
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
              onClick={goToNext}
              className="relative w-10 h-10 md:w-12 md:h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors pointer-events-auto shadow-lg"
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

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-[6px] ${
                  index === currentIndex
                    ? 'bg-white/37 w-[17px] h-[8px]'
                    : 'bg-[#fadaac] w-[8px] h-[8px]'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

