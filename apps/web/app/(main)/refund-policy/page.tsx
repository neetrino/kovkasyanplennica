'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';

/**
 * Refund Policy page - outlines return and refund rules
 */
export default function RefundPolicyPage() {
  const { t } = useTranslation();
  return (
    <div className="policy-page">
      <div className="policy-page-inner">
        <h1 className="text-4xl font-bold text-gray-900">{t('refund-policy.title')}</h1>

        <div className="mt-8 space-y-6">
          <Card className="p-6 space-y-6">
            <p className="text-gray-600">{t('refund-policy.intro')}</p>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                {t('refund-policy.orderChange.title')}
              </h2>
              <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                <li>{t('refund-policy.orderChange.b1')}</li>
                <li>{t('refund-policy.orderChange.b2')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                {t('refund-policy.returnsCompensation.title')}
              </h2>
              <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                <li>{t('refund-policy.returnsCompensation.b1')}</li>
                <li>{t('refund-policy.returnsCompensation.b2')}</li>
                <li>{t('refund-policy.returnsCompensation.b3')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                {t('refund-policy.refundProcedure.title')}
              </h2>
              <p className="mt-2 text-gray-600">{t('refund-policy.refundProcedure.lead')}</p>
              <ul className="mt-2 list-none space-y-1 text-gray-600 ml-4">
                <li>– {t('refund-policy.refundProcedure.sub1')}</li>
                <li>– {t('refund-policy.refundProcedure.sub2')}</li>
              </ul>
              <ul className="mt-4 list-disc list-inside text-gray-600 ml-4">
                <li>{t('refund-policy.refundProcedure.b1')}</li>
                <li>{t('refund-policy.refundProcedure.b2')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                {t('refund-policy.deliveryIssues.title')}
              </h2>
              <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                <li>{t('refund-policy.deliveryIssues.b1')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">{t('refund-policy.contact.title')}</h2>
              <p className="mt-2 text-gray-600">
                {t('refund-policy.contact.description')}{' '}
                <a href="mailto:support@whiteshop.com" className="text-blue-600 hover:underline">
                  support@whiteshop.com
                </a>
                .
              </p>
            </section>
          </Card>
        </div>
      </div>
    </div>
  );
}
