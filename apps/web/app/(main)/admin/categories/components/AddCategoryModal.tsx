'use client';

import type { ChangeEvent } from 'react';
import { Button } from '@shop/ui';
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
  dashboardRowMeta,
} from '../../components/dashboardUi';
import type { Category, CategoryFormData } from '../types';

const categoryModalPanelClass =
  'relative max-h-[calc(100vh-6rem)] w-full max-w-md shrink-0 overflow-y-auto overscroll-contain rounded-xl border border-admin-brand-2/20 bg-white p-6 shadow-[0_24px_60px_-16px_rgba(47,63,61,0.28)]';

const fileInputClass =
  'block w-full text-sm text-admin-brand/65 file:mr-3 file:rounded-md file:border-0 file:bg-admin-surface file:px-3 file:py-2 file:text-xs file:font-medium file:text-admin-brand';

const checkboxClass = 'rounded border-admin-brand-2/35 text-admin-brand focus:ring-admin-brand/30';

interface AddCategoryModalProps {
  isOpen: boolean;
  formData: CategoryFormData;
  categories: Category[];
  saving: boolean;
  imageUploading: boolean;
  onClose: () => void;
  onFormDataChange: (data: CategoryFormData) => void;
  onImageUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onImageRemove: () => void;
  onSubmit: () => Promise<void>;
}

export function AddCategoryModal({
  isOpen,
  formData,
  categories,
  saving,
  imageUploading,
  onClose,
  onFormDataChange,
  onImageUpload,
  onImageRemove,
  onSubmit,
}: AddCategoryModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const inputClass = `${adminFormControlClass} w-full`;

  return (
    <div
      className={adminModalBackdropAlignStartClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-category-modal-title"
      onClick={onClose}
    >
      <div className={categoryModalPanelClass} onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between border-b border-admin-brand-2/15 pb-4">
          <h2 id="add-category-modal-title" className={adminModalTitleClass}>
            {t('admin.categories.addCategory')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`flex h-9 w-9 items-center justify-center rounded-full border border-admin-brand-2/20 text-lg leading-none ${adminGhostIconButtonClass}`}
            aria-label={t('admin.common.close')}
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="add-category-title" className={adminFilterLabelClass}>
              {t('admin.categories.categoryTitle')} *
            </label>
            <input
              id="add-category-title"
              type="text"
              value={formData.title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onFormDataChange({ ...formData, title: e.target.value })}
              placeholder={t('admin.categories.categoryTitlePlaceholder')}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="add-category-slug" className={adminFilterLabelClass}>
              {t('admin.categories.categorySlug')}
            </label>
            <input
              id="add-category-slug"
              type="text"
              value={formData.slug}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onFormDataChange({ ...formData, slug: e.target.value })}
              placeholder={t('admin.categories.categorySlugPlaceholder')}
              className={`${inputClass} font-mono text-sm`}
            />
          </div>
          <div>
            <label htmlFor="add-category-parent" className={adminFilterLabelClass}>
              {t('admin.categories.parentCategory')}
            </label>
            <select
              id="add-category-parent"
              value={formData.parentId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => onFormDataChange({ ...formData, parentId: e.target.value })}
              className={inputClass}
            >
              <option value="">{t('admin.categories.rootCategory')}</option>
              {categories
                .filter((cat) => !cat.parentId)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-admin-brand/80">
              <input
                type="checkbox"
                checked={formData.requiresSizes}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  onFormDataChange({ ...formData, requiresSizes: e.target.checked })
                }
                className={checkboxClass}
              />
              <span>{t('admin.categories.requiresSizes')}</span>
            </label>
          </div>
          <div>
            <span className={adminFilterLabelClass}>{t('admin.categories.categoryImage')}</span>
            {formData.imageUrl ? (
              <div className="mb-3 flex items-center gap-3 rounded-lg border border-admin-brand-2/18 bg-admin-surface/40 p-3">
                <img src={formData.imageUrl} alt={formData.title || 'Category'} className="h-14 w-14 rounded-md object-cover" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onImageRemove}
                  disabled={saving || imageUploading}
                  className={adminBulkDangerButtonClass}
                >
                  {t('admin.categories.removeImage')}
                </Button>
              </div>
            ) : null}
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                void onImageUpload(event);
              }}
              disabled={saving || imageUploading}
              className={fileInputClass}
            />
            <p className={`mt-1 ${dashboardRowMeta}`}>
              {imageUploading ? t('admin.categories.uploadingImage') : t('admin.categories.uploadImage')}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-admin-brand-2/12 pt-4">
          <Button
            type="button"
            variant="primary"
            onClick={() => void onSubmit()}
            disabled={saving || !formData.title.trim()}
            className={`min-w-[8rem] flex-1 ${adminSolidButtonClass}`}
          >
            {saving ? t('admin.categories.creating') : t('admin.categories.createCategory')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving} className={adminPaginationNavButtonClass}>
            {t('admin.common.cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}
