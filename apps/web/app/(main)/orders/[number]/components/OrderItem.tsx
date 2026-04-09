'use client';

import { useTranslation } from '@/lib/i18n-client';
import { formatPriceInCurrency, SHOP_DISPLAY_CURRENCY } from '@/lib/currency';
import { getColorValue } from '../utils/color-helpers';
import type { OrderItem as OrderItemType } from '../types';

interface OrderItemProps {
  item: OrderItemType;
}

export function OrderItem({ item }: OrderItemProps) {
  const { t } = useTranslation();

  const allOptions = item.variantOptions ?? [];

  const getAttributeLabel = (key: string): string => {
    if (key === 'color' || key === 'colour') return t('orders.itemDetails.color');
    if (key === 'size') return t('orders.itemDetails.size');
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  const getColorsArray = (colors: unknown): string[] => {
    if (!colors) return [];
    if (Array.isArray(colors)) return colors;
    if (typeof colors === 'string') {
      try { return JSON.parse(colors); } catch { return []; }
    }
    return [];
  };

  const itemPriceDisplay = formatPriceInCurrency(item.price, SHOP_DISPLAY_CURRENCY);
  const itemTotalDisplay = formatPriceInCurrency(item.total, SHOP_DISPLAY_CURRENCY);

  return (
    <div className="flex gap-4 pb-5 border-b border-[#3d504e] last:border-0 last:pb-0">

      {/* Product image */}
      {item.imageUrl ? (
        <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-[#2F3F3D] border border-[#3d504e]">
          <img
            src={item.imageUrl}
            alt={item.productTitle}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-20 h-20 flex-shrink-0 rounded-xl bg-[#2F3F3D] border border-[#3d504e] flex items-center justify-center">
          <svg className="w-8 h-8 text-[#fff4de]/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[#fff4de] text-base font-medium mb-1 leading-snug">{item.productTitle}</h3>

        {/* Variant options */}
        {allOptions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 mb-2">
            {allOptions.map((opt, idx) => {
              if (!opt.attributeKey || !opt.value) return null;
              const attrKey = opt.attributeKey.toLowerCase().trim();
              const isColor = attrKey === 'color' || attrKey === 'colour';
              const displayLabel = opt.label ?? opt.value;
              const hasImage = opt.imageUrl?.trim();
              const colors = getColorsArray(opt.colors);
              const colorHex = colors.length > 0 ? colors[0] : (isColor ? getColorValue(opt.value) : null);

              return (
                <div key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#2F3F3D] border border-[#3d504e] rounded-lg">
                  <span className="text-[#fff4de]/40 text-xs">{getAttributeLabel(opt.attributeKey)}:</span>
                  {hasImage ? (
                    <img
                      src={opt.imageUrl!}
                      alt={displayLabel}
                      className="w-4 h-4 rounded border border-[#3d504e] object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : isColor && colorHex ? (
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0"
                      style={{ backgroundColor: colorHex }}
                      title={displayLabel}
                    />
                  ) : null}
                  <span className="text-[#fff4de] text-xs capitalize">{displayLabel}</span>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[#fff4de]/35 text-xs font-mono mt-1">
          {t('orders.itemDetails.sku').replace('{sku}', item.sku)}
        </p>
        <p className="text-[#fff4de]/50 text-xs mt-1">
          {item.quantity} × {itemPriceDisplay}
        </p>
      </div>

      {/* Total */}
      <div className="flex-shrink-0 text-right pt-1">
        <span className="text-[#7CB342] font-semibold text-base">{itemTotalDisplay}</span>
      </div>
    </div>
  );
}
