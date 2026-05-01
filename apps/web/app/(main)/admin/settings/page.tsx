'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, Button } from '@shop/ui';
import { apiClient, ApiError } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n-client';
import { CURRENCIES, clearCurrencyRatesCache } from '@/lib/currency';
import {
  adminFilterLabelClass,
  adminFormControlClass,
  adminPaginationNavButtonClass,
  adminSolidButtonClass,
  adminSectionSubtitleClass,
  dashboardCardPadding,
  dashboardEmptyText,
  dashboardMainClass,
  dashboardRowMeta,
  dashboardSectionTitle,
} from '../components/dashboardUi';

interface Settings {
  defaultCurrency?: string;
  globalDiscount?: number;
  categoryDiscounts?: Record<string, number>;
  brandDiscounts?: Record<string, number>;
  currencyRates?: Record<string, number>;
}

function saveErrorDetail(err: unknown): string {
  if (err instanceof ApiError && err.data && typeof err.data === 'object' && err.data !== null) {
    const d = (err.data as { detail?: unknown }).detail;
    if (typeof d === 'string' && d.length > 0) return d;
  }
  if (err instanceof Error && err.message.length > 0) return err.message;
  return 'Failed to save settings';
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>({
    defaultCurrency: 'RUB',
    currencyRates: {
      USD: 1,
      AMD: 400,
      EUR: 0.92,
      RUB: 90,
      GEL: 2.7,
    },
  });

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/admin');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      console.log('⚙️ [ADMIN] Fetching settings...');
      const data = await apiClient.get<Settings>('/api/v1/admin/settings');
      setSettings({
        defaultCurrency: data.defaultCurrency || 'RUB',
        globalDiscount: data.globalDiscount,
        categoryDiscounts: data.categoryDiscounts,
        brandDiscounts: data.brandDiscounts,
        currencyRates: data.currencyRates || {
          USD: 1,
          AMD: 400,
          EUR: 0.92,
          RUB: 90,
          GEL: 2.7,
        },
      });
      console.log('✅ [ADMIN] Settings loaded:', data);
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error fetching settings:', err);
      setSettings({
        defaultCurrency: 'RUB',
        currencyRates: {
          USD: 1,
          AMD: 400,
          EUR: 0.92,
          RUB: 90,
          GEL: 2.7,
        },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      void fetchSettings();
    }
  }, [isLoggedIn, isAdmin, fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('⚙️ [ADMIN] Saving settings...', settings);

      const currencyRatesToSave = {
        USD: 1,
        AMD: settings.currencyRates?.AMD ?? CURRENCIES.AMD.rate,
        EUR: settings.currencyRates?.EUR ?? CURRENCIES.EUR.rate,
        RUB: settings.currencyRates?.RUB ?? CURRENCIES.RUB.rate,
        GEL: settings.currencyRates?.GEL ?? CURRENCIES.GEL.rate,
      };

      await apiClient.put('/api/v1/admin/settings', {
        defaultCurrency: settings.defaultCurrency,
        currencyRates: currencyRatesToSave,
      });

      console.log('🔄 [ADMIN] Clearing currency rates cache...');
      clearCurrencyRatesCache();

      setTimeout(() => {
        if (typeof window !== 'undefined') {
          console.log('🔄 [ADMIN] Dispatching currency-rates-updated event...');
          window.dispatchEvent(new Event('currency-rates-updated'));
        }
      }, 100);

      alert(t('admin.settings.savedSuccess'));
      console.log('✅ [ADMIN] Settings saved, currency rates:', currencyRatesToSave);
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error saving settings:', err);
      alert(t('admin.settings.errorSaving').replace('{message}', saveErrorDetail(err)));
    } finally {
      setSaving(false);
    }
  };

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

  const controlClass = `${adminFormControlClass} w-full`;
  const checkboxClass = 'rounded border-admin-brand-2/35 text-admin-brand focus:ring-admin-brand/30';

  return (
    <div className={dashboardMainClass}>
      <section className="rounded-xl border border-admin-brand-2/18 bg-white p-5 shadow-[0_1px_2px_rgba(47,63,61,0.05),0_8px_24px_-8px_rgba(47,63,61,0.1)] sm:p-6">
        <h1 className="text-xl font-semibold tracking-tight text-admin-brand">{t('admin.settings.title')}</h1>
        <p className={`mt-1 max-w-2xl ${adminSectionSubtitleClass}`}>{t('admin.settings.currencyRatesDescription')}</p>
      </section>

      {loading ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
          <p className={dashboardEmptyText}>{t('admin.common.loading')}</p>
        </div>
      ) : (
        <>
          <Card variant="admin" className={dashboardCardPadding}>
            <h2 className={`mb-4 border-b border-admin-brand-2/12 pb-3 ${dashboardSectionTitle}`}>
              {t('admin.settings.generalSettings')}
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="settings-site-name" className={adminFilterLabelClass}>
                  {t('admin.settings.siteName')}
                </label>
                <input
                  id="settings-site-name"
                  type="text"
                  className={controlClass}
                  defaultValue={t('admin.settings.siteNamePlaceholder')}
                />
              </div>
              <div>
                <label htmlFor="settings-site-desc" className={adminFilterLabelClass}>
                  {t('admin.settings.siteDescription')}
                </label>
                <textarea
                  id="settings-site-desc"
                  className={`${controlClass} min-h-[96px] resize-y`}
                  rows={3}
                  defaultValue={t('admin.settings.siteDescriptionPlaceholder')}
                />
              </div>
            </div>
          </Card>

          <Card variant="admin" className={dashboardCardPadding}>
            <h2 className={`mb-4 border-b border-admin-brand-2/12 pb-3 ${dashboardSectionTitle}`}>
              {t('admin.settings.paymentSettings')}
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="settings-default-currency" className={adminFilterLabelClass}>
                  {t('admin.settings.defaultCurrency')}
                </label>
                <select
                  id="settings-default-currency"
                  value={settings.defaultCurrency || 'RUB'}
                  onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                  className={controlClass}
                >
                  <option value="RUB">{t('admin.settings.rub')}</option>
                </select>
              </div>
              <div>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-admin-brand/80">
                  <input type="checkbox" defaultChecked className={checkboxClass} />
                  <span className="font-medium text-admin-brand">{t('admin.settings.enableOnlinePayments')}</span>
                </label>
              </div>
            </div>
          </Card>

          <Card variant="admin" className={dashboardCardPadding}>
            <h2 className={`mb-2 border-b border-admin-brand-2/12 pb-3 ${dashboardSectionTitle}`}>
              {t('admin.settings.currencyRatesRubTitle')}
            </h2>
            <p className={`mb-4 text-sm ${adminSectionSubtitleClass}`}>
              {t('admin.settings.currencyRatesRubSectionDescription')}
            </p>
            <div className="max-w-md">
              <label htmlFor="settings-rub-rate" className={adminFilterLabelClass}>
                {t('admin.settings.currencyRatesRubFieldLabel')}
              </label>
              <input
                id="settings-rub-rate"
                type="number"
                step="0.01"
                value={settings.currencyRates?.RUB ?? ''}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '') {
                    setSettings((prev) => {
                      const next = { ...prev.currencyRates };
                      delete next.RUB;
                      return { ...prev, currencyRates: next };
                    });
                    return;
                  }
                  const numValue = parseFloat(inputValue);
                  if (!Number.isNaN(numValue) && numValue > 0) {
                    setSettings((prev) => ({
                      ...prev,
                      currencyRates: {
                        ...prev.currencyRates,
                        RUB: numValue,
                      },
                    }));
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === '' && settings.currencyRates?.RUB === undefined) {
                    setSettings((prev) => ({
                      ...prev,
                      currencyRates: {
                        ...prev.currencyRates,
                        RUB: CURRENCIES.RUB.rate,
                      },
                    }));
                  }
                }}
                className={controlClass}
                placeholder="90"
              />
              <p className={`mt-1.5 ${dashboardRowMeta}`}>{t('admin.settings.rateToUSD')}</p>
            </div>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={() => void handleSave()}
              disabled={saving}
              className={adminSolidButtonClass}
            >
              {saving ? t('admin.settings.saving') : t('admin.settings.saveSettings')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin')}
              disabled={saving}
              className={adminPaginationNavButtonClass}
            >
              {t('admin.settings.cancel')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
