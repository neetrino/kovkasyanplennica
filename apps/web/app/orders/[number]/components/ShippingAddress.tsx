'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import type { Order } from '../types';

interface ShippingAddressProps {
  shippingAddress: Order['shippingAddress'];
}

export function ShippingAddress({ shippingAddress }: ShippingAddressProps) {
  const { t } = useTranslation();

  if (!shippingAddress) return null;

  const lines = [
    shippingAddress.firstName && shippingAddress.lastName
      ? `${shippingAddress.firstName} ${shippingAddress.lastName}`
      : null,
    shippingAddress.addressLine1,
    shippingAddress.addressLine2,
    [shippingAddress.city, shippingAddress.postalCode].filter(Boolean).join(', '),
    shippingAddress.countryCode,
  ].filter(Boolean) as string[];

  return (
    <div className="bg-[#3d504e]/40 border border-[#3d504e] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#3d504e] bg-[#3d504e]/60">
        <svg className="w-5 h-5 text-[#7CB342]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h2 className="text-[#fff4de] font-light italic text-lg">{t('orders.shippingAddress.title')}</h2>
      </div>

      <div className="p-6">
        <div className="space-y-1">
          {lines.map((line, i) => (
            <p key={i} className={`${i === 0 ? 'text-[#fff4de] font-medium' : 'text-[#fff4de]/60'} text-sm`}>
              {line}
            </p>
          ))}
          {shippingAddress.phone && (
            <p className="text-[#7CB342] text-sm mt-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {shippingAddress.phone}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
