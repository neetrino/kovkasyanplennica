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
  defaultVariantId?: string | null;
  stock?: number;
  brand: {
    id: string;
    name: string;
  } | null;
  description?: string | null;
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

function getPrimaryCategoryTitle(raw: unknown): string | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const first = raw[0];
  if (!first || typeof first !== 'object') return undefined;
  const title = (first as { title?: unknown }).title;
  return typeof title === 'string' && title.trim() ? title : undefined;
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
  const paginationPages = Math.min(totalPages, 4);

  // Fetch products when page changes
  useEffect(() => {
    const fetchProducts = async () => {
      if (currentPage === 1 && initialItems.length > 0) {
        // Use initial items for first page
        return;
      }

      setLoading(true);
      try {
        const language = 'ru';
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
            const products = response.data.map((p: Record<string, unknown>) => ({
              id: String(p.id ?? ''),
              slug: String(p.slug ?? ''),
              title: String(p.title ?? ''),
              price: Number(p.price ?? 0),
              compareAtPrice:
                typeof p.compareAtPrice === 'number'
                  ? p.compareAtPrice
                  : typeof p.originalPrice === 'number'
                    ? p.originalPrice
                    : null,
              image: typeof p.image === 'string' ? p.image : null,
              inStock: Boolean(p.inStock ?? true),
              defaultVariantId: typeof p.defaultVariantId === 'string' ? p.defaultVariantId : null,
              stock: typeof p.stock === 'number' ? p.stock : undefined,
              brand: (p.brand as MenuItem['brand']) ?? null,
              colors: (p.colors as MenuItem['colors']) ?? [],
              labels: (p.labels as MenuItem['labels']) ?? [],
              description: typeof p.description === 'string' ? p.description : null,
              category:
                getPrimaryCategoryTitle(p.categories) ||
                (typeof p.category === 'string' && p.category.trim() ? p.category : undefined) ||
                t('home.menu.categoryFallback'),
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
    if (page >= 1 && page <= paginationPages && page !== currentPage) {
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
        <div className="relative text-center mb-4 md:mb-6 -mt-4">
          <h2 className="text-[#fff4de] text-6xl md:text-7xl lg:text-8xl xl:text-[103px] font-light italic leading-[128px] mb-2 -translate-y-2 md:-translate-y-3">
            {t('home.menu.title')}
          </h2>
          {/* Vector7 декоративный паттерн под заголовком — строго по центру (в т.ч. на планшете) */}
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-3 top-full w-[50%] max-w-[300px] h-[8px] md:h-[10px] lg:h-[12px] flex justify-center">
            <div className="relative w-full h-full">
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
          <div className="mt-3 mb-8 h-[8px] md:h-[10px] lg:h-[12px]" aria-hidden />
        </div>

        {/* Карточки продуктов */}
        {loading ? (
          <div className="flex justify-center items-center py-12 mt-56">
            <div className="text-[#fff4de] text-lg">{t('home.menu.loading')}</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 mb-12 mt-24">
            {items.slice(0, 4).map((item, index) => (
              <div
                key={item.id}
                className={`flex justify-center ${index === 3 ? 'md:hidden lg:flex' : ''}`}
              >
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

        {/* Пагинация — как у HomePageImageCarousel (active: белое ядро + ореол) */}
        {paginationPages > 1 && (
          <div className="mb-8 flex items-center justify-center gap-1">
            {Array.from({ length: paginationPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => handlePageChange(page)}
                className="flex h-11 w-11 shrink-0 items-center justify-center"
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {currentPage === page ? (
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

