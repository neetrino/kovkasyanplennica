'use client';

import type { ChangeEvent, RefObject } from 'react';
import { Button } from '@shop/ui';
import {
  adminFormControlClass,
  adminIconDangerGhostButtonClass,
  adminIconGhostButtonClass,
  adminPaginationNavButtonClass,
  adminSolidButtonClass,
  dashboardBadgeNeutral,
  dashboardEmptyText,
  dashboardInsetRowCompact,
  dashboardRowMeta,
  dashboardRowPrimaryMedium,
} from '../components/dashboardUi';
import { type Attribute, type AttributeValue } from './useAttributes';
import { ValueEditForm } from './ValueEditForm';

export type AdminTranslateFn = (key: string) => string;

export interface AttributeBlockProps {
  attribute: Attribute;
  isExpanded: boolean;
  editingAttribute: string | null;
  editingAttributeName: string;
  savingAttribute: boolean;
  newValue: string;
  addingValueTo: string | null;
  deletingValue: string | null;
  expandedValueId: string | null;
  editingLabel: string;
  editingColors: string[];
  editingImageUrl: string | null;
  savingValue: boolean;
  imageUploading: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  valueError: string | null;
  t: AdminTranslateFn;
  onToggleExpand: () => void;
  onEditingNameChange: (v: string) => void;
  onSaveName: () => void;
  onToggleAttributeEdit: () => void;
  onDeleteAttribute: () => void;
  onNewValueChange: (v: string) => void;
  onClearValueError: () => void;
  onAddValue: () => void;
  onDeleteValue: (valueId: string, label: string) => void;
  onToggleValueEdit: (value: AttributeValue) => void;
  onLabelChange: (v: string) => void;
  onColorsChange: (colors: string[]) => void;
  onImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onSaveInlineValue: () => void;
}

export function AttributeBlock({
  attribute,
  isExpanded,
  editingAttribute,
  editingAttributeName,
  savingAttribute,
  newValue,
  addingValueTo,
  deletingValue,
  expandedValueId,
  editingLabel,
  editingColors,
  editingImageUrl,
  savingValue,
  imageUploading,
  fileInputRef,
  valueError,
  t,
  onToggleExpand,
  onEditingNameChange,
  onSaveName,
  onToggleAttributeEdit,
  onDeleteAttribute,
  onNewValueChange,
  onClearValueError,
  onAddValue,
  onDeleteValue,
  onToggleValueEdit,
  onLabelChange,
  onColorsChange,
  onImageUpload,
  onRemoveImage,
  onSaveInlineValue,
}: AttributeBlockProps) {
  const isEditingThis = editingAttribute === attribute.id;

  return (
    <div className="overflow-hidden rounded-xl border border-admin-brand-2/18 bg-white shadow-[0_1px_2px_rgba(47,63,61,0.04)]">
      <div className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-admin-surface/50">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onToggleExpand}
            className={`shrink-0 rounded-md p-1.5 ${adminIconGhostButtonClass}`}
            aria-expanded={isExpanded}
          >
            <svg
              className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            {isEditingThis ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={editingAttributeName}
                  onChange={(e) => onEditingNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editingAttributeName.trim()) {
                      onSaveName();
                    }
                  }}
                  className={`${adminFormControlClass} min-w-[12rem] flex-1 text-base font-semibold sm:max-w-md`}
                  autoFocus
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={onSaveName}
                  disabled={!editingAttributeName.trim() || savingAttribute}
                  className={adminSolidButtonClass}
                >
                  {savingAttribute ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-admin-flesh border-t-transparent" />
                      {t('admin.attributes.saving')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('admin.attributes.save')}
                    </span>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onToggleAttributeEdit}
                  disabled={savingAttribute}
                  className={adminPaginationNavButtonClass}
                >
                  {t('admin.attributes.cancel')}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-admin-brand">{attribute.name}</h3>
                  <span className={dashboardBadgeNeutral}>{attribute.key}</span>
                  {attribute.filterable ? (
                    <span className="rounded-full bg-admin-brand/10 px-2 py-0.5 text-xs font-medium text-admin-brand ring-1 ring-inset ring-admin-brand/15">
                      {t('admin.attributes.filterable')}
                    </span>
                  ) : null}
                </div>
                <p className={`mt-1 ${dashboardRowMeta}`}>
                  {attribute.values.length === 1
                    ? t('admin.attributes.values').replace('{count}', attribute.values.length.toString())
                    : t('admin.attributes.valuesPlural').replace('{count}', attribute.values.length.toString())}
                </p>
              </>
            )}
          </div>
        </div>
        {!isEditingThis ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onToggleAttributeEdit}
              className={adminIconGhostButtonClass}
              title={t('admin.attributes.editAttribute')}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={onDeleteAttribute}
              className={adminIconDangerGhostButtonClass}
              title={t('admin.attributes.deleteAttribute')}
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
        ) : null}
      </div>

      {isExpanded ? (
        <div className="border-t border-admin-brand-2/15 bg-admin-surface/40 p-4">
          <div className="mb-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => {
                    onNewValueChange(e.target.value);
                    if (valueError) onClearValueError();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newValue.trim()) {
                      onAddValue();
                    }
                  }}
                  placeholder={t('admin.attributes.addNewValue')}
                  className={`w-full ${adminFormControlClass} ${
                    valueError ? 'border-red-300/90 bg-red-50/80 focus:border-red-400 focus:ring-red-200/50' : ''
                  }`}
                />
                {valueError ? (
                  <p className="mt-1.5 flex items-center gap-1 text-sm text-red-800">
                    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {valueError}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onAddValue}
                disabled={!newValue.trim() || addingValueTo === attribute.id}
                className={`shrink-0 self-stretch sm:self-auto ${adminSolidButtonClass}`}
              >
                {addingValueTo === attribute.id ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-admin-flesh border-t-transparent" />
                    {t('admin.attributes.adding')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('admin.attributes.add')}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {attribute.values.length === 0 ? (
            <p className={`py-3 text-center ${dashboardEmptyText}`}>{t('admin.attributes.noValuesYet')}</p>
          ) : (
            <div className="space-y-2">
              {attribute.values.map((value) => {
                const valueExpanded = expandedValueId === value.id;
                return (
                  <div key={value.id} className={`${dashboardInsetRowCompact} overflow-hidden p-0`}>
                    <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        {value.colors && value.colors.length > 0 ? (
                          <span
                            className="inline-block h-5 w-5 shrink-0 rounded-full border border-admin-brand-2/25 ring-1 ring-inset ring-admin-brand/[0.06]"
                            style={{ backgroundColor: value.colors[0] }}
                            title={value.colors[0]}
                          />
                        ) : value.imageUrl ? (
                          <img
                            src={value.imageUrl}
                            alt={value.label}
                            className="h-5 w-5 shrink-0 rounded border border-admin-brand-2/20 object-cover"
                          />
                        ) : null}
                        <span className={dashboardRowPrimaryMedium}>{value.label}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onToggleValueEdit(value)}
                          className={adminIconGhostButtonClass}
                          title={t('admin.attributes.configureValue')}
                        >
                          <svg
                            className={`h-4 w-4 transition-transform ${valueExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteValue(value.id, value.label)}
                          disabled={deletingValue === value.id}
                          className={adminIconDangerGhostButtonClass}
                          title={t('admin.attributes.deleteValue')}
                        >
                          {deletingValue === value.id ? (
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-red-800/80 border-t-transparent" />
                          ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {valueExpanded ? (
                      <ValueEditForm
                        value={value}
                        editingLabel={editingLabel}
                        editingColors={editingColors}
                        editingImageUrl={editingImageUrl}
                        savingValue={savingValue}
                        imageUploading={imageUploading}
                        fileInputRef={fileInputRef}
                        onLabelChange={onLabelChange}
                        onColorsChange={onColorsChange}
                        onImageUpload={onImageUpload}
                        onRemoveImage={onRemoveImage}
                        onSave={onSaveInlineValue}
                        onCancel={() => onToggleValueEdit(value)}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
