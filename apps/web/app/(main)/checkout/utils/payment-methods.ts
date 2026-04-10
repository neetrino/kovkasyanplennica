import { useTranslation } from '@/lib/i18n-client';

export type PaymentMethodId = 'arca' | 'cash_on_delivery';

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  description: string;
  logo: string | null;
}

export function usePaymentMethods(): PaymentMethod[] {
  const { t } = useTranslation();

  return [
    {
      id: 'cash_on_delivery',
      name: t('checkout.payment.cashOnDelivery'),
      description: t('checkout.payment.cashOnDeliveryDescription'),
      logo: null,
    },
  ];
}








