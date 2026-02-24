'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '../../lib/i18n-client';
import { ProductCard } from '../ProductCard';

interface MenuItem {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string | null;
  inStock: boolean;
  brand: {
    id: string;
    name: string;
  } | null;
  calories?: number;
  category?: string;
  labels?: Array<{
    id: string;
    type: 'text' | 'percentage';
    value: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    color: string | null;
  }>;
  compareAtPrice?: number | null;
  originalPrice?: number | null;
  globalDiscount?: number | null;
  discountPercent?: number | null;
  colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
}

interface FavoritesProps {
  items?: MenuItem[];
}

/**
 * Favorites Component
 * 
 * Секция "Наши фавориты" с карточками продуктов.
 * Отображает 8 карточек продуктов в сетке 2x4.
 */
export function Favorites({ items = [] }: FavoritesProps) {
  const { t } = useTranslation();

  // Используем реальные продукты или пустой массив
  const displayItems = items.slice(0, 8);

  return (
    <section className="relative bg-[#2f3f3d] overflow-hidden py-16 md:py-20 lg:py-24 rounded-t-[37px] -mt-[35px] z-10">
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] max-h-[800px] ">
          <img
            src="/assets/hero/union-decorative.png"
            alt=""
            className="w-full h-full object-contain"
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="text-center mb-12 md:mb-16 -mt-4">
          <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-light italic">
            {t('home.favorites.title')}
          </h2>
          {/* Vector7 декоративный паттерн под заголовком - из Figma */}
          <div className="relative w-[50%] max-w-[300px] h-[8px] md:h-[10px] lg:h-[12px] mt-4 mb-8 flex justify-center mx-auto">
            <Image
              src="/assets/hero/Vector7.svg"
              alt=""
              fill
              className="object-contain"
              aria-hidden="true"
              unoptimized
            />
          </div>
        </div>

        {/* Сетка с карточками продуктов - 2 ряда по 4 */}
        {displayItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 md:gap-x-8 gap-y-28 md:gap-y-32 mb-12 mt-24">
            {displayItems.map((item) => (
              <div key={item.id} className="flex justify-center">
                <ProductCard 
                  product={{
                    ...item,
                    labels: undefined,
                  }}
                  viewMode="grid-3"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-white/60">
            <p>{t('home.favorites.title')}</p>
          </div>
        )}

        {/* Кнопка "Смотреть меню" */}
        <div className="flex justify-center mt-20">
          <Link
            href="/menu"
            className="bg-[#75bf5e] text-white px-8 py-3.5 rounded-[70px] font-bold text-base tracking-wide hover:bg-[#65af4e] transition-colors duration-300 min-w-[246px] text-center"
          >
            {t('home.favorites.viewMenuButton')}
          </Link>
        </div>
      </div>
    </section>
  );
}

