'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';

/**
 * Delivery Terms page - describes shipping and delivery conditions
 */
export default function DeliveryTermsPage() {
  const { t } = useTranslation();
  return (
    <div className="policy-page">
      <div className="policy-page-inner">
        <h1 className="text-4xl font-bold text-gray-900">{t('delivery-terms.title')}</h1>

        <div className="mt-8 space-y-6">
          <Card className="p-6 space-y-6">
            <p className="text-gray-600">{t('delivery-terms.intro')}</p>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                {t('delivery-terms.deliveryTimes.title')}
              </h2>
              <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                <li>{t('delivery-terms.deliveryTimes.b1')}</li>
                <li>{t('delivery-terms.deliveryTimes.b2')}</li>
                <li>{t('delivery-terms.deliveryTimes.b3')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                {t('delivery-terms.receivingOptions.title')}
              </h2>
              <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                <li>{t('delivery-terms.receivingOptions.b1')}</li>
                <li>{t('delivery-terms.receivingOptions.b2')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                {t('delivery-terms.deliveryCost.title')}
              </h2>
              <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                <li>{t('delivery-terms.deliveryCost.b1')}</li>
                <li>{t('delivery-terms.deliveryCost.b2')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                {t('delivery-terms.deliveryZones.title')}
              </h2>
              <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                <li>{t('delivery-terms.deliveryZones.b1')}</li>
                <li>{t('delivery-terms.deliveryZones.b2')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                {t('delivery-terms.possibleDelays.title')}
              </h2>
              <p className="mt-2 text-gray-600">{t('delivery-terms.possibleDelays.lead')}</p>
              <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                <li>{t('delivery-terms.possibleDelays.b1')}</li>
                <li>{t('delivery-terms.possibleDelays.b2')}</li>
                <li>{t('delivery-terms.possibleDelays.b3')}</li>
                <li>{t('delivery-terms.possibleDelays.b4')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900">
                {t('delivery-terms.importantInfo.title')}
              </h2>
              <ul className="mt-2 list-disc list-inside text-gray-600 ml-4">
                <li>{t('delivery-terms.importantInfo.b1')}</li>
                <li>{t('delivery-terms.importantInfo.b2')}</li>
                <li>{t('delivery-terms.importantInfo.b3')}</li>
              </ul>
            </section>
          </Card>
        </div>
      </div>
    </div>
  );
}
