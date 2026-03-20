'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n-client';

interface ErrorStateProps {
  error: string | null;
}

export function ErrorState({ error }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full bg-[#2F3F3D] relative min-h-screen">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] aspect-square max-h-[600px] pointer-events-none z-0 opacity-40"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center pb-20">
        <div className="w-20 h-20 rounded-full bg-[#3d504e]/60 border border-[#3d504e] flex items-center justify-center mb-8">
          <svg className="w-10 h-10 text-[#fff4de]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>

        <h1 className="text-[#fff4de] text-3xl font-light italic mb-3">
          {t('orders.notFound.title')}
        </h1>
        <div className="w-16 h-[2px] bg-[#7CB342] mx-auto mb-5" />
        <p className="text-[#fff4de]/50 text-base max-w-sm mb-10">
          {error || t('orders.notFound.description')}
        </p>

        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#7CB342] hover:bg-[#6aa535] text-white font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 text-sm uppercase tracking-widest"
        >
          {t('orders.buttons.continueShopping')}
        </Link>
      </div>
    </div>
  );
}
