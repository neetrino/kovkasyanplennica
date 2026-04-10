export type CheckoutFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  shippingMethod: 'pickup' | 'delivery';
  paymentMethod: 'arca' | 'cash_on_delivery';
  shippingAddress?: string;
  shippingCity?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardHolderName?: string;
};

export type { Cart, CartItem } from '@/app/(main)/cart/types';
