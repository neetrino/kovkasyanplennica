'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslation } from '../lib/i18n-client';

const NEETRINO_COMPANY_URL = 'https://neetrino.com/';

export function Footer() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isMenuPage = pathname === '/menu';
  
  return (
    <footer className={`${isMenuPage ? 'bg-[#ffe5c2]' : 'bg-[#2f3f3d]'} overflow-hidden relative`}>
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <img
          src="/assets/hero/decorative-pattern.svg"
          alt=""
          className="w-full h-full object-contain opacity-80 rotate-180 translate-y-36"
          aria-hidden
        />
      </div>

      {/* Booking Section */}
      <section className="py-16 md:py-20 lg:py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`${isMenuPage ? 'text-[#2f3f3d]' : 'text-white'} text-4xl md:text-5xl lg:text-6xl font-light italic mb-4`}>
            {t('home.footer.booking.title')}
           </h2>
          {/* Vector7 декоративный паттерн под заголовком - из Figma */}
          <div className="relative w-[50%] max-w-[300px] h-[8px] md:h-[10px] lg:h-[12px] mt-4 mb-6 flex justify-center mx-auto">
            <Image
              src="/assets/hero/Vector7.svg"
              alt=""
              fill
              className="object-contain"
              aria-hidden="true"
              unoptimized
            />
          </div>
          <p className={`${isMenuPage ? 'text-[#2f3f3d]/80' : 'text-white/80'} text-lg md:text-xl mb-8 font-light`}>
            {t('home.footer.booking.description')}
          </p>
          <Link
            href="/desktops"
            className={`inline-block ${isMenuPage ? 'bg-[#2f3f3d] text-[#ffe5c2] hover:bg-[#1f2f2d]' : 'bg-[#ffe5c2] text-[#2f3f3d] hover:bg-[#fadaac]'} px-8 md:px-12 py-3 md:py-4 rounded-full font-semibold text-base md:text-lg transition-colors`}
          >
            {t('home.footer.booking.selectTableButton')}
          </Link>
        </div>
      </section>

      {/* Footer Content */}
      <div className={`${isMenuPage ? 'bg-[#ffe5c2] border-[#2f3f3d]/10' : 'bg-[#2f3f3d] border-white/10'} border-t pt-12 pb-8`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12">
            {/* Left Column - Restaurant Info */}
            <div className="-mt-10 space-y-0 md:-mt-14">
              <div className="flex items-center gap-3">
                <div className="relative h-36 w-36 sm:h-40 sm:w-40 md:h-44 md:w-44 lg:h-48 lg:w-48">
                  <Image
                    src="/hero-logo.png"
                    alt={t('home.footer.logoAlt')}
                    width={162}
                    height={162}
                    className="h-full w-full object-contain"
                    unoptimized
                  />
                </div>
              </div>
              <div className="flex max-w-[300px] flex-col gap-4">
              <p
                className={`-mt-11 sm:-mt-12 md:-mt-8 ${isMenuPage ? 'text-[#2f3f3d]/70' : 'text-white/70'} text-sm leading-snug`}
              >
                <span className="block">{t('home.footer.descriptionLine1')}</span>
                <span className="block">{t('home.footer.descriptionLine2')}</span>
                <span className="block">{t('home.footer.descriptionLine3')}</span>
              </p>
              </div>
            </div>

            {/* Middle Column - Navigation */}
            <div>
              <h3 className={`${isMenuPage ? 'text-[#2f3f3d]' : 'text-white'} text-sm font-bold uppercase tracking-[0.7px] mb-4`}>
                {t('home.footer.navigation.title')}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/products" className={`${isMenuPage ? 'text-[#2f3f3d]/75 hover:text-[#2f3f3d]' : 'text-[#ececec] hover:text-white'} text-sm transition-colors`}>
                    {t('home.footer.navigation.menu')}
                  </Link>
                </li>
                <li>
                  <Link href="/about" className={`${isMenuPage ? 'text-[#2f3f3d]/75 hover:text-[#2f3f3d]' : 'text-[#ececec] hover:text-white'} text-sm transition-colors`}>
                    {t('home.footer.navigation.about')}
                  </Link>
                </li>
                <li>
                  <Link href="/vacancies" className={`${isMenuPage ? 'text-[#2f3f3d]/75 hover:text-[#2f3f3d]' : 'text-[#ececec] hover:text-white'} text-sm transition-colors`}>
                    {t('home.footer.navigation.vacancies')}
                  </Link>
                </li>
                <li>
                  <Link href="/coming-soon" className={`${isMenuPage ? 'text-[#2f3f3d]/75 hover:text-[#2f3f3d]' : 'text-[#ececec] hover:text-white'} text-sm transition-colors`}>
                    {t('home.footer.navigation.team')}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className={`${isMenuPage ? 'text-[#2f3f3d]/75 hover:text-[#2f3f3d]' : 'text-[#ececec] hover:text-white'} text-sm transition-colors`}>
                    {t('home.footer.navigation.contacts')}
                  </Link>
                </li>
                <li>
                  <Link href="/delivery" className={`${isMenuPage ? 'text-[#2f3f3d]/75 hover:text-[#2f3f3d]' : 'text-[#ececec] hover:text-white'} text-sm transition-colors`}>
                    {t('home.footer.navigation.delivery')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* КОНТАКТЫ Column */}
            <div>
              <h3 className={`${isMenuPage ? 'text-[#2f3f3d]' : 'text-white'} text-sm font-bold uppercase tracking-[0.7px] mb-4`}>
                {t('home.footer.contacts.title')}
              </h3>
              <ul className="space-y-4">
                <li className={`${isMenuPage ? 'text-[#2f3f3d]/75' : 'text-[#ececec]'} text-sm`}>
                  {t('home.footer.contacts.address')}
                </li>
                <li className={`${isMenuPage ? 'text-[#2f3f3d]/75' : 'text-[#ececec]'} text-sm`}>
                  <a href="tel:+79999990000" className={`${isMenuPage ? 'hover:text-[#2f3f3d]' : 'hover:text-white'} transition-colors`}>
                    {t('home.footer.contacts.phone')}
                  </a>
                </li>
                <li className={`${isMenuPage ? 'text-[#2f3f3d]/75' : 'text-[#ececec]'} text-sm`}>
                  <a href="tel:+73452288244" className={`${isMenuPage ? 'hover:text-[#2f3f3d]' : 'hover:text-white'} transition-colors`}>
                    {t('home.footer.contacts.deliveryPhone')}
                  </a>
                </li>
                <li className={`${isMenuPage ? 'text-[#2f3f3d]/75' : 'text-[#ececec]'} text-sm`}>
                  <a href="mailto:info@vkavkazan.ru" className={`${isMenuPage ? 'hover:text-[#2f3f3d]' : 'hover:text-white'} transition-colors`}>
                    {t('home.footer.contacts.email')}
                  </a>
                </li>
              </ul>
              <div className="mt-5">
                <a
                  href="https://www.instagram.com/reel/DWBtLxejGq8/?igsh=NWhmcnR5d3FoNGZs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex ${isMenuPage ? 'text-[#2f3f3d]/70 hover:text-[#2f3f3d]' : 'text-white/70 hover:text-white'} transition-colors`}
                  aria-label={t('home.footer.socialMedia.instagram')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
              </div>
            </div>

            {/* РЕЖИМ РАБОТЫ Column */}
            <div>
              <h3 className={`${isMenuPage ? 'text-[#2f3f3d]' : 'text-white'} text-sm font-bold uppercase tracking-[0.7px] mb-6`}>
                {t('home.footer.workingHours.title')}
              </h3>
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className={isMenuPage ? 'text-[#2f3f3d]/75' : 'text-[#ececec]'}>{t('home.footer.workingHours.weekdays')}</span>
                  <span className={isMenuPage ? 'text-[#2f3f3d]' : 'text-white'}>{t('home.footer.workingHours.weekdaysTime')}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className={isMenuPage ? 'text-[#2f3f3d]/75' : 'text-[#ececec]'}>{t('home.footer.workingHours.weekend')}</span>
                  <span className={isMenuPage ? 'text-[#2f3f3d]' : 'text-white'}>{t('home.footer.workingHours.weekendTime')}</span>
                </div>
              </div>
              <p className="text-[#FADAAC] text-xs mt-4">
                {t('home.footer.workingHours.deliveryInfo')}
              </p>
            </div>
          </div>

          {/* Bottom Line */}
          <div className={`border-t ${isMenuPage ? 'border-[#2f3f3d]/10' : 'border-white/10'} pt-6 mt-8`}>
            <div className="flex flex-col md:flex-row flex-wrap justify-center md:justify-start items-center gap-3 md:gap-6 text-sm">
              <a
                href={NEETRINO_COMPANY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`${isMenuPage ? 'text-[#2f3f3d]/60 hover:text-[#2f3f3d]' : 'text-white/60 hover:text-white'} text-[11px] md:text-xs text-center md:text-left mb-6 md:mb-0 md:mr-16 lg:mr-24 cursor-pointer transition-colors`}
              >
                Copyright © 2026 | All Rights Reserved, Created by Neetrino IT Company
              </a>
              <Link
                href="/delivery-terms"
                className={`${isMenuPage ? 'text-[#2f3f3d]/60 hover:text-[#2f3f3d]/80' : 'text-white/60 hover:text-white/80'} text-[11px] md:text-xs transition-colors`}
              >
                {t('home.footer.bottomLinks.deliveryPolicy')}
              </Link>
              <Link
                href="/terms"
                className={`${isMenuPage ? 'text-[#2f3f3d]/60 hover:text-[#2f3f3d]/80' : 'text-white/60 hover:text-white/80'} text-[11px] md:text-xs transition-colors`}
              >
                {t('home.footer.bottomLinks.terms')}
              </Link>
              <Link
                href="/privacy"
                className={`${isMenuPage ? 'text-[#2f3f3d]/60 hover:text-[#2f3f3d]/80' : 'text-white/60 hover:text-white/80'} text-[11px] md:text-xs transition-colors`}
              >
                {t('home.footer.bottomLinks.privacy')}
              </Link>
              <Link
                href="/terms"
                className={`${isMenuPage ? 'text-[#2f3f3d]/60 hover:text-[#2f3f3d]/80' : 'text-white/60 hover:text-white/80'} text-[11px] md:text-xs transition-colors whitespace-nowrap`}
              >
                {t('home.footer.bottomLinks.publicOffer')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
