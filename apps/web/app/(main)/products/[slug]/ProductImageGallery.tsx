'use client';

import { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { ProductLabels } from '@/components/ProductLabels';
import { t } from '@/lib/i18n';
import type { LanguageCode } from '@/lib/language';
import type { Product } from './types';

interface ProductImageGalleryProps {
  images: string[];
  product: Product;
  discountPercent: number | null;
  language: LanguageCode;
  currentImageIndex: number;
}

export function ProductImageGallery({
  images,
  product,
  discountPercent,
  language,
  currentImageIndex,
}: ProductImageGalleryProps) {
  const [showZoom, setShowZoom] = useState(false);

  return (
    <>
      <div className="w-full min-w-0">
        <div className="group relative aspect-square w-full overflow-hidden rounded-[35px] border-0 bg-[#2f3f3d] shadow-none ring-0 outline-none">
          {images.length > 0 ? (
            <img
              src={images[currentImageIndex]}
              alt={product.title}
              className="absolute inset-0 size-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              {t(language, 'common.messages.noImage')}
            </div>
          )}

          {discountPercent && (
            <div className="absolute right-4 top-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[#2f3f3d] text-sm font-bold text-[#ffe5c2] shadow-[0_4px_14px_rgba(0,0,0,0.2)]">
              -{discountPercent}%
            </div>
          )}

          {product.labels && <ProductLabels labels={product.labels} />}

          <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setShowZoom(true)}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.15)] backdrop-blur-sm transition-all duration-300 hover:bg-white/90 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
              aria-label={t(language, 'common.ariaLabels.fullscreenImage')}
            >
              <Maximize2 className="h-5 w-5 text-gray-800" />
            </button>
          </div>
        </div>
      </div>

      {showZoom && images.length > 0 && (
        <div
          className="fixed inset-0 z-app-overlay flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setShowZoom(false)}
        >
          <img src={images[currentImageIndex]} alt="" className="max-h-full max-w-full object-contain" />
          <button
            type="button"
            className="absolute right-4 top-4 text-2xl text-white"
            aria-label={t(language, 'common.buttons.close')}
            onClick={(e) => {
              e.stopPropagation();
              setShowZoom(false);
            }}
          >
            {t(language, 'common.buttons.close')}
          </button>
        </div>
      )}
    </>
  );
}
