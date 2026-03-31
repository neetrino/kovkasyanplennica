'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-client';
import { CheckoutForm } from './CheckoutForm';
import { CheckoutModals } from './CheckoutModals';
import { OrderSummary } from './OrderSummary';
import { useCheckout } from './useCheckout';

function CheckoutLoading() {
  return (
    <div className="w-full bg-[#2F3F3D] relative min-h-screen">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] md:w-[700px] aspect-square max-h-[700px] pointer-events-none z-0 opacity-40"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 animate-pulse">
        <div className="mb-10">
          <div className="h-3 bg-[#3d504e] rounded w-20 mb-3" />
          <div className="h-10 bg-[#3d504e] rounded-lg w-40 mb-4" />
          <div className="h-[2px] bg-[#3d504e] w-16" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#3d504e]/40 border border-[#3d504e] rounded-2xl p-6 space-y-4">
                <div className="h-5 bg-[#3d504e] rounded w-40" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-12 bg-[#3d504e] rounded-xl" />
                  <div className="h-12 bg-[#3d504e] rounded-xl" />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-[#3d504e]/40 border border-[#3d504e] rounded-2xl p-6 space-y-4 h-fit">
            <div className="h-5 bg-[#3d504e] rounded w-32" />
            <div className="h-[1px] bg-[#3d504e] w-12" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-3 bg-[#3d504e] rounded w-20" />
                <div className="h-3 bg-[#3d504e] rounded w-16" />
              </div>
            ))}
            <div className="h-12 bg-[#3d504e] rounded-xl mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const {
    cart,
    loading,
    error,
    setError,
    logoErrors,
    setLogoErrors,
    showShippingModal,
    setShowShippingModal,
    showCardModal,
    setShowCardModal,
    deliveryPrice,
    loadingDeliveryPrice,
    register,
    handleSubmit,
    errors,
    isSubmitting,
    setValue,
    paymentMethod,
    shippingMethod,
    shippingCity,
    paymentMethods,
    orderSummary,
    handlePlaceOrder,
    onSubmit,
    isLoggedIn,
  } = useCheckout();

  if (loading) return <CheckoutLoading />;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="w-full bg-[#2F3F3D] relative min-h-screen">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] aspect-square max-h-[600px] pointer-events-none z-0 opacity-40"
          aria-hidden
        >
          <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-[#3d504e]/60 border border-[#3d504e] flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-[#fff4de]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-[#fff4de] text-3xl font-light italic mb-4">{t('checkout.title')}</h1>
          <p className="text-[#fff4de]/50 mb-10">{t('checkout.errors.cartEmpty')}</p>
          <button
            type="button"
            onClick={() => router.push('/products')}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#7CB342] hover:bg-[#6aa535] text-white font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 text-sm uppercase tracking-widest"
          >
            {t('checkout.buttons.continueShopping')}
          </button>
        </div>
      </div>
    );
  }

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
            {t('common.messages.shopping')}
          </p>
          <h1 className="text-[#fff4de] text-4xl md:text-5xl lg:text-6xl font-light italic">
            {t('checkout.title')}
          </h1>
          <div className="w-16 h-[2px] bg-[#7CB342] mt-4" />
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-10 text-xs uppercase tracking-widest">
          <span className="text-[#fff4de]/40 line-through">{t('common.navigation.cart')}</span>
          <svg className="w-4 h-4 text-[#3d504e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[#7CB342] font-semibold">{t('checkout.title')}</span>
          <svg className="w-4 h-4 text-[#3d504e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[#fff4de]/25">{t('common.navigation.orders')}</span>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <CheckoutForm
              register={register}
              setValue={setValue}
              errors={errors}
              isSubmitting={isSubmitting}
              shippingMethod={shippingMethod}
              paymentMethod={paymentMethod}
              paymentMethods={paymentMethods}
              logoErrors={logoErrors}
              setLogoErrors={setLogoErrors}
              error={error}
              setError={setError}
            />
            <OrderSummary
              cart={cart}
              orderSummary={orderSummary}
              shippingMethod={shippingMethod}
              shippingCity={shippingCity}
              loadingDeliveryPrice={loadingDeliveryPrice}
              deliveryPrice={deliveryPrice}
              error={error}
              isSubmitting={isSubmitting}
              onPlaceOrder={(e) => {
                if (e) {
                  handlePlaceOrder(e);
                } else {
                  handlePlaceOrder({ preventDefault: () => {} } as React.FormEvent);
                }
              }}
            />
          </div>
        </form>

        <CheckoutModals
          showShippingModal={showShippingModal}
          setShowShippingModal={setShowShippingModal}
          showCardModal={showCardModal}
          setShowCardModal={setShowCardModal}
          register={register}
          setValue={setValue}
          handleSubmit={handleSubmit}
          errors={errors}
          isSubmitting={isSubmitting}
          shippingMethod={shippingMethod}
          paymentMethod={paymentMethod}
          shippingCity={shippingCity}
          cart={cart}
          orderSummary={orderSummary}
          loadingDeliveryPrice={loadingDeliveryPrice}
          deliveryPrice={deliveryPrice}
          logoErrors={logoErrors}
          setLogoErrors={setLogoErrors}
          isLoggedIn={isLoggedIn}
          onSubmit={onSubmit}
        />

      </div>
    </div>
  );
}
