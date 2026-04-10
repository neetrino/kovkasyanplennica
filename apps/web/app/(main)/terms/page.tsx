'use client';

import { useTranslation } from '@/lib/i18n-client';
import { TermsDocument } from './terms-document';

/**
 * Terms of Service page — usage conditions for kovkasyanplennica.ru
 */
export default function TermsPage() {
  const { t } = useTranslation();
  return (
    <div className="policy-page">
      <div className="policy-page-inner">
        <h1 className="text-4xl font-bold text-gray-900">{t('terms.title')}</h1>

        <div className="mt-8 space-y-6">
          <TermsDocument t={t} />
        </div>
      </div>
    </div>
  );
}
