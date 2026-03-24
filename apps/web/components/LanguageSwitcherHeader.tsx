'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { LANGUAGES, type LanguageCode, getStoredLanguage, setStoredLanguage } from '../lib/language';

const ChevronDownIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const getLanguageIcon = (_code: LanguageCode): React.ReactNode => (
  <Image
    src="https://flagfactoryshop.com/image/cache/catalog/products/flags/national/mockups/russia_coa-600x400.jpg"
    alt="Russian"
    width={25}
    height={25}
    className="rounded"
    unoptimized
  />
);

const getLanguageColor = (_code: LanguageCode, isActive: boolean): string => {
  if (isActive) {
    return 'bg-red-50 border-red-200';
  }
  return 'bg-white border-transparent';
};

export function LanguageSwitcherHeader() {
  const [showMenu, setShowMenu] = useState(false);
  const [currentLang, setCurrentLang] = useState<LanguageCode>('ru');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentLang(getStoredLanguage());
    const handleLanguageUpdate = () => {
      setCurrentLang(getStoredLanguage());
    };
    window.addEventListener('language-updated', handleLanguageUpdate);
    return () => {
      window.removeEventListener('language-updated', handleLanguageUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const changeLanguage = (langCode: LanguageCode) => {
    if (typeof window !== 'undefined' && currentLang !== langCode) {
      setShowMenu(false);
      setCurrentLang(langCode);
      setStoredLanguage(langCode);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        aria-expanded={showMenu}
        className="flex items-center gap-1 sm:gap-2 bg-transparent md:bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-gray-800 transition-colors"
      >
        <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center text-base sm:text-lg leading-none">
          {getLanguageIcon(currentLang)}
        </span>
        <span className="text-xs sm:text-sm font-medium">{LANGUAGES[currentLang].name}</span>
        <ChevronDownIcon />
      </button>
      {showMenu && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {Object.values(LANGUAGES).map((lang) => {
            const isActive = currentLang === lang.code;
            const icon = getLanguageIcon(lang.code);
            const colorClass = getLanguageColor(lang.code, isActive);

            return (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                disabled={isActive}
                className={`w-full text-left px-4 py-3 text-sm transition-all duration-150 border-l-4 ${
                  isActive
                    ? `${colorClass} text-gray-900 font-semibold cursor-default`
                    : 'text-gray-700 hover:bg-gray-50 cursor-pointer border-transparent hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">{icon}</span>
                  <div className="flex-1 flex items-center justify-between">
                    <span className={isActive ? 'font-semibold' : 'font-medium'}>{lang.nativeName}</span>
                    <span className={`text-xs ml-2 ${isActive ? 'text-gray-700 font-semibold' : 'text-gray-500'}`}>
                      {lang.code.toUpperCase()}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
