'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-client';

function CheckoutThankYouDecor() {
  return (
    <>
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] md:w-[650px] aspect-square max-h-[650px] pointer-events-none z-0 opacity-40"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>
      <div
        className="absolute bottom-0 right-0 w-[300px] md:w-[450px] aspect-square max-h-[450px] pointer-events-none z-[1] opacity-25 translate-x-1/4 translate-y-1/4"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>
    </>
  );
}

function ThankYouActions({ orderNumber }: { orderNumber: string }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
      {orderNumber ? (
        <Link
          href={`/orders/${encodeURIComponent(orderNumber)}`}
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#7CB342] hover:bg-[#6aa535] text-white font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 text-sm uppercase tracking-widest"
        >
          {t('checkout.thankYou.viewOrder')}
        </Link>
      ) : null}
      <Link
        href="/products"
        className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-[#3d504e] text-[#fff4de] hover:bg-[#3d504e]/40 font-semibold rounded-xl transition-all duration-200 text-sm uppercase tracking-widest ${
          orderNumber ? '' : 'sm:mx-auto'
        }`}
      >
        {t('checkout.thankYou.continueShopping')}
      </Link>
    </div>
  );
}

export function ThankYouClient() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order')?.trim() ?? '';

  return (
    <div className="w-full bg-[#2F3F3D] relative min-h-screen">
      <CheckoutThankYouDecor />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-[#7CB342]/20 border border-[#7CB342]/40 flex items-center justify-center mx-auto mb-8">
          <svg
            className="w-10 h-10 text-[#7CB342]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7CB342] mb-2">
          {t('common.messages.shopping')}
        </p>
        <h1 className="text-[#fff4de] text-3xl md:text-4xl font-light italic mb-4">
          {t('checkout.thankYou.title')}
        </h1>
        <p className="text-[#fff4de]/60 text-sm md:text-base mb-8 leading-relaxed">
          {t('checkout.thankYou.subtitle')}
        </p>

        {orderNumber ? (
          <div className="mb-10 rounded-2xl border border-[#3d504e] bg-[#3d504e]/40 px-6 py-5">
            <p className="text-[#fff4de]/50 text-xs uppercase tracking-widest mb-2">
              {t('checkout.thankYou.orderNumber')}
            </p>
            <p className="text-[#fff4de] text-xl md:text-2xl font-semibold tracking-wide">{orderNumber}</p>
          </div>
        ) : (
          <p className="text-[#fff4de]/45 text-sm mb-10 max-w-md mx-auto">{t('checkout.thankYou.missingOrderHint')}</p>
        )}

        <ThankYouActions orderNumber={orderNumber} />
      </div>
    </div>
  );
}
