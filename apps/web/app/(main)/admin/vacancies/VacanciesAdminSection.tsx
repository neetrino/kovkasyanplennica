'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@shop/ui';
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
  dashboardBadgeNeutral,
  dashboardBadgePaid,
  dashboardEmptyText,
  dashboardInsetRowCompact,
  dashboardRowMeta,
  dashboardRowPrimaryMedium,
} from '../components/dashboardUi';

interface VacancyItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  salary: string | null;
  location: string | null;
  contactPhone: string | null;
  published: boolean;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function extractDetail(err: unknown): string {
  if (err instanceof ApiError && err.data && typeof err.data === 'object' && err.data !== null) {
    const d = (err.data as { detail?: string }).detail;
    if (typeof d === 'string') return d;
  }
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

const vacancyModalPanelClass =
  'relative max-h-[calc(100vh-6rem)] w-full max-w-lg shrink-0 overflow-y-auto overscroll-contain rounded-xl border border-admin-brand-2/20 bg-white p-6 shadow-[0_24px_60px_-16px_rgba(47,63,61,0.28)]';

export function VacanciesAdminSection() {
  const { t } = useTranslation();
  const [items, setItems] = useState<VacancyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<VacancyItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    salary: '',
    location: '',
    contactPhone: '',
    published: true,
  });

  const fetchVacancies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<{ data: VacancyItem[] }>('/api/v1/admin/vacancies');
      setItems(res.data ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchVacancies();
  }, [fetchVacancies]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      imageUrl: '',
      salary: '',
      location: '',
      contactPhone: '',
      published: true,
    });
    setShowModal(true);
  };

  const openEdit = (row: VacancyItem) => {
    setEditing(row);
    setForm({
      title: row.title,
      description: row.description,
      imageUrl: row.imageUrl ?? '',
      salary: row.salary ?? '',
      location: row.location ?? '',
      contactPhone: row.contactPhone ?? '',
      published: row.published,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert(t('admin.vacancies.uploadFailed'));
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const res = await apiClient.post<{ urls: string[] }>('/api/v1/admin/products/upload-images', {
        images: [dataUrl],
        namespace: 'vacancies',
      });
      const url = res.urls?.[0];
      if (url) setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      alert(`${t('admin.vacancies.uploadFailed')}: ${extractDetail(err)}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (row: VacancyItem) => {
    if (!confirm(t('admin.vacancies.deleteConfirm').replace('{title}', row.title))) return;
    try {
      await apiClient.delete(`/api/v1/admin/vacancies/${row.id}`);
      alert(t('admin.vacancies.deletedSuccess'));
      void fetchVacancies();
    } catch (err) {
      alert(`${t('admin.vacancies.errorDeleting')} ${extractDetail(err)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert(t('admin.vacancies.titleRequired'));
      return;
    }
    if (!form.description.trim()) {
      alert(t('admin.vacancies.descriptionRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim() || null,
        salary: form.salary.trim() || null,
        location: form.location.trim() || null,
        contactPhone: form.contactPhone.trim() || null,
        published: form.published,
      };

      if (editing) {
        await apiClient.put(`/api/v1/admin/vacancies/${editing.id}`, payload);
        alert(t('admin.vacancies.updatedSuccess'));
      } else {
        await apiClient.post('/api/v1/admin/vacancies', payload);
        alert(t('admin.vacancies.createdSuccess'));
      }
      void fetchVacancies();
      closeModal();
    } catch (err) {
      alert(`${t('admin.vacancies.errorSaving')} ${extractDetail(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
        <p className={dashboardEmptyText}>{t('admin.vacancies.loading')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${adminSolidButtonClass}`}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('admin.vacancies.addNew')}
        </button>
      </div>

      {items.length === 0 ? (
        <p className={`py-2 ${dashboardEmptyText}`}>{t('admin.vacancies.noItems')}</p>
      ) : (
        <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
          {items.map((row) => (
            <div
              key={row.id}
              className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${dashboardInsetRowCompact}`}
            >
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <div className={dashboardRowPrimaryMedium}>{row.title}</div>
                  <span
                    className={row.published ? dashboardBadgePaid : dashboardBadgeNeutral}
                    title={row.published ? t('admin.vacancies.fieldPublished') : ''}
                  >
                    {row.published ? '●' : '○'}
                  </span>
                </div>
                <div className={`truncate ${dashboardRowMeta}`}>
                  {row.contactPhone ? row.contactPhone : ''}
                  {row.salary ? `${row.contactPhone ? ' · ' : ''}${row.salary}` : ''}
                  {row.location ? `${row.contactPhone || row.salary ? ' · ' : ''}${row.location}` : ''}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(row)}
                  className={adminPaginationNavButtonClass}
                >
                  {t('admin.vacancies.edit')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleDelete(row)}
                  className={adminBulkDangerButtonClass}
                >
                  {t('admin.vacancies.delete')}
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
          aria-labelledby="vacancy-modal-title"
          onClick={closeModal}
        >
          <div className={vacancyModalPanelClass} onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between border-b border-admin-brand-2/15 pb-4">
              <h2 id="vacancy-modal-title" className={adminModalTitleClass}>
                {editing ? t('admin.vacancies.editTitle') : t('admin.vacancies.addTitle')}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className={`flex h-9 w-9 items-center justify-center rounded-full border border-admin-brand-2/20 text-lg leading-none ${adminGhostIconButtonClass}`}
                aria-label={t('admin.common.close')}
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div>
                <label htmlFor="vac-title" className={adminFilterLabelClass}>
                  {t('admin.vacancies.fieldTitle')}
                </label>
                <input
                  id="vac-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={`${adminFormControlClass} w-full`}
                  placeholder={t('admin.vacancies.fieldTitlePlaceholder')}
                  required
                />
              </div>

              <div>
                <label htmlFor="vac-desc" className={adminFilterLabelClass}>
                  {t('admin.vacancies.fieldDescription')}
                </label>
                <textarea
                  id="vac-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={5}
                  className={`${adminFormControlClass} min-h-[120px] w-full resize-y`}
                  placeholder={t('admin.vacancies.fieldDescriptionPlaceholder')}
                  required
                />
              </div>

              <div>
                <p className={adminFilterLabelClass}>{t('admin.vacancies.fieldImageHint')}</p>
                <input
                  id="vac-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleFile(e)}
                  disabled={uploading}
                  className="block w-full text-sm text-admin-brand/65 file:mr-3 file:rounded-md file:border-0 file:bg-admin-surface file:px-3 file:py-2 file:text-xs file:font-medium file:text-admin-brand"
                />
                {uploading ? <p className={`mt-1 text-xs ${dashboardRowMeta}`}>{t('admin.vacancies.saving')}</p> : null}
                {form.imageUrl.trim() ? (
                  <div className="mt-3 rounded-lg border border-admin-brand-2/18 bg-admin-surface/40 p-3">
                    <div className="relative mx-auto max-h-56 w-full overflow-hidden rounded-md border border-admin-brand-2/15">
                      {/* eslint-disable-next-line @next/next/no-img-element -- admin preview; R2 or legacy URLs */}
                      <img
                        src={form.imageUrl.trim()}
                        alt=""
                        className="mx-auto max-h-56 w-full object-contain"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={`mt-3 ${adminPaginationNavButtonClass}`}
                      onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                    >
                      {t('admin.vacancies.removeImage')}
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="vac-salary" className={adminFilterLabelClass}>
                    {t('admin.vacancies.fieldSalary')}
                  </label>
                  <input
                    id="vac-salary"
                    type="text"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    className={`${adminFormControlClass} w-full`}
                    placeholder={t('admin.vacancies.fieldSalaryPlaceholder')}
                  />
                </div>
                <div>
                  <label htmlFor="vac-loc" className={adminFilterLabelClass}>
                    {t('admin.vacancies.fieldLocation')}
                  </label>
                  <input
                    id="vac-loc"
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className={`${adminFormControlClass} w-full`}
                    placeholder={t('admin.vacancies.fieldLocationPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="vac-phone" className={adminFilterLabelClass}>
                  {t('admin.vacancies.fieldContactPhone')}
                </label>
                <input
                  id="vac-phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  className={`${adminFormControlClass} w-full`}
                  placeholder={t('admin.vacancies.fieldContactPhonePlaceholder')}
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-admin-brand/80">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                    className="rounded border-admin-brand-2/35 text-admin-brand focus:ring-admin-brand/30"
                  />
                  {t('admin.vacancies.fieldPublished')}
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-admin-brand-2/12 pt-4">
                <Button type="button" variant="outline" size="sm" onClick={closeModal} disabled={submitting} className={adminPaginationNavButtonClass}>
                  {t('admin.vacancies.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting || uploading}
                  className={adminSolidButtonClass}
                >
                  {submitting
                    ? t('admin.vacancies.saving')
                    : editing
                      ? t('admin.vacancies.update')
                      : t('admin.vacancies.create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
