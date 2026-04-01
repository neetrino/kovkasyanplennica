'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@shop/ui';
import { apiClient, ApiError } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n-client';

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
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2" />
        <p className="text-sm text-gray-600">{t('admin.vacancies.loading')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{t('admin.vacancies.title')}</h2>
        <Button type="button" onClick={openCreate} variant="primary" size="sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('admin.vacancies.addNew')}
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">{t('admin.vacancies.noItems')}</p>
      ) : (
        <div className="space-y-2 max-h-[32rem] overflow-y-auto">
          {items.map((row) => (
            <div
              key={row.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900">{row.title}</div>
                <div className="text-xs text-gray-500 truncate">
                  {row.published ? '●' : '○'}
                  {row.contactPhone ? ` · ${row.contactPhone}` : ''}
                  {row.salary ? ` · ${row.salary}` : ''}
                  {row.location ? ` · ${row.location}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(row)}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  {t('admin.vacancies.edit')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleDelete(row)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  {t('admin.vacancies.delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-app-modal p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editing ? t('admin.vacancies.editTitle') : t('admin.vacancies.addTitle')}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div>
                <label htmlFor="vac-title" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.vacancies.fieldTitle')}
                </label>
                <input
                  id="vac-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder={t('admin.vacancies.fieldTitlePlaceholder')}
                  required
                />
              </div>

              <div>
                <label htmlFor="vac-desc" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.vacancies.fieldDescription')}
                </label>
                <textarea
                  id="vac-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder={t('admin.vacancies.fieldDescriptionPlaceholder')}
                  required
                />
              </div>

              <div>
                <p className="block text-sm font-medium text-gray-700 mb-1">{t('admin.vacancies.fieldImageHint')}</p>
                <input
                  id="vac-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleFile(e)}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-600"
                />
                {uploading ? <p className="text-xs text-gray-500 mt-1">{t('admin.vacancies.saving')}</p> : null}
                {form.imageUrl.trim() ? (
                  <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="relative mx-auto max-h-56 w-full overflow-hidden rounded-md">
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
                      className="mt-3"
                      onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                    >
                      {t('admin.vacancies.removeImage')}
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="vac-salary" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.vacancies.fieldSalary')}
                  </label>
                  <input
                    id="vac-salary"
                    type="text"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder={t('admin.vacancies.fieldSalaryPlaceholder')}
                  />
                </div>
                <div>
                  <label htmlFor="vac-loc" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.vacancies.fieldLocation')}
                  </label>
                  <input
                    id="vac-loc"
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder={t('admin.vacancies.fieldLocationPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="vac-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.vacancies.fieldContactPhone')}
                </label>
                <input
                  id="vac-phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder={t('admin.vacancies.fieldContactPhonePlaceholder')}
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  />
                  {t('admin.vacancies.fieldPublished')}
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={closeModal} disabled={submitting}>
                  {t('admin.vacancies.cancel')}
                </Button>
                <Button type="submit" variant="primary" disabled={submitting || uploading}>
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
      )}
    </>
  );
}
