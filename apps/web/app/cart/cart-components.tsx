'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '../../lib/currency';
import type { CurrencyCode } from '../../lib/currency';
import type { Cart, CartItem } from './types';

interface CartItemRowProps {
  item: CartItem;
  currency: string;
  updatingItems: Set<string>;
  onRemove: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  t: (key: string) => string;
}

export function CartItemRow({
  item,
  currency,
  updatingItems,
  onRemove,
  onUpdateQuantity,
  t,
}: CartItemRowProps) {
  const currencyCode = currency as CurrencyCode;
  const isUpdating = updatingItems.has(item.id);
  const hasDiscount = item.originalPrice != null && item.originalPrice > item.price;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 px-5 sm:px-6 py-6 relative group hover:bg-[#3d504e]/30 transition-colors duration-200">

      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#2F3F3D] border border-[#3d504e] hover:border-red-400/60 flex items-center justify-center text-[#fff4de]/40 hover:text-red-400 transition-all duration-200 z-10"
        aria-label={t('common.buttons.remove')}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Product — image + title */}
      <div className="md:col-span-6 flex items-start gap-4 pr-8 md:pr-0">
        <Link
          href={`/products/${item.variant.product.slug}`}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl flex-shrink-0 relative overflow-hidden bg-[#3d504e]/60 border border-[#3d504e] hover:border-[#7CB342]/50 transition-colors"
        >
          {item.variant.product.image ? (
            <Image
              src={item.variant.product.image}
              alt={item.variant.product.title}
              fill
              className="object-cover"
              sizes="112px"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[#fff4de]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0 pt-1">
          <Link
            href={`/products/${item.variant.product.slug}`}
            className="text-[#fff4de] text-sm md:text-base font-medium hover:text-[#7CB342] transition-colors line-clamp-2 leading-snug"
          >
            {item.variant.product.title}
          </Link>
          {item.variant.sku && (
            <p className="text-[#fff4de]/35 text-xs mt-1.5 font-mono">
              {t('common.messages.sku')}: {item.variant.sku}
            </p>
          )}
          {hasDiscount && (
            <span className="inline-block mt-2 text-xs bg-[#7CB342]/15 text-[#7CB342] border border-[#7CB342]/30 rounded-full px-2 py-0.5">
              Sale
            </span>
          )}
        </div>
      </div>

      {/* Quantity controls */}
      <div className="md:col-span-3 flex flex-col items-start md:items-center justify-center">
        <p className="mb-2 text-[10px] font-semibold tracking-[0.15em] text-[#fff4de]/40 uppercase md:hidden">
          {t('common.messages.quantity')}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            disabled={isUpdating || item.quantity <= 1}
            className="w-8 h-8 flex-shrink-0 rounded-lg border border-[#3d504e] hover:border-[#7CB342]/60 flex items-center justify-center text-[#fff4de]/60 hover:text-[#fff4de] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-[#2F3F3D]"
            aria-label={t('common.ariaLabels.decreaseQuantity')}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </button>

          <div className="relative">
            <input
              type="number"
              min="1"
              max={item.variant.stock ?? undefined}
              value={item.quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                onUpdateQuantity(item.id, val);
              }}
              disabled={isUpdating}
              className="w-14 h-8 text-center bg-[#2F3F3D] border border-[#3d504e] rounded-lg text-[#fff4de] text-sm font-medium focus:outline-none focus:border-[#7CB342]/70 focus:ring-1 focus:ring-[#7CB342]/30 disabled:opacity-30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              title={item.variant.stock != null ? t('common.messages.availableQuantity').replace('{stock}', item.variant.stock.toString()) : ''}
            />
          </div>

          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            disabled={isUpdating || (item.variant.stock != null && item.quantity >= item.variant.stock)}
            className="w-8 h-8 flex-shrink-0 rounded-lg border border-[#3d504e] hover:border-[#7CB342]/60 flex items-center justify-center text-[#fff4de]/60 hover:text-[#fff4de] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-[#2F3F3D]"
            aria-label={t('common.ariaLabels.increaseQuantity')}
            title={item.variant.stock != null && item.quantity >= item.variant.stock ? t('common.messages.availableQuantity').replace('{stock}', item.variant.stock.toString()) : t('common.messages.addQuantity')}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="md:col-span-3 flex flex-col items-start md:items-end justify-center md:pr-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#fff4de]/40 md:hidden mb-1">
          {t('common.messages.subtotal')}
        </p>
        <span className="text-[#7CB342] text-base md:text-lg font-semibold">
          {formatPrice(item.total, currencyCode)}
        </span>
        {hasDiscount && item.originalPrice != null && (
          <span className="text-[#fff4de]/35 text-xs line-through mt-0.5">
            {formatPrice(item.originalPrice * item.quantity, currencyCode)}
          </span>
        )}
        <span className="text-[#fff4de]/35 text-xs mt-1">
          {formatPrice(item.price, currencyCode)} / {t('common.messages.unit')}
        </span>
      </div>

    </div>
  );
}

interface CartTableProps {
  cart: Cart;
  currency: string;
  updatingItems: Set<string>;
  onRemove: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  t: (key: string) => string;
}

export function CartTable({ cart, currency, updatingItems, onRemove, onUpdateQuantity, t }: CartTableProps) {
  return (
    <div className="lg:col-span-2">
      <div className="bg-[#3d504e]/40 border border-[#3d504e] rounded-2xl overflow-hidden">

        {/* Table header */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 border-b border-[#3d504e] bg-[#3d504e]/60">
          <div className="md:col-span-6">
            <span className="text-[10px] font-semibold text-[#fff4de]/50 uppercase tracking-[0.2em]">
              {t('common.messages.product')}
            </span>
          </div>
          <div className="md:col-span-3 text-center">
            <span className="text-[10px] font-semibold text-[#fff4de]/50 uppercase tracking-[0.2em]">
              {t('common.messages.quantity')}
            </span>
          </div>
          <div className="md:col-span-3 text-right pr-8">
            <span className="text-[10px] font-semibold text-[#fff4de]/50 uppercase tracking-[0.2em]">
              {t('common.messages.subtotal')}
            </span>
          </div>
        </div>

        {/* Items */}
        <div className="divide-y divide-[#3d504e]">
          {cart.items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              currency={currency}
              updatingItems={updatingItems}
              onRemove={onRemove}
              onUpdateQuantity={onUpdateQuantity}
              t={t}
            />
          ))}
        </div>

      </div>
    </div>
  );
}

interface OrderSummaryProps {
  cart: Cart;
  currency: string;
  t: (key: string) => string;
}

export function OrderSummary({ cart, currency, t }: OrderSummaryProps) {
  const currencyCode = currency as CurrencyCode;

  return (
    <div className="lg:col-span-1">
      <div className="bg-[#3d504e]/40 border border-[#3d504e] rounded-2xl p-6 lg:sticky lg:top-24">

        {/* Header */}
        <h2 className="text-[#fff4de] text-xl font-light italic mb-6">
          {t('common.cart.orderSummary')}
        </h2>
        <div className="w-12 h-[1px] bg-[#7CB342] mb-6" />

        {/* Price breakdown */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-[#fff4de]/60 text-sm">{t('common.cart.subtotal')}</span>
            <span className="text-[#fff4de] text-sm font-medium">
              {formatPrice(cart.totals.subtotal, currencyCode)}
            </span>
          </div>

          {cart.totals.discount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-[#fff4de]/60 text-sm">{t('common.cart.discount')}</span>
              <span className="text-[#7CB342] text-sm font-medium">
                − {formatPrice(cart.totals.discount, currencyCode)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-[#fff4de]/60 text-sm">{t('common.cart.shipping')}</span>
            <span className="text-[#7CB342] text-sm font-medium">{t('common.cart.free')}</span>
          </div>

          {cart.totals.tax > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-[#fff4de]/60 text-sm">{t('common.cart.tax')}</span>
              <span className="text-[#fff4de] text-sm">
                {formatPrice(cart.totals.tax, currencyCode)}
              </span>
            </div>
          )}

          <div className="border-t border-[#3d504e] pt-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-[#fff4de] font-semibold">{t('common.cart.total')}</span>
              <span className="text-[#7CB342] text-xl font-semibold">
                {formatPrice(cart.totals.total, currencyCode)}
              </span>
            </div>
          </div>
        </div>

        {/* Checkout button */}
        <button
          type="button"
          onClick={() => { window.location.href = '/checkout'; }}
          className="w-full py-3.5 px-6 bg-[#7CB342] hover:bg-[#6aa535] text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#7CB342]/20 hover:-translate-y-0.5 active:translate-y-0 text-sm uppercase tracking-widest"
        >
          {t('common.buttons.proceedToCheckout')}
        </button>

        {/* Continue shopping */}
        <button
          type="button"
          onClick={() => { window.location.href = '/products'; }}
          className="w-full mt-3 py-3 px-6 bg-transparent border border-[#3d504e] hover:border-[#fff4de]/30 text-[#fff4de]/60 hover:text-[#fff4de] font-medium rounded-xl transition-all duration-200 text-sm"
        >
          {t('common.buttons.browseProducts')}
        </button>

        {/* Secure checkout note */}
        <div className="flex items-center justify-center gap-2 mt-5 text-[#fff4de]/30">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-xs">{t('common.cart.secureCheckout')}</span>
        </div>

      </div>
    </div>
  );
}
