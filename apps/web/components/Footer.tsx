'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslation } from '../lib/i18n-client';

export function Footer() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isMenuPage = pathname === '/menu' || pathname === '/coming-soon';
  
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
            href="/booking"
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
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-24 h-24 md:w-32 md:h-32">
                  <Image
                    src="/hero-logo.png"
                    alt={t('home.footer.logoAlt')}
                    width={128}
                    height={128}
                    className="object-contain"
                    unoptimized
                  />
                </div>
              
              </div>
              <p className={`${isMenuPage ? 'text-[#2f3f3d]/70' : 'text-white/70'} text-sm leading-relaxed max-w-[200px]`}>
                {t('home.footer.description')}
              </p>
              {/* Social Media Icons */}
              <div className="flex items-center gap-4 mt-6">
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${isMenuPage ? 'text-[#2f3f3d]/70 hover:text-[#2f3f3d]' : 'text-white/70 hover:text-white'} transition-colors`}
                  aria-label={t('home.footer.socialMedia.telegram')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.09-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                  </svg>
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${isMenuPage ? 'text-[#2f3f3d]/70 hover:text-[#2f3f3d]' : 'text-white/70 hover:text-white'} transition-colors`}
                  aria-label={t('home.footer.socialMedia.instagram')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${isMenuPage ? 'text-[#2f3f3d]/70 hover:text-[#2f3f3d]' : 'text-white/70 hover:text-white'} transition-colors`}
                  aria-label={t('home.footer.socialMedia.vk')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.785 16.241s.336-.039.508-.238c.155-.18.15-.52.15-.52s-.022-1.514.675-1.738c.688-.22 1.57 1.48 2.502 2.133.699.49 1.227.38 1.227.38l2.497-.035s1.308-.084.688-1.108c-.051-.082-.361-.75-1.855-2.417-1.567-1.73-1.354-1.45.53-4.444.363-.73 1.64-2.54.18-2.54l-2.58.016s-.19-.026-.33.057c-.14.083-.23.277-.23.277s-.415 1.11-.902 2.055c-1.09 2.11-1.525 2.22-1.702 2.09-.41-.3-.308-.96-.308-1.476 0-1.605.242-2.274-.473-2.447-.237-.057-.41-.095-1.014-.1-.776-.01-1.43.003-1.802.19-.25.125-.44.4-.323.416.146.02.476.09.65.33.224.31.216.998.216.998s.13 1.92-.3 2.156c-.296.164-.703-.17-1.58-2.27-.448-1.35-.63-1.84-.63-1.84s-.052-.31-.145-.477c-.113-.2-.32-.27-.32-.27l-2.44.016s-.365.01-.498.17c-.12.145-.01.445-.01.445s1.88 4.42 4.002 6.65c1.95 1.98 4.17 1.85 4.17 1.85h1.01z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Middle Column - Navigation */}
            <div>
              <h3 className={`${isMenuPage ? 'text-[#2f3f3d]' : 'text-white'} text-sm font-bold uppercase tracking-[0.7px] mb-4`}>
                {t('home.footer.navigation.title')}
              </h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/" className={`${isMenuPage ? 'text-[#2f3f3d]/75 hover:text-[#2f3f3d]' : 'text-[#ececec] hover:text-white'} text-sm transition-colors`}>
                    {t('home.footer.navigation.home')}
                  </Link>
                </li>
                <li>
                  <Link href="/coming-soon" className={`${isMenuPage ? 'text-[#2f3f3d]/75 hover:text-[#2f3f3d]' : 'text-[#ececec] hover:text-white'} text-sm transition-colors`}>
                    {t('home.footer.navigation.restaurantMenu')}
                  </Link>
                </li>
                <li>
                  <Link href="/wine" className={`${isMenuPage ? 'text-[#2f3f3d]/75 hover:text-[#2f3f3d]' : 'text-[#ececec] hover:text-white'} text-sm transition-colors`}>
                    {t('home.footer.navigation.wineCard')}
                  </Link>
                </li>
                <li>
                  <Link href="/delivery" className={`${isMenuPage ? 'text-[#2f3f3d]/75 hover:text-[#2f3f3d]' : 'text-[#ececec] hover:text-white'} text-sm transition-colors`}>
                    {t('home.footer.navigation.foodDelivery')}
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
                  <a href="mailto:info@vkavkazan.ru" className={`${isMenuPage ? 'hover:text-[#2f3f3d]' : 'hover:text-white'} transition-colors`}>
                    {t('home.footer.contacts.email')}
                  </a>
                </li>
              </ul>
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
              <p className={`${isMenuPage ? 'text-[#2f3f3d]/60' : 'text-white/60'} text-xs mt-4`}>
                {t('home.footer.workingHours.deliveryInfo')}
              </p>
            </div>
          </div>

          {/* Bottom Line */}
          <div className={`border-t ${isMenuPage ? 'border-[#2f3f3d]/10' : 'border-white/10'} pt-6 mt-8`}>
            <div className="flex flex-col md:flex-row justify-center md:justify-start items-center gap-4 md:gap-6 text-sm">
              <Link href="/privacy" className={`${isMenuPage ? 'text-[#2f3f3d]/60 hover:text-[#2f3f3d]/80' : 'text-white/60 hover:text-white/80'} text-xs md:text-sm transition-colors`}>
                {t('home.footer.bottomLinks.privacy')}
              </Link>
              <Link href="/terms" className={`${isMenuPage ? 'text-[#2f3f3d]/60 hover:text-[#2f3f3d]/80' : 'text-white/60 hover:text-white/80'} text-xs md:text-sm transition-colors`}>
                {t('home.footer.bottomLinks.terms')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
