'use client';

import type { ChangeEvent, RefObject } from 'react';
import { Button } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';
import { ColorPaletteSelector } from '@/components/ColorPaletteSelector';
import {
  adminFilterLabelClass,
  adminFormControlClass,
  adminPaginationNavButtonClass,
  adminSolidButtonClass,
} from '../components/dashboardUi';
import { type AttributeValue } from './useAttributes';

interface ValueEditFormProps {
  value: AttributeValue;
  editingLabel: string;
  editingColors: string[];
  editingImageUrl: string | null;
  savingValue: boolean;
  imageUploading: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onLabelChange: (label: string) => void;
  onColorsChange: (colors: string[]) => void;
  onImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ValueEditForm({
  value,
  editingLabel,
  editingColors,
  editingImageUrl,
  savingValue,
  imageUploading,
  fileInputRef,
  onLabelChange,
  onColorsChange,
  onImageUpload,
  onRemoveImage,
  onSave,
  onCancel,
}: ValueEditFormProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 border-t border-admin-brand-2/15 bg-admin-surface/35 p-4">
      <div>
        <label htmlFor={`value-label-${value.id}`} className={adminFilterLabelClass}>
          {t('admin.attributes.valueModal.label')}
        </label>
        <input
          id={`value-label-${value.id}`}
          type="text"
          value={editingLabel}
          onChange={(e) => onLabelChange(e.target.value)}
          className={`${adminFormControlClass} w-full`}
          placeholder={t('admin.attributes.valueModal.labelPlaceholder')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <span className={adminFilterLabelClass}>{t('admin.attributes.valueModal.colors')}</span>
          <ColorPaletteSelector colors={editingColors} onColorsChange={onColorsChange} />
        </div>

        <div>
          <span className={adminFilterLabelClass}>{t('admin.attributes.valueModal.image')}</span>
          {editingImageUrl ? (
            <div className="mt-2 space-y-3">
              <div className="relative inline-block">
                <img
                  src={editingImageUrl}
                  alt={t('admin.attributes.valueModal.imagePreview')}
                  className="h-32 w-32 rounded-lg border border-admin-brand-2/20 object-cover"
                />
                <button
                  type="button"
                  onClick={onRemoveImage}
                  className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-700 text-admin-flesh shadow-sm transition-colors hover:bg-red-800"
                  title={t('admin.attributes.valueModal.removeImage')}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageUploading}
                className={adminPaginationNavButtonClass}
              >
                {imageUploading ? t('admin.attributes.valueModal.uploading') : t('admin.attributes.valueModal.changeImage')}
              </Button>
            </div>
          ) : (
            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageUploading}
                className={adminPaginationNavButtonClass}
              >
                {imageUploading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-admin-brand border-t-transparent" />
                    {t('admin.attributes.valueModal.uploading')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('admin.attributes.valueModal.uploadImage')}
                  </span>
                )}
              </Button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onImageUpload} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-admin-brand-2/12 pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={savingValue}
          className={adminPaginationNavButtonClass}
        >
          {t('admin.attributes.valueModal.cancel')}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onSave}
          disabled={savingValue || !editingLabel.trim()}
          className={adminSolidButtonClass}
        >
          {savingValue ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-admin-flesh border-t-transparent" />
              {t('admin.attributes.valueModal.saving')}
            </span>
          ) : (
            t('admin.attributes.valueModal.save')
          )}
        </Button>
      </div>
    </div>
  );
}
