'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  image: string;
  social: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'Mark Jance',
    position: 'CEO / FOUNDER',
    image: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2',
    social: { facebook: '#', twitter: '#', linkedin: '#', instagram: '#' },
  },
  {
    id: '2',
    name: 'Aviana Plummer',
    position: 'CMO / CO-FOUNDER',
    image: 'https://images.pexels.com/photos/3184405/pexels-photo-3184405.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2',
    social: { facebook: '#', twitter: '#', linkedin: '#', instagram: '#' },
  },
  {
    id: '3',
    name: 'Braydon Wilkerson',
    position: 'HEAD OF SALES',
    image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2',
    social: { facebook: '#', twitter: '#', linkedin: '#', instagram: '#' },
  },
  {
    id: '4',
    name: 'Kristin Watson',
    position: 'LEAD DESIGNER',
    image: 'https://images.pexels.com/photos/3184398/pexels-photo-3184398.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2',
    social: { facebook: '#', twitter: '#', linkedin: '#', instagram: '#' },
  },
  {
    id: '5',
    name: 'Alex Morgan',
    position: 'CTO / CO-FOUNDER',
    image: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2',
    social: { facebook: '#', twitter: '#', linkedin: '#', instagram: '#' },
  },
];

/**
 * Team members carousel with dark theme matching the products page visual language.
 */
export function TeamCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(4);

  useEffect(() => {
    const updateVisibleCards = () => {
      const width = window.innerWidth;
      if (width < 640) setVisibleCards(1);
      else if (width < 1024) setVisibleCards(2);
      else if (width < 1280) setVisibleCards(3);
      else setVisibleCards(4);
    };
    updateVisibleCards();
    window.addEventListener('resize', updateVisibleCards);
    return () => window.removeEventListener('resize', updateVisibleCards);
  }, []);

  useEffect(() => {
    const maxIndex = Math.max(0, TEAM_MEMBERS.length - visibleCards);
    setCurrentIndex((prev) => Math.min(prev, maxIndex));
  }, [visibleCards]);

  const maxIndex = Math.max(0, TEAM_MEMBERS.length - visibleCards);

  const goToPrevious = () =>
    setCurrentIndex((prev) => (prev === 0 ? maxIndex : prev - 1));

  const goToNext = () =>
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));

  const goToSlide = (index: number) => setCurrentIndex(index);

  return (
    <div className="relative w-full">

      {/* Carousel track */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * (100 / visibleCards)}%)` }}
        >
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.id}
              className="flex-shrink-0 px-3"
              style={{ width: `${100 / visibleCards}%` }}
            >
              <div className="group bg-[#3d504e]/60 border border-[#3d504e] hover:border-[#7CB342]/60 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-[#7CB342]/10">

                {/* Photo */}
                <div className="relative w-full aspect-square overflow-hidden">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    unoptimized
                  />
                  {/* hover overlay */}
                  <div className="absolute inset-0 bg-[#2F3F3D]/0 group-hover:bg-[#2F3F3D]/20 transition-colors duration-300" />
                </div>

                {/* Info */}
                <div className="p-5 text-center">
                  <h3 className="text-[#fff4de] text-lg font-semibold mb-1">{member.name}</h3>
                  <p className="text-[#7CB342] text-xs font-semibold uppercase tracking-widest mb-4">
                    {member.position}
                  </p>

                  {/* Social links */}
                  <div className="flex justify-center gap-2">
                    {member.social.facebook && (
                      <a
                        href={member.social.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name} Facebook`}
                        className="w-8 h-8 rounded-full bg-[#2F3F3D] border border-[#3d504e] hover:border-[#7CB342] flex items-center justify-center text-[#fff4de]/60 hover:text-[#7CB342] transition-all duration-200"
                      >
                        <Facebook size={14} />
                      </a>
                    )}
                    {member.social.twitter && (
                      <a
                        href={member.social.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name} Twitter`}
                        className="w-8 h-8 rounded-full bg-[#2F3F3D] border border-[#3d504e] hover:border-[#7CB342] flex items-center justify-center text-[#fff4de]/60 hover:text-[#7CB342] transition-all duration-200"
                      >
                        <Twitter size={14} />
                      </a>
                    )}
                    {member.social.linkedin && (
                      <a
                        href={member.social.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name} LinkedIn`}
                        className="w-8 h-8 rounded-full bg-[#2F3F3D] border border-[#3d504e] hover:border-[#7CB342] flex items-center justify-center text-[#fff4de]/60 hover:text-[#7CB342] transition-all duration-200"
                      >
                        <Linkedin size={14} />
                      </a>
                    )}
                    {member.social.instagram && (
                      <a
                        href={member.social.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name} Instagram`}
                        className="w-8 h-8 rounded-full bg-[#2F3F3D] border border-[#3d504e] hover:border-[#7CB342] flex items-center justify-center text-[#fff4de]/60 hover:text-[#7CB342] transition-all duration-200"
                      >
                        <Instagram size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {TEAM_MEMBERS.length > visibleCards && (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            aria-label="Previous team member"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 sm:-translate-x-5 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-[#fff4de] border border-white/20 hover:border-[#7CB342]/60 flex items-center justify-center transition-all duration-200 hover:scale-110"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goToNext}
            aria-label="Next team member"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 sm:translate-x-5 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-[#fff4de] border border-white/20 hover:border-[#7CB342]/60 flex items-center justify-center transition-all duration-200 hover:scale-110"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dot indicators */}
      {TEAM_MEMBERS.length > visibleCards && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-[#7CB342] w-8'
                  : 'bg-[#fff4de]/30 hover:bg-[#fff4de]/50 w-2'
              }`}
            />
          ))}
        </div>
      )}

    </div>
  );
}
