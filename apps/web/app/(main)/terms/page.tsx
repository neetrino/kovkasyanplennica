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
        <TermsDocument t={t} title={t('terms.title')} />
      </div>
    </div>
  );
}
