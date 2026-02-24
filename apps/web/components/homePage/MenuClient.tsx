'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
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

interface MenuClientProps {
  initialItems?: MenuItem[];
  totalPages?: number;
}

/**
 * Menu Client Component
 * 
 * Client-side часть секции меню с пагинацией
 */
export function MenuClient({ initialItems = [], totalPages = 0 }: MenuClientProps) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [loading, setLoading] = useState(false);

  // Fetch products when page changes
  useEffect(() => {
    const fetchProducts = async () => {
      if (currentPage === 1 && initialItems.length > 0) {
        // Use initial items for first page
        return;
      }

      setLoading(true);
      try {
        const language = 'en';
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '4',
          lang: language,
        });

        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          (typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000");

        const targetUrl = `${baseUrl}/api/v1/products?${params.toString()}`;
        const res = await fetch(targetUrl, { cache: "no-store" });

        if (res.ok) {
          const response = await res.json();
          if (response.data && Array.isArray(response.data)) {
            const products = response.data.map((p: any) => ({
              id: p.id,
              slug: p.slug,
              title: p.title,
              price: p.price,
              compareAtPrice: p.compareAtPrice ?? p.originalPrice ?? null,
              image: p.image ?? null,
              inStock: p.inStock ?? true,
              brand: p.brand ?? null,
              colors: p.colors ?? [],
              labels: p.labels ?? [],
              calories: p.calories ?? Math.floor(Math.random() * 200) + 100,
              category: p.brand?.name || p.category || t('home.menu.categoryFallback'),
            }));
            setItems(products);
          }
        }
      } catch (e) {
        console.error("❌ [MENU CLIENT] Error fetching products:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, initialItems]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };
  return (
    <>
      {/* Декоративный паттерн Union - точно как в Figma (node-id=1-855) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-[calc(16.67%+66px)] top-[26px] w-[828.824px] h-[840px] mix-blend-screen ">
          <Image
            src="/assets/hero/union-decorative.png"
            alt=""
            fill
            className="object-contain"
            aria-hidden="true"
            unoptimized
          />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* Заголовок секции */}
        <div className="text-center mb-4 md:mb-6 -mt-4">
          <h2 className="text-[#fff4de] text-6xl md:text-7xl lg:text-8xl xl:text-[103px] font-light italic leading-[128px] mb-2">
            {t('home.menu.title')}
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

        {/* Карточки продуктов */}
        {loading ? (
          <div className="flex justify-center items-center py-12 mt-56">
            <div className="text-[#fff4de] text-lg">{t('home.menu.loading')}</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-12 mt-24">
            {items.slice(0, 4).map((item) => (
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
        )}

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1.5 mb-8">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-4 h-4 rounded-full transition-all ${
                  currentPage === page
                    ? 'bg-white opacity-37'
                    : 'bg-[#fadaac] hover:opacity-80'
                }`}
                aria-label={`Go to page ${page}`}
              />
            ))}
          </div>
        )}

        {/* Кнопка "Смотреть меню" - точно как в Figma */}
        <div className="flex justify-center">
          <Link
            href="/coming-soon"
            className="bg-[#75bf5e] text-white px-8 py-3.5 rounded-[70px] font-bold text-base tracking-wide hover:bg-[#65af4e] transition-colors duration-300 min-w-[246px] text-center"
          >
            {t('home.menu.viewMenuButton')}
          </Link>
        </div>
      </div>
    </>
  );
}

