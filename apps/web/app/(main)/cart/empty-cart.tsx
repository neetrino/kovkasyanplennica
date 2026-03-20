'use client';

import Link from 'next/link';

interface EmptyCartProps {
  t: (key: string) => string;
}

export function EmptyCart({ t }: EmptyCartProps) {
  return (
    <div className="w-full bg-[#2F3F3D] relative min-h-screen">

      {/* Decorative overlay */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] md:w-[600px] aspect-square max-h-[600px] pointer-events-none z-0 opacity-40"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">

        {/* Page title */}
        <div className="mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7CB342] mb-2">
            {t('common.messages.shopping')}
          </p>
          <h1 className="text-[#fff4de] text-4xl md:text-5xl lg:text-6xl font-light italic">
            {t('common.cart.title')}
          </h1>
          <div className="w-16 h-[2px] bg-[#7CB342] mt-4" />
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-20 text-center">

          {/* Icon */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-[#3d504e]/60 border border-[#3d504e] flex items-center justify-center mb-8">
            <svg
              className="w-12 h-12 md:w-16 md:h-16 text-[#fff4de]/20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>

          <h2 className="text-[#fff4de] text-2xl md:text-3xl font-light italic mb-3">
            {t('common.cart.empty')}
          </h2>
          <p className="text-[#fff4de]/50 text-base max-w-sm mb-10 leading-relaxed">
            {t('common.cart.emptyDescription')}
          </p>

          <Link
            href="/products"
            className="inline-flex items-center gap-3 px-8 py-3.5 bg-[#7CB342] hover:bg-[#6aa535] text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#7CB342]/20 hover:-translate-y-0.5 active:translate-y-0 text-sm uppercase tracking-widest"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t('common.buttons.browseProducts')}
          </Link>

        </div>
      </div>
    </div>
  );
}
