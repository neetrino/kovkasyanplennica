'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { OrderItem } from './OrderItem';
import type { OrderItem as OrderItemType } from '../types';

interface OrderItemsProps {
  items: OrderItemType[];
  currency: 'USD' | 'AMD' | 'EUR' | 'RUB' | 'GEL';
}

export function OrderItems({ items, currency }: OrderItemsProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-[#3d504e]/40 border border-[#3d504e] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#3d504e] bg-[#3d504e]/60">
        <svg className="w-5 h-5 text-[#7CB342]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h2 className="text-[#fff4de] font-light italic text-lg">{t('orders.orderItems.title')}</h2>
        <span className="ml-auto text-[#fff4de]/35 text-xs">
          {items.length} {items.length === 1 ? t('common.cart.item') : t('common.cart.items')}
        </span>
      </div>

      <div className="p-6 space-y-5">
        {items.map((item, index) => (
          <OrderItem key={index} item={item} currency={currency} />
        ))}
      </div>
    </div>
  );
}
