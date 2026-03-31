'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n-client';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { OrderStatus } from './components/OrderStatus';
import { OrderItems } from './components/OrderItems';
import { ShippingAddress } from './components/ShippingAddress';
import { OrderSummary } from './components/OrderSummary';
import type { Order } from './types';

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculatedShipping, setCalculatedShipping] = useState<number | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    fetchOrder();

  }, [isLoggedIn, params.number, router]);

  async function fetchOrder() {
    try {
      setLoading(true);
      const response = await apiClient.get<Order>(`/api/v1/orders/${params.number}`);
      setOrder(response);

      if (response.shippingMethod === 'delivery' && response.shippingAddress?.city) {
        fetchShippingPrice(response.shippingAddress.city);
      } else {
        setCalculatedShipping(null);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('orders.notFound.description');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function fetchShippingPrice(city: string) {
    if (!city.trim()) { setCalculatedShipping(0); return; }
    setLoadingShipping(true);
    try {
      const response = await apiClient.get<{ price: number }>('/api/v1/delivery/price', {
        params: { city: city.trim(), country: 'Armenia' },
      });
      setCalculatedShipping(response.price);
    } catch {
      setCalculatedShipping(0);
    } finally {
      setLoadingShipping(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error || !order) return <ErrorState error={error} />;

  return (
    <div className="w-full bg-[#2F3F3D] relative min-h-screen">

      {/* Decorative overlays */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] md:w-[650px] aspect-square max-h-[650px] pointer-events-none z-0 opacity-40"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>
      <div
        className="absolute bottom-0 right-0 w-[300px] md:w-[450px] aspect-square max-h-[450px] pointer-events-none z-[1] opacity-25 translate-x-1/4 translate-y-1/4"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">

        {/* Page header */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7CB342] mb-2">
            {t('common.navigation.orders')}
          </p>
          <h1 className="text-[#fff4de] text-4xl md:text-5xl font-light italic">
            {t('orders.title').replace('{number}', order.number)}
          </h1>
          <div className="w-16 h-[2px] bg-[#7CB342] mt-4 mb-3" />
          <p className="text-[#fff4de]/50 text-sm">
            {t('orders.placedOn').replace('{date}', new Date(order.createdAt).toLocaleDateString())}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            <OrderStatus
              status={order.status}
              paymentStatus={order.paymentStatus}
              fulfillmentStatus={order.fulfillmentStatus}
            />
            <OrderItems items={order.items} />
            {order.shippingAddress && (
              <ShippingAddress shippingAddress={order.shippingAddress} />
            )}
          </div>

          <OrderSummary
            order={order}
            calculatedShipping={calculatedShipping}
            loadingShipping={loadingShipping}
          />
        </div>

      </div>
    </div>
  );
}
