'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';

/**
 * Privacy Policy page - displays privacy policy information
 */
export default function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <div className="policy-page">
      <div className="policy-page-inner">
        <Card className="policy-glass-card space-y-6 p-6">
          <h1 className="text-4xl font-bold text-gray-900">{t('privacy.title')}</h1>

            <div className="space-y-4">
              <p className="text-gray-600">{t('privacy.intro.p1')}</p>
              <p className="text-gray-600">{t('privacy.intro.p2')}</p>
              <p className="text-gray-600">{t('privacy.intro.p3')}</p>
            </div>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-900">{t('privacy.collected.title')}</h2>
              <p className="text-gray-600">{t('privacy.collected.lead')}</p>
              <ul className="ml-4 list-inside list-disc text-gray-600">
                <li>{t('privacy.collected.itemContacts')}</li>
                <li>{t('privacy.collected.itemPurchases')}</li>
                <li>{t('privacy.collected.itemTechnical')}</li>
                <li>{t('privacy.collected.itemCookies')}</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-900">{t('privacy.usage.title')}</h2>
              <p className="text-gray-600">{t('privacy.usage.lead')}</p>
              <ul className="ml-4 list-inside list-disc text-gray-600">
                <li>{t('privacy.usage.itemOrders')}</li>
                <li>{t('privacy.usage.itemSupport')}</li>
                <li>{t('privacy.usage.itemImprove')}</li>
                <li>{t('privacy.usage.itemLegal')}</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-900">{t('privacy.retention.title')}</h2>
              <p className="text-gray-600">{t('privacy.retention.lead')}</p>
              <ul className="ml-4 list-inside list-disc text-gray-600">
                <li>{t('privacy.retention.itemAccount')}</li>
                <li>{t('privacy.retention.itemPurchases')}</li>
                <li>{t('privacy.retention.itemMarketing')}</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-900">{t('privacy.security.title')}</h2>
              <p className="text-gray-600">{t('privacy.security.lead')}</p>
              <ul className="ml-4 list-inside list-disc text-gray-600">
                <li>{t('privacy.security.itemSsl')}</li>
                <li>{t('privacy.security.itemAccess')}</li>
                <li>{t('privacy.security.itemAudits')}</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-900">{t('privacy.thirdParties.title')}</h2>
              <p className="text-gray-600">{t('privacy.thirdParties.lead')}</p>
              <ul className="ml-4 list-inside list-disc text-gray-600">
                <li>{t('privacy.thirdParties.itemDelivery')}</li>
                <li>{t('privacy.thirdParties.itemPayments')}</li>
                <li>{t('privacy.thirdParties.itemLaw')}</li>
              </ul>
              <p className="text-gray-600">{t('privacy.thirdParties.footer')}</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-900">{t('privacy.rights.title')}</h2>
              <p className="text-gray-600">{t('privacy.rights.lead')}</p>
              <ul className="ml-4 list-inside list-disc text-gray-600">
                <li>{t('privacy.rights.itemCopy')}</li>
                <li>{t('privacy.rights.itemEdit')}</li>
                <li>{t('privacy.rights.itemUnsubscribe')}</li>
                <li>{t('privacy.rights.itemRestrict')}</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-900">{t('privacy.cookies.title')}</h2>
              <p className="text-gray-600">{t('privacy.cookies.lead')}</p>
              <ul className="ml-4 list-inside list-disc text-gray-600">
                <li>{t('privacy.cookies.itemFunctional')}</li>
                <li>{t('privacy.cookies.itemAnalytics')}</li>
                <li>{t('privacy.cookies.itemMarketing')}</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-900">{t('privacy.changes.title')}</h2>
              <p className="text-gray-600">{t('privacy.changes.text')}</p>
            </section>
        </Card>
      </div>
    </div>
  );
}
