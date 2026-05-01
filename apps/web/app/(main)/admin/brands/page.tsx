'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, Button } from '@shop/ui';
import { apiClient, ApiError } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n-client';
import {
  adminBulkDangerButtonClass,
  adminFilterLabelClass,
  adminFormControlClass,
  adminGhostIconButtonClass,
  adminModalBackdropAlignStartClass,
  adminModalTitleClass,
  adminPaginationNavButtonClass,
  adminSolidButtonClass,
  adminSectionSubtitleClass,
  dashboardCardPadding,
  dashboardEmptyText,
  dashboardInsetRowCompact,
  dashboardMainClass,
  dashboardRowMeta,
  dashboardRowPrimaryMedium,
} from '../components/dashboardUi';

interface Brand {
  id: string;
  name: string;
  slug: string;
}

function apiErrorDetail(err: unknown): string {
  if (err instanceof ApiError && err.data && typeof err.data === 'object' && err.data !== null) {
    const d = (err.data as { detail?: unknown }).detail;
    if (typeof d === 'string' && d.length > 0) return d;
  }
  if (err instanceof Error && err.message.length > 0) return err.message;
  return 'Unknown error occurred';
}

const brandModalPanelClass =
  'relative max-h-[calc(100vh-6rem)] w-full max-w-md shrink-0 overflow-y-auto overscroll-contain rounded-xl border border-admin-brand-2/20 bg-white p-6 shadow-[0_24px_60px_-16px_rgba(47,63,61,0.28)]';

function BrandsSection() {
  const { t } = useTranslation();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🏷️ [ADMIN] Fetching brands...');
      const response = await apiClient.get<{ data: Brand[] }>('/api/v1/admin/brands');
      setBrands(response.data || []);
      console.log('✅ [ADMIN] Brands loaded:', response.data?.length || 0);
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error fetching brands:', err);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBrands();
  }, [fetchBrands]);

  const handleDeleteBrand = async (brandId: string, brandName: string) => {
    if (!confirm(t('admin.brands.deleteConfirm').replace('{name}', brandName))) {
      return;
    }

    try {
      console.log(`🗑️ [ADMIN] Deleting brand: ${brandName} (${brandId})`);
      await apiClient.delete(`/api/v1/admin/brands/${brandId}`);
      console.log('✅ [ADMIN] Brand deleted successfully');
      await fetchBrands();
      alert(t('admin.brands.deletedSuccess'));
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error deleting brand:', err);
      alert(`${t('admin.brands.errorDeleting')}\n\n${apiErrorDetail(err)}`);
    }
  };

  const handleOpenAddModal = () => {
    setEditingBrand(null);
    setFormData({ name: '' });
    setShowModal(true);
  };

  const handleOpenEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({ name: brand.name });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBrand(null);
    setFormData({ name: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert(t('admin.brands.nameRequired'));
      return;
    }

    setSubmitting(true);
    try {
      if (editingBrand) {
        console.log('🔄 [ADMIN] Updating brand:', editingBrand.id);
        await apiClient.put(`/api/v1/admin/brands/${editingBrand.id}`, {
          name: formData.name.trim(),
        });
        console.log('✅ [ADMIN] Brand updated successfully');
        alert(t('admin.brands.updatedSuccess'));
      } else {
        console.log('➕ [ADMIN] Creating brand:', formData.name);
        await apiClient.post('/api/v1/admin/brands', {
          name: formData.name.trim(),
        });
        console.log('✅ [ADMIN] Brand created successfully');
        alert(t('admin.brands.createdSuccess'));
      }

      await fetchBrands();
      handleCloseModal();
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error saving brand:', err);
      alert(`${t('admin.brands.errorSaving')}\n\n${apiErrorDetail(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button
          type="button"
          onClick={handleOpenAddModal}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${adminSolidButtonClass}`}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('admin.brands.addNew')}
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
          <p className={dashboardEmptyText}>{t('admin.brands.loading')}</p>
        </div>
      ) : brands.length === 0 ? (
        <p className={`py-2 ${dashboardEmptyText}`}>{t('admin.brands.noBrands')}</p>
      ) : (
        <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
          {brands.map((brand) => (
            <div key={brand.id} className={`flex items-center justify-between gap-3 ${dashboardInsetRowCompact}`}>
              <div className="min-w-0">
                <div className={dashboardRowPrimaryMedium}>{brand.name}</div>
                <div className={`font-mono ${dashboardRowMeta}`}>{brand.slug}</div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditModal(brand)}
                  className={adminPaginationNavButtonClass}
                >
                  <span className="inline-flex items-center gap-1">
                    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    {t('admin.brands.edit')}
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleDeleteBrand(brand.id, brand.name)}
                  className={adminBulkDangerButtonClass}
                >
                  <span className="inline-flex items-center gap-1">
                    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    {t('admin.brands.delete')}
                  </span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal ? (
        <div
          className={adminModalBackdropAlignStartClass}
          role="dialog"
          aria-modal="true"
          aria-labelledby="brand-modal-title"
          onClick={handleCloseModal}
        >
          <div className={brandModalPanelClass} onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between border-b border-admin-brand-2/15 pb-4">
              <h2 id="brand-modal-title" className={adminModalTitleClass}>
                {editingBrand ? t('admin.brands.editBrand') : t('admin.brands.addNewBrand')}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className={`flex h-9 w-9 items-center justify-center rounded-full border border-admin-brand-2/20 text-lg leading-none ${adminGhostIconButtonClass}`}
                aria-label={t('admin.common.close')}
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div>
                <label htmlFor="brand-name" className={adminFilterLabelClass}>
                  {t('admin.brands.brandName')}
                </label>
                <input
                  id="brand-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`${adminFormControlClass} w-full`}
                  placeholder={t('admin.brands.enterBrandName')}
                  required
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-admin-brand-2/12 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className={adminPaginationNavButtonClass}
                >
                  {t('admin.brands.cancel')}
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting} className={adminSolidButtonClass}>
                  {submitting ? t('admin.brands.saving') : editingBrand ? t('admin.brands.update') : t('admin.brands.create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function BrandsPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/admin');
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

  return (
    <div className={dashboardMainClass}>
      <section className="rounded-xl border border-admin-brand-2/18 bg-white p-5 shadow-[0_1px_2px_rgba(47,63,61,0.05),0_8px_24px_-8px_rgba(47,63,61,0.1)] sm:p-6">
        <h1 className="text-xl font-semibold tracking-tight text-admin-brand">{t('admin.brands.title')}</h1>
        <p className={`mt-1 max-w-2xl ${adminSectionSubtitleClass}`}>{t('admin.brands.subtitle')}</p>
      </section>

      <Card variant="admin" className={dashboardCardPadding}>
        <BrandsSection />
      </Card>
    </div>
  );
}
