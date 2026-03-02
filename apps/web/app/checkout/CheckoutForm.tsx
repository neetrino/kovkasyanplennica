'use client';

import { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { useTranslation } from '../../lib/i18n-client';
import { CheckoutFormData } from './types';

interface CheckoutFormProps {
  register: UseFormRegister<CheckoutFormData>;
  setValue: UseFormSetValue<CheckoutFormData>;
  errors: FieldErrors<CheckoutFormData>;
  isSubmitting: boolean;
  shippingMethod: 'pickup' | 'delivery';
  paymentMethod: 'idram' | 'arca' | 'cash_on_delivery';
  paymentMethods: Array<{
    id: 'idram' | 'arca' | 'cash_on_delivery';
    name: string;
    description: string;
    logo: string | null;
  }>;
  logoErrors: Record<string, boolean>;
  setLogoErrors: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

/** Reusable dark-themed label+input block */
function DarkInput({
  label,
  error,
  className = '',
  ...props
}: {
  label: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="w-full">
      <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#fff4de]/50 mb-1.5">
        {label}
      </label>
      <input
        className={`w-full px-4 py-3 bg-[#2F3F3D] border ${
          error ? 'border-red-400/60' : 'border-[#3d504e]'
        } rounded-xl text-[#fff4de] text-sm placeholder-[#fff4de]/25 focus:outline-none focus:border-[#7CB342]/70 focus:ring-1 focus:ring-[#7CB342]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

/** Section card wrapper */
function SectionCard({
  title,
  icon,
  children,
  errorMessage,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  errorMessage?: string;
}) {
  return (
    <div className="bg-[#3d504e]/40 border border-[#3d504e] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#3d504e] bg-[#3d504e]/60">
        <span className="text-[#7CB342]">{icon}</span>
        <h2 className="text-[#fff4de] font-light italic text-lg">{title}</h2>
      </div>
      <div className="p-6">
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-400/10 border border-red-400/30 rounded-xl">
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function CheckoutForm({
  register,
  setValue,
  errors,
  isSubmitting,
  shippingMethod,
  paymentMethod,
  paymentMethods,
  logoErrors,
  setLogoErrors,
  error,
  setError,
}: CheckoutFormProps) {
  const { t } = useTranslation();

  return (
    <div className="lg:col-span-2 space-y-5">

      {/* ── Contact Information ── */}
      <SectionCard
        title={t('checkout.contactInformation')}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DarkInput
              label={t('checkout.form.firstName')}
              type="text"
              {...register('firstName')}
              error={errors.firstName?.message}
              disabled={isSubmitting}
            />
            <DarkInput
              label={t('checkout.form.lastName')}
              type="text"
              {...register('lastName')}
              error={errors.lastName?.message}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DarkInput
              label={t('checkout.form.email')}
              type="email"
              {...register('email')}
              error={errors.email?.message}
              disabled={isSubmitting}
            />
            <DarkInput
              label={t('checkout.form.phone')}
              type="tel"
              placeholder={t('checkout.placeholders.phone')}
              {...register('phone')}
              error={errors.phone?.message}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </SectionCard>

      {/* ── Shipping Method ── */}
      <SectionCard
        title={t('checkout.shippingMethod')}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        }
        errorMessage={errors.shippingMethod?.message}
      >
        <div className="space-y-3">
          {(['pickup', 'delivery'] as const).map((method) => {
            const isActive = shippingMethod === method;
            return (
              <label
                key={method}
                className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'border-[#7CB342]/70 bg-[#7CB342]/10'
                    : 'border-[#3d504e] hover:border-[#fff4de]/20 bg-[#2F3F3D]/40'
                }`}
              >
                {/* Custom radio */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    isActive ? 'border-[#7CB342]' : 'border-[#3d504e]'
                  }`}
                >
                  {isActive && <div className="w-2.5 h-2.5 rounded-full bg-[#7CB342]" />}
                </div>
                <input
                  type="radio"
                  {...register('shippingMethod')}
                  value={method}
                  checked={isActive}
                  onChange={(e) => setValue('shippingMethod', e.target.value as 'pickup' | 'delivery')}
                  className="sr-only"
                  disabled={isSubmitting}
                />
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-[#7CB342]/20' : 'bg-[#3d504e]/60'}`}>
                    {method === 'pickup' ? (
                      <svg className={`w-4 h-4 ${isActive ? 'text-[#7CB342]' : 'text-[#fff4de]/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    ) : (
                      <svg className={`w-4 h-4 ${isActive ? 'text-[#7CB342]' : 'text-[#fff4de]/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-[#fff4de] text-sm font-medium">
                      {method === 'pickup' ? t('checkout.shipping.storePickup') : t('checkout.shipping.delivery')}
                    </p>
                    <p className="text-[#fff4de]/45 text-xs mt-0.5">
                      {method === 'pickup' ? t('checkout.shipping.storePickupDescription') : t('checkout.shipping.deliveryDescription')}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </SectionCard>

      {/* ── Shipping Address (delivery only) ── */}
      {shippingMethod === 'delivery' && (
        <SectionCard
          title={t('checkout.shippingAddress')}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          errorMessage={
            (error && error.includes('shipping address'))
              ? error
              : (errors.shippingAddress?.message || errors.shippingCity?.message)
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DarkInput
              label={t('checkout.form.address')}
              type="text"
              placeholder={t('checkout.placeholders.address')}
              {...register('shippingAddress', {
                onChange: () => {
                  if (error && error.includes('shipping address')) setError(null);
                },
              })}
              error={errors.shippingAddress?.message}
              disabled={isSubmitting}
            />
            <DarkInput
              label={t('checkout.form.city')}
              type="text"
              placeholder={t('checkout.placeholders.city')}
              {...register('shippingCity', {
                onChange: () => {
                  if (error && error.includes('shipping address')) setError(null);
                },
              })}
              error={errors.shippingCity?.message}
              disabled={isSubmitting}
            />
          </div>
        </SectionCard>
      )}

      {/* ── Payment Method ── */}
      <SectionCard
        title={t('checkout.paymentMethod')}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        }
        errorMessage={errors.paymentMethod?.message}
      >
        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const isActive = paymentMethod === method.id;
            return (
              <label
                key={method.id}
                className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'border-[#7CB342]/70 bg-[#7CB342]/10'
                    : 'border-[#3d504e] hover:border-[#fff4de]/20 bg-[#2F3F3D]/40'
                }`}
              >
                {/* Custom radio */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    isActive ? 'border-[#7CB342]' : 'border-[#3d504e]'
                  }`}
                >
                  {isActive && <div className="w-2.5 h-2.5 rounded-full bg-[#7CB342]" />}
                </div>
                <input
                  type="radio"
                  {...register('paymentMethod')}
                  value={method.id}
                  checked={isActive}
                  onChange={(e) => setValue('paymentMethod', e.target.value as 'idram' | 'arca' | 'cash_on_delivery')}
                  className="sr-only"
                  disabled={isSubmitting}
                />

                {/* Logo */}
                <div className="w-16 h-10 flex-shrink-0 bg-[#2F3F3D] border border-[#3d504e] rounded-lg flex items-center justify-center overflow-hidden">
                  {!method.logo || logoErrors[method.id] ? (
                    <svg className="w-6 h-6 text-[#fff4de]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ) : (
                    <img
                      src={method.logo}
                      alt={method.name}
                      className="w-full h-full object-contain p-1.5"
                      loading="lazy"
                      onError={() => setLogoErrors((prev) => ({ ...prev, [method.id]: true }))}
                    />
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-[#fff4de] text-sm font-medium">{method.name}</p>
                  <p className="text-[#fff4de]/45 text-xs mt-0.5">{method.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </SectionCard>

    </div>
  );
}
