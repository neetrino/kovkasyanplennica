'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';
import { ProductCard } from '../ProductCard';

interface MenuItem {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string | null;
  inStock: boolean;
  brand: { id: string; name: string } | null;
  calories?: number;
  category?: string;
  labels?: unknown[];
  compareAtPrice?: number | null;
  originalPrice?: number | null;
  discountPercent?: number | null;
  colors?: unknown[];
}

interface MobileFavoritesProps {
  items?: MenuItem[];
}

/**
 * Mobile Favorites — заголовок НАШИ ФАВОРИТЫ, 2×2 ProductCard, кнопка Смотреть меню.
 */
export function MobileFavorites({ items = [] }: MobileFavoritesProps) {
  const { t } = useTranslation();
  const displayItems = items.slice(0, 4);

  return (
    <>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-0 top-0 w-full max-w-[500px] h-[503px] mix-blend-screen mt-44">
          <Image src="/assets/hero/union-decorative.png" alt="" fill className="object-contain" aria-hidden unoptimized />
        </div>
      </div>

      <div className="relative z-10 px-4 max-w-[430px] mx-auto">
        <h2 className="text-[#fff4de] text-[41px] leading-[51px] font-light italic text-center mb-4">
          {t('home.favorites.title')}
        </h2>
        <div className="relative w-[180px] h-[5px] mx-auto mb-6">
          <Image src="/assets/hero/Vector7.svg" alt="" fill className="object-contain" aria-hidden unoptimized />
        </div>

        {displayItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-20 mb-6 mt-24">
            {displayItems.map((item) => (
              <div key={item.id} className="flex justify-center">
                <ProductCard product={{ ...item, labels: undefined }} viewMode="grid-3" compactHeight />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[#fff4de]/70">{t('home.favorites.title')}</div>
        )}

        <div className="flex justify-center mt-14">
          <Link
            href="/coming-soon"
            className="bg-[#75bf5e] text-white h-14 min-w-[246px] rounded-[70px] font-bold text-base flex items-center justify-center"
          >
            {t('home.favorites.viewMenuButton')}
          </Link>
        </div>
      </div>
    </>
  );
}
