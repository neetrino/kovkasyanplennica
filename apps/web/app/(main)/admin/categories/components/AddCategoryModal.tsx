'use client';

import type { ChangeEvent } from 'react';
import { Button, Input } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';
import type { Category, CategoryFormData } from '../types';

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-app-modal">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.categories.addCategory')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.categories.categoryTitle')} *
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onFormDataChange({ ...formData, title: e.target.value })}
              placeholder={t('admin.categories.categoryTitlePlaceholder')}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.categories.categorySlug')}
            </label>
            <Input
              type="text"
              value={formData.slug}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onFormDataChange({ ...formData, slug: e.target.value })}
              placeholder={t('admin.categories.categorySlugPlaceholder')}
              className="w-full font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.categories.parentCategory')}
            </label>
            <select
              value={formData.parentId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => onFormDataChange({ ...formData, parentId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresSizes}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onFormDataChange({ ...formData, requiresSizes: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {t('admin.categories.requiresSizes')}
              </span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.categories.categoryImage')}
            </label>
            {formData.imageUrl ? (
              <div className="mb-3 flex items-center gap-3 rounded-md border border-gray-200 p-2">
                <img
                  src={formData.imageUrl}
                  alt={formData.title || 'Category image'}
                  className="h-14 w-14 rounded-md object-cover"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onImageRemove}
                  disabled={saving || imageUploading}
                  className="text-red-600 hover:text-red-700"
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
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p className="mt-1 text-xs text-gray-500">
              {imageUploading ? t('admin.categories.uploadingImage') : t('admin.categories.uploadImage')}
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={saving || !formData.title.trim()}
            className="flex-1"
          >
            {saving ? t('admin.categories.creating') : t('admin.categories.createCategory')}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={saving}
          >
            {t('admin.common.cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}








