'use client';

import type { PickerProductItem, SelectedProductDisplay } from '../spin-wheel-admin.types';
import {
  adminFilterLabelClass,
  adminFormControlClass,
  adminGhostIconButtonClass,
  adminModalBackdropAlignStartClass,
  dashboardEmptyText,
  dashboardRowPrimaryMedium,
} from '../../components/dashboardUi';
interface ProductPickerModalProps {
  open: boolean;
  onClose: () => void;
  categories: Array<{ id: string; title: string }>;
  categoryId: string;
  onCategoryChange: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  products: PickerProductItem[];
  loading: boolean;
  onSelectProduct: (product: SelectedProductDisplay) => void;
  t: (key: string) => string;
}

export function ProductPickerModal({
  open,
  onClose,
  categories,
  categoryId,
  onCategoryChange,
  search,
  onSearchChange,
  products,
  loading,
  onSelectProduct,
  t,
}: ProductPickerModalProps) {
  if (!open) return null;

  return (
    <div
      className={adminModalBackdropAlignStartClass}
      role="dialog"
      aria-modal="true"
      aria-label={t('admin.spinWheel.chooseProduct')}
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[calc(100vh-6rem)] w-full max-w-3xl shrink-0 flex-col overflow-hidden rounded-xl border border-admin-brand-2/20 bg-white shadow-[0_24px_60px_-16px_rgba(47,63,61,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-admin-brand-2/15 p-4">
          <h3 className="text-lg font-semibold tracking-tight text-admin-brand">{t('admin.spinWheel.chooseProduct')}</h3>
          <button
            type="button"
            onClick={onClose}
            className={`flex h-9 w-9 items-center justify-center rounded-full border border-admin-brand-2/20 text-lg leading-none ${adminGhostIconButtonClass}`}
            aria-label={t('admin.common.close')}
          >
            ×
          </button>
        </div>
        <div className="space-y-3 border-b border-admin-brand-2/15 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={`${adminFilterLabelClass} !mb-1 text-xs`}>{t('admin.spinWheel.pickerCategoryLabel')}</label>
              <select
                value={categoryId}
                onChange={(e) => onCategoryChange(e.target.value)}
                className={`${adminFormControlClass} w-full text-sm`}
              >
                <option value="">{t('admin.spinWheel.pickerCategoryPlaceholder')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`${adminFilterLabelClass} !mb-1 text-xs`}>{t('admin.spinWheel.pickerSearchPlaceholder')}</label>
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t('admin.spinWheel.pickerSearchPlaceholder')}
                className={`${adminFormControlClass} w-full text-sm`}
              />
            </div>
          </div>
        </div>
        <div className="min-h-[200px] flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className={dashboardEmptyText}>{t('admin.spinWheel.pickerLoading')}</p>
          ) : products.length === 0 ? (
            <p className={dashboardEmptyText}>{t('admin.spinWheel.pickerNoProducts')}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => {
                    onSelectProduct({
                      id: product.id,
                      title: product.title,
                      imageUrl: product.image,
                    });
                    onClose();
                  }}
                  className="flex flex-col items-center gap-2 rounded-lg border border-admin-brand-2/18 bg-white p-3 text-center transition-colors hover:border-admin-brand-2/40 hover:bg-admin-surface/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand/25"
                >
                  {product.image ? (
                    <img src={product.image} alt="" className="h-20 w-20 shrink-0 rounded-md border border-admin-brand-2/15 object-cover" />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-admin-brand-2/15 bg-admin-surface text-xs text-admin-muted">
                      —
                    </div>
                  )}
                  <span className={`line-clamp-2 w-full text-center text-sm ${dashboardRowPrimaryMedium}`}>{product.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
