'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, Button } from '@shop/ui';
import { apiClient, ApiError } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n-client';
import {
  adminBulkDangerButtonClass,
  adminFilterLabelClass,
  adminFormControlClass,
  adminPaginationNavButtonClass,
  adminSolidButtonClass,
  adminSectionSubtitleClass,
  dashboardCardPadding,
  dashboardEmptyText,
  dashboardInsetRow,
  dashboardMainClass,
} from '../components/dashboardUi';

interface DeliveryLocation {
  id?: string;
  country: string;
  city: string;
  price: number;
}

interface DeliverySettings {
  locations: DeliveryLocation[];
}

function saveErrorDetail(err: unknown): string {
  if (err instanceof ApiError && err.data && typeof err.data === 'object' && err.data !== null) {
    const d = (err.data as { detail?: unknown }).detail;
    if (typeof d === 'string' && d.length > 0) return d;
  }
  if (err instanceof Error && err.message.length > 0) return err.message;
  return 'Failed to save delivery settings';
}

export default function DeliveryPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/admin');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  const fetchDeliverySettings = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🚚 [ADMIN] Fetching delivery settings...');
      const data = await apiClient.get<DeliverySettings>('/api/v1/admin/delivery');
      setLocations(data.locations || []);
      console.log('✅ [ADMIN] Delivery settings loaded:', data);
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error fetching delivery settings:', err);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      void fetchDeliverySettings();
    }
  }, [isLoggedIn, isAdmin, fetchDeliverySettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('🚚 [ADMIN] Saving delivery settings...', { locations });
      await apiClient.put('/api/v1/admin/delivery', { locations });
      alert(t('admin.delivery.savedSuccess'));
      console.log('✅ [ADMIN] Delivery settings saved');
      await fetchDeliverySettings();
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error saving delivery settings:', err);
      alert(t('admin.delivery.errorSaving').replace('{message}', saveErrorDetail(err)));
    } finally {
      setSaving(false);
    }
  };

  const handleAddLocation = () => {
    setLocations([...locations, { country: '', city: '', price: 1000 }]);
  };

  const handleUpdateLocation = (index: number, field: keyof DeliveryLocation, value: string | number) => {
    const updated = [...locations];
    updated[index] = { ...updated[index], [field]: value };
    setLocations(updated);
  };

  const handleDeleteLocation = (index: number) => {
    if (confirm(t('admin.delivery.deleteLocation'))) {
      setLocations(locations.filter((_, i) => i !== index));
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

  const inputClass = `${adminFormControlClass} w-full`;

  return (
    <div className={dashboardMainClass}>
      <section className="rounded-xl border border-admin-brand-2/18 bg-white p-5 shadow-[0_1px_2px_rgba(47,63,61,0.05),0_8px_24px_-8px_rgba(47,63,61,0.1)] sm:p-6">
        <h1 className="text-xl font-semibold tracking-tight text-admin-brand">{t('admin.delivery.title')}</h1>
        <p className={`mt-1 max-w-2xl ${adminSectionSubtitleClass}`}>{t('admin.delivery.deliveryPricesByLocation')}</p>
      </section>

      <Card variant="admin" className={dashboardCardPadding}>
        <div className="mb-5 flex justify-end">
          <button
            type="button"
            onClick={handleAddLocation}
            disabled={saving}
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${adminSolidButtonClass}`}
          >
            {t('admin.delivery.addLocation')}
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
            <p className={dashboardEmptyText}>{t('admin.common.loading')}</p>
          </div>
        ) : locations.length === 0 ? (
          <div className="py-10 text-center">
            <p className={dashboardEmptyText}>{t('admin.delivery.noLocations')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {locations.map((location, index) => (
              <div key={location.id ?? `row-${index}`} className={dashboardInsetRow}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label htmlFor={`delivery-country-${index}`} className={adminFilterLabelClass}>
                      {t('admin.delivery.country')}
                    </label>
                    <input
                      id={`delivery-country-${index}`}
                      type="text"
                      value={location.country}
                      onChange={(e) => handleUpdateLocation(index, 'country', e.target.value)}
                      className={inputClass}
                      placeholder={t('admin.delivery.countryPlaceholder')}
                    />
                  </div>
                  <div>
                    <label htmlFor={`delivery-city-${index}`} className={adminFilterLabelClass}>
                      {t('admin.delivery.city')}
                    </label>
                    <input
                      id={`delivery-city-${index}`}
                      type="text"
                      value={location.city}
                      onChange={(e) => handleUpdateLocation(index, 'city', e.target.value)}
                      className={inputClass}
                      placeholder={t('admin.delivery.cityPlaceholder')}
                    />
                  </div>
                  <div>
                    <label htmlFor={`delivery-price-${index}`} className={adminFilterLabelClass}>
                      {t('admin.delivery.price')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        id={`delivery-price-${index}`}
                        type="number"
                        value={location.price}
                        onChange={(e) => handleUpdateLocation(index, 'price', parseFloat(e.target.value) || 0)}
                        className={`${inputClass} min-w-0 flex-1`}
                        placeholder={t('admin.delivery.pricePlaceholder')}
                        min={0}
                        step={100}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteLocation(index)}
                        className={`inline-flex shrink-0 items-center justify-center rounded-md px-3 py-2 ${adminBulkDangerButtonClass}`}
                        disabled={saving}
                        aria-label={t('admin.common.delete')}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="primary"
          onClick={() => void handleSave()}
          disabled={saving || locations.length === 0}
          className={adminSolidButtonClass}
        >
          {saving ? t('admin.delivery.saving') : t('admin.delivery.saveSettings')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push('/admin')}
          disabled={saving}
          className={adminPaginationNavButtonClass}
        >
          {t('admin.delivery.cancel')}
        </Button>
      </div>
    </div>
  );
}
