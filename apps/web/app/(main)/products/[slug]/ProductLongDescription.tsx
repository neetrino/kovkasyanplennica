'use client';

import { t } from '@/lib/i18n';
import type { LanguageCode } from '@/lib/language';
import { resolvePdpPortionBundle } from './utils/pdp-portion-text';
import type { Product } from './types';

interface ProductLongDescriptionProps {
  product: Product;
  language: LanguageCode;
}

export function ProductLongDescription({ product, language }: ProductLongDescriptionProps) {
  const { longDescriptionHtml } = resolvePdpPortionBundle(language, product);
  if (!longDescriptionHtml.trim()) {
    return null;
  }

  return (
    <section className="mt-16 border-t border-[#ffe5c2]/15 pt-10">
      <h2 className="mb-4 text-xl font-bold uppercase italic tracking-wide text-[#ffe5c2]">
        {t(language, 'product.description_title')}
      </h2>
      <div
        className="prose prose-sm max-w-none text-[#ffe5c2]/90 prose-p:leading-relaxed prose-li:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: longDescriptionHtml }}
      />
    </section>
  );
}
