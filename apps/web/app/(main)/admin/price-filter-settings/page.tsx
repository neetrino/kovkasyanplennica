'use client';

import type { ChangeEvent } from 'react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, Button } from '@shop/ui';
import { apiClient, ApiError } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n-client';
import {
  adminAlertSuccessClass,
  adminFilterLabelClass,
  adminFormControlClass,
  adminPaginationNavButtonClass,
  adminSolidButtonClass,
  adminSectionSubtitleClass,
  dashboardCardPadding,
  dashboardEmptyText,
  dashboardMainClass,
  dashboardSectionTitle,
} from '../components/dashboardUi';

function saveErrorDetail(err: unknown): string {
  if (err instanceof ApiError && err.data && typeof err.data === 'object' && err.data !== null) {
    const d = (err.data as { detail?: unknown }).detail;
    if (typeof d === 'string' && d.length > 0) return d;
  }
  if (err instanceof Error && err.message.length > 0) return err.message;
  return 'Failed to save';
}

export default function PriceFilterSettingsPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [stepSizeUSD, setStepSizeUSD] = useState<string>('');
  const [stepSizeAMD, setStepSizeAMD] = useState<string>('');
  const [stepSizeRUB, setStepSizeRUB] = useState<string>('');
  const [stepSizeGEL, setStepSizeGEL] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const prevStepSizeRef = useRef<string>('');
  const isUpdatingRef = useRef<boolean>(false);

  const fetchSettings = useCallback(async () => {
    try {
      console.log('⚙️ [PRICE FILTER SETTINGS] Fetching settings...');
      setLoading(true);
      const response = await apiClient.get<{
        minPrice?: number;
        maxPrice?: number;
        stepSize?: number;
        stepSizePerCurrency?: {
          USD?: number;
          AMD?: number;
          RUB?: number;
          GEL?: number;
        };
      }>('/api/v1/admin/settings/price-filter');
      const minPriceStr = response.minPrice?.toString() || '';
      const maxPriceStr = response.maxPrice?.toString() || '';
      const per = response.stepSizePerCurrency || {};
      const fallbackStep = response.stepSize?.toString() || '';

      setMinPrice(minPriceStr);
      setMaxPrice(maxPriceStr);
      setStepSizeUSD(per.USD !== undefined ? per.USD.toString() : fallbackStep);
      setStepSizeAMD(per.AMD !== undefined ? per.AMD.toString() : '');
      setStepSizeRUB(per.RUB !== undefined ? per.RUB.toString() : '');
      setStepSizeGEL(per.GEL !== undefined ? per.GEL.toString() : '');
      prevStepSizeRef.current = fallbackStep;

      console.log('✅ [PRICE FILTER SETTINGS] Settings loaded:', response);
    } catch (err: unknown) {
      console.error('❌ [PRICE FILTER SETTINGS] Error fetching settings:', err);
      setMinPrice('');
      setMaxPrice('');
      setStepSizeUSD('');
      setStepSizeAMD('');
      setStepSizeRUB('');
      setStepSizeGEL('');
      prevStepSizeRef.current = '';
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStepSizeChange = (newValue: string) => {
    if (isUpdatingRef.current) return;

    const prevStep = prevStepSizeRef.current;

    if (!prevStep) {
      prevStepSizeRef.current = newValue;
      setStepSizeUSD(newValue);
      return;
    }

    const prevStepNum = parseFloat(prevStep);
    const newStepNum = parseFloat(newValue);

    if (isNaN(newStepNum) || newValue.trim() === '') {
      prevStepSizeRef.current = newValue;
      setStepSizeUSD(newValue);
      return;
    }

    const difference = newStepNum - prevStepNum;

    const prevMin = minPrice.trim();
    const prevMax = maxPrice.trim();

    if (prevMin && prevMax) {
      const prevMinNum = parseFloat(prevMin);
      const prevMaxNum = parseFloat(prevMax);

      if (!isNaN(prevMinNum) && !isNaN(prevMaxNum)) {
        const newMinNum = prevMinNum + difference;
        const newMaxNum = prevMaxNum + difference;

        isUpdatingRef.current = true;
        setStepSizeUSD(newValue);
        setMinPrice(newMinNum > 0 ? newMinNum.toString() : '');
        setMaxPrice(newMaxNum > 0 ? newMaxNum.toString() : '');
        prevStepSizeRef.current = newValue;

        console.log('🔄 [PRICE FILTER] StepSize changed:', {
          prevStep: prevStepNum,
          newStep: newStepNum,
          difference,
          prevMin: prevMinNum,
          newMin: newMinNum,
          prevMax: prevMaxNum,
          newMax: newMaxNum,
        });

        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
        return;
      }
    }

    prevStepSizeRef.current = newValue;
    setStepSizeUSD(newValue);
  };

  const handleSave = async () => {
    const minValue = minPrice.trim() ? parseFloat(minPrice) : null;
    const maxValue = maxPrice.trim() ? parseFloat(maxPrice) : null;
    const stepValueUSD = stepSizeUSD.trim() ? parseFloat(stepSizeUSD) : null;
    const stepValueAMD = stepSizeAMD.trim() ? parseFloat(stepSizeAMD) : null;
    const stepValueRUB = stepSizeRUB.trim() ? parseFloat(stepSizeRUB) : null;
    const stepValueGEL = stepSizeGEL.trim() ? parseFloat(stepSizeGEL) : null;

    if (minValue !== null && (isNaN(minValue) || minValue < 0)) {
      alert(t('admin.priceFilter.minPriceInvalid'));
      return;
    }

    if (maxValue !== null && (isNaN(maxValue) || maxValue < 0)) {
      alert(t('admin.priceFilter.maxPriceInvalid'));
      return;
    }

    const validateStep = (value: number | null, label: string) => {
      if (value !== null && (isNaN(value) || value <= 0)) {
        alert(t('admin.priceFilter.stepSizeInvalid').replace('{label}', label));
        return false;
      }
      return true;
    };

    if (!validateStep(stepValueUSD, t('admin.priceFilter.stepSizeUsd'))) return;
    if (!validateStep(stepValueAMD, t('admin.priceFilter.stepSizeAmd'))) return;
    if (!validateStep(stepValueRUB, t('admin.priceFilter.stepSizeRub'))) return;
    if (!validateStep(stepValueGEL, t('admin.priceFilter.stepSizeGel'))) return;

    if (minValue !== null && maxValue !== null && minValue >= maxValue) {
      alert(t('admin.priceFilter.minMustBeLess'));
      return;
    }

    setSaving(true);
    try {
      console.log('⚙️ [PRICE FILTER SETTINGS] Saving settings...', {
        minValue,
        maxValue,
        stepValueUSD,
        stepValueAMD,
        stepValueRUB,
        stepValueGEL,
      });

      const stepSizePerCurrency: {
        USD?: number;
        AMD?: number;
        RUB?: number;
        GEL?: number;
      } = {};

      if (stepValueUSD !== null) stepSizePerCurrency.USD = stepValueUSD;
      if (stepValueAMD !== null) stepSizePerCurrency.AMD = stepValueAMD;
      if (stepValueRUB !== null) stepSizePerCurrency.RUB = stepValueRUB;
      if (stepValueGEL !== null) stepSizePerCurrency.GEL = stepValueGEL;
      await apiClient.put('/api/v1/admin/settings/price-filter', {
        minPrice: minValue,
        maxPrice: maxValue,
        stepSize: stepValueUSD,
        stepSizePerCurrency: Object.keys(stepSizePerCurrency).length ? stepSizePerCurrency : null,
      });

      alert(t('admin.priceFilter.savedSuccess'));
      console.log('✅ [PRICE FILTER SETTINGS] Settings saved');
    } catch (err: unknown) {
      console.error('❌ [PRICE FILTER SETTINGS] Error saving settings:', err);
      alert(t('admin.priceFilter.errorSaving').replace('{message}', saveErrorDetail(err)));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!isLoading && isLoggedIn && isAdmin) {
      fetchSettings();
    }
  }, [isLoading, isLoggedIn, isAdmin, fetchSettings]);

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn) {
        console.log('❌ [PRICE FILTER SETTINGS] User not logged in, redirecting to login...');
        router.push('/login');
        return;
      }
      if (!isAdmin) {
        console.log('❌ [PRICE FILTER SETTINGS] User is not admin, redirecting to home...');
        router.push('/');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
          <p className="text-sm text-admin-brand/55">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  const numberInputClass = `${adminFormControlClass} w-full`;

  return (
    <div className={dashboardMainClass}>
      <section className="rounded-xl border border-admin-brand-2/18 bg-white p-5 shadow-[0_1px_2px_rgba(47,63,61,0.05),0_8px_24px_-8px_rgba(47,63,61,0.1)] sm:p-6">
        <h1 className="text-xl font-semibold tracking-tight text-admin-brand">{t('admin.priceFilter.title')}</h1>
        <p className={`mt-1 max-w-2xl ${adminSectionSubtitleClass}`}>{t('admin.priceFilter.subtitle')}</p>
      </section>

      <Card variant="admin" className={dashboardCardPadding}>
        <div className="mb-6 border-b border-admin-brand-2/12 pb-4">
          <h2 className={dashboardSectionTitle}>{t('admin.priceFilter.priceFilterDefaultRange')}</h2>
          <p className={`mt-2 text-sm ${adminSectionSubtitleClass}`}>{t('admin.priceFilter.stepSizeDescription')}</p>
        </div>

        {loading ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
            <p className={dashboardEmptyText}>{t('admin.priceFilter.loadingSettings')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="price-filter-step-usd" className={adminFilterLabelClass}>
                  {t('admin.priceFilter.stepSizeUsd')}
                </label>
                <input
                  id="price-filter-step-usd"
                  type="number"
                  value={stepSizeUSD}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleStepSizeChange(e.target.value)}
                  placeholder={t('admin.priceFilter.usdPlaceholder')}
                  min={1}
                  step={1}
                  className={numberInputClass}
                />
              </div>
              <div>
                <label htmlFor="price-filter-step-amd" className={adminFilterLabelClass}>
                  {t('admin.priceFilter.stepSizeAmd')}
                </label>
                <input
                  id="price-filter-step-amd"
                  type="number"
                  value={stepSizeAMD}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setStepSizeAMD(e.target.value)}
                  placeholder={t('admin.priceFilter.amdPlaceholder')}
                  min={1}
                  step={1}
                  className={numberInputClass}
                />
              </div>
              <div>
                <label htmlFor="price-filter-step-rub" className={adminFilterLabelClass}>
                  {t('admin.priceFilter.stepSizeRub')}
                </label>
                <input
                  id="price-filter-step-rub"
                  type="number"
                  value={stepSizeRUB}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setStepSizeRUB(e.target.value)}
                  placeholder={t('admin.priceFilter.rubPlaceholder')}
                  min={1}
                  step={1}
                  className={numberInputClass}
                />
              </div>
              <div>
                <label htmlFor="price-filter-step-gel" className={adminFilterLabelClass}>
                  {t('admin.priceFilter.stepSizeGel')}
                </label>
                <input
                  id="price-filter-step-gel"
                  type="number"
                  value={stepSizeGEL}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setStepSizeGEL(e.target.value)}
                  placeholder={t('admin.priceFilter.gelPlaceholder')}
                  min={1}
                  step={1}
                  className={numberInputClass}
                />
              </div>
            </div>

            <div className={adminAlertSuccessClass}>
              <div className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-admin-brand/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="min-w-0 text-sm text-admin-brand/90">
                  <p className="mb-2 font-semibold text-admin-brand">{t('admin.priceFilter.howItWorks')}</p>
                  <ul className="list-inside list-disc space-y-1 text-admin-brand/80">
                    <li>{t('admin.priceFilter.stepSizeControls')}</li>
                    <li>{t('admin.priceFilter.differentStepSizes')}</li>
                    <li>{t('admin.priceFilter.usersCanAdjust')}</li>
                    <li>{t('admin.priceFilter.changesTakeEffect')}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-admin-brand-2/12 pt-4">
              <Button
                type="button"
                variant="primary"
                onClick={() => void handleSave()}
                disabled={saving}
                className={`px-6 ${adminSolidButtonClass}`}
              >
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-admin-flesh/30 border-b-admin-flesh" />
                    {t('admin.priceFilter.saving')}
                  </span>
                ) : (
                  t('admin.priceFilter.saveSettings')
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setMinPrice('');
                  setMaxPrice('');
                  setStepSizeUSD('');
                  setStepSizeAMD('');
                  setStepSizeRUB('');
                  setStepSizeGEL('');
                  prevStepSizeRef.current = '';
                }}
                className={adminPaginationNavButtonClass}
              >
                {t('admin.priceFilter.clear')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
