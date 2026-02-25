'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';
import styles from './MobileBottomNav.module.css';

/**
 * Mobile Bottom Navigation — Figma bnb45, node-id=87-458.
 * ДОСТАВКА, ПОИСК, ГЛАВНАЯ (центр), КОРЗИНА, ПРОФИЛЬ.
 * Pixel-perfect match to design.
 */
export function MobileBottomNav() {
  const { t } = useTranslation();

  return (
    <div className={styles.bnb45} role="navigation" aria-label="Mobile navigation">
      {/* Bar background: rounded bottom corners (24px), semicircular cutout for Home (r=26) */}
      <svg
        className={styles.barShape}
        viewBox="0 -32 400 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M 24 88 L 376 88 Q 400 88 400 64 L 400 0 L 228 0 A 26 26 0 0 1 172 0 L 24 0 L 0 0 L 0 64 Q 0 88 24 88 Z"
          fill="#2f3f3d"
        />
      </svg>

      <div className={styles.navigationmenuLeftParent}>
        {/* Слева: ДОСТАВКА, ПОИСК */}
        <div className={styles.navigationmenuLeft}>
          <Link
            href="/coming-soon"
            className={styles.navigationmenuHome}
            aria-label={t('common.navigation.delivery')}
          >
            <Image
              className={styles.navigationmenuHomeChild}
              src="/assets/mobile-nav/delivery-icon.svg"
              width={27.4}
              height={21.5}
              alt=""
              unoptimized
            />
            <span className={styles.navLabel}>{t('home.header.navigation.delivery')}</span>
          </Link>
          <Link
            href="/search"
            className={styles.navigationmenuHome2}
            aria-label={t('common.buttons.search')}
          >
            <Image
              className={styles.vectorIcon}
              src="/assets/mobile-nav/search-icon.svg"
              width={30}
              height={22}
              alt=""
              unoptimized
            />
            <span className={styles.navLabel}>{t('home.header.navigation.search')}</span>
          </Link>
        </div>

        {/* Центр: подпись ГЛАВНАЯ под круглой кнопкой */}
        <span className={styles.centerLabel}>{t('home.header.navigation.home')}</span>

        {/* Справа: КОРЗИНА, ПРОФИЛЬ */}
        <div className={styles.navigationmenuRight}>
          <Link
            href="/cart"
            className={styles.navigationmenuHome3}
            aria-label={t('common.navigation.cart')}
          >
            <div className={styles.cart}>
              <Image
                className={styles.vuesaxlinearbagIcon}
                src="/assets/mobile-nav/cart-icon-muted.svg"
                width={24}
                height={24}
                alt=""
                unoptimized
              />
            </div>
            <span className={styles.navLabel}>{t('common.navigation.cart')}</span>
          </Link>
          <Link
            href="/profile"
            className={styles.navigationmenuHome3}
            aria-label={t('common.navigation.profile')}
          >
            <div className={styles.cart}>
              <Image
                className={styles.vuesaxlinearbagIcon}
                src="/assets/mobile-nav/profile-icon.svg"
                width={24}
                height={24}
                alt=""
                unoptimized
              />
            </div>
            <span className={styles.navLabel}>{t('common.navigation.profile')}</span>
          </Link>
        </div>

        {/* Центр: круглая кнопка ГЛАВНАЯ + wavy arc ring (#2F3F3D) как на референсе */}
        <Link
          href="/"
          className={styles.homeWrapper}
          aria-label={t('common.navigation.home')}
        >
          <span className={styles.homeArc} aria-hidden />
          <svg
            className={styles.homeRing}
            viewBox="0 0 76 76"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M38 2 a38 36 0 0 1 38 36 a38 36 0 0 1 -38 36 a38 36 0 0 1 -38 -36 a38 36 0 0 1 38 -36 Z M38 38 m-22 0 a22 22 0 1 1 44 0 a22 22 0 1 1 -44 0 Z"
              fill="#2f3f3d"
            />
          </svg>
          <div className={styles.home}>
            <Image
              src="/assets/mobile-nav/home-icon.svg"
              width={24}
              height={24}
              alt=""
              unoptimized
            />
          </div>
        </Link>
      </div>
    </div>
  );
}
