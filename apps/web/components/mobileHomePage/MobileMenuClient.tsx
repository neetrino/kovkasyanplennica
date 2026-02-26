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
  brand: { id: string; name: string } | null;
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
  discountPercent?: number | null;
  colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
}

interface MobileMenuClientProps {
  initialItems?: MenuItem[];
  totalPages?: number;
}

/**
 * Mobile Menu section: 2-column grid, ProductCard, dots, "Смотреть меню".
 */
export function MobileMenuClient({ initialItems = [], totalPages = 0 }: MobileMenuClientProps) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentPage === 1 && initialItems.length > 0) return;
    setLoading(true);
    const baseUrl =
      typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const params = new URLSearchParams({ page: currentPage.toString(), limit: '2', lang: 'en' });
    fetch(`${baseUrl}/api/v1/products?${params}`, { cache: 'no-store' })
      .then((res) => res.ok ? res.json() : { data: [] })
      .then((response: { data?: unknown[] }) => {
        if (response.data && Array.isArray(response.data)) {
          setItems(
            response.data.map((raw: unknown) => {
              const p = raw as Record<string, unknown>;
              return {
                id: String(p.id),
                slug: String(p.slug ?? ''),
                title: String(p.title ?? ''),
                price: Number(p.price ?? 0),
                image: (p.image as string) ?? null,
                inStock: Boolean(p.inStock ?? true),
                brand: (p.brand as { id: string; name: string } | null) ?? null,
                calories: Number(p.calories ?? 150),
                category: (p.brand as { name?: string })?.name ?? String(p.category ?? t('home.menu.categoryFallback')),
                labels: [],
                compareAtPrice: (p.compareAtPrice as number | null) ?? null,
                originalPrice: (p.originalPrice as number | null) ?? null,
                discountPercent: (p.discountPercent as number | null) ?? null,
                colors: (p.colors as MenuItem['colors']) ?? [],
              } as MenuItem;
            })
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentPage, initialItems.length, t]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) setCurrentPage(page);
  };

  const displayItems = items.slice(0, 2);

  return (
    <>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-0 top-[26px] w-full max-w-[500px] h-[503px] mix-blend-screen">
          <Image src="/assets/hero/union-decorative.png" alt="" fill className="object-contain" aria-hidden unoptimized />
        </div>
      </div>

      <div className="relative z-10 px-4 max-w-[430px] mx-auto">
        <h2 className="text-[#fff4de] text-[41px] leading-[68px] font-light italic text-center mt-0 mb-4">
          {t('home.menu.title')}
        </h2>
        <div className="relative w-[180px] h-[5px] mx-auto mb-6">
          <Image src="/assets/hero/Vector7.svg" alt="" fill className="object-contain" aria-hidden unoptimized />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12 text-[#fff4de]">{t('home.menu.loading')}</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-10 mt-12">
            {displayItems.map((item) => (
              <div key={item.id} className="flex justify-center">
                <ProductCard product={{ ...item, labels: undefined }} viewMode="grid-3" compactHeight />
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mb-8 mt-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-2 h-2 rounded-md transition-all ${
                  currentPage === page ? 'bg-white opacity-90' : 'bg-[#fadaac]'
                }`}
                aria-label={`Page ${page}`}
              />
            ))}
          </div>
        )}

        <div className="flex justify-center mt-4">
          <Link
            href="/coming-soon"
            className="bg-[#75bf5e] text-white h-14 min-w-[246px] rounded-[70px] font-bold text-base flex items-center justify-center"
          >
            {t('home.menu.viewMenuButton')}
          </Link>
        </div>
      </div>
    </>
  );
}
