'use client';

import type { PickerProductItem, SelectedProductDisplay } from '../spin-wheel-admin.types';
import { MAX_PRODUCTS_PER_PRIZE } from '../spin-wheel-admin.types';
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
      className="fixed inset-0 z-[60] flex items-start justify-center pt-16 pb-8 px-4 bg-black/50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={t('admin.spinWheel.chooseProduct')}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col rounded-xl bg-white shadow-2xl shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('admin.spinWheel.chooseProduct')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full border border-gray-200 text-gray-500 hover:text-gray-900"
            aria-label={t('admin.common.close')}
          >
            ×
          </button>
        </div>
        <div className="p-4 space-y-3 border-b border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t('admin.spinWheel.pickerCategoryLabel')}
              </label>
              <select
                value={categoryId}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t('admin.spinWheel.pickerSearchPlaceholder')}
              </label>
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t('admin.spinWheel.pickerSearchPlaceholder')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 min-h-[200px]">
          {loading ? (
            <p className="text-sm text-gray-500">{t('admin.spinWheel.pickerLoading')}</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-gray-500">{t('admin.spinWheel.pickerNoProducts')}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                  className="rounded-lg border border-gray-200 p-3 text-left hover:border-gray-900 hover:bg-gray-50 flex flex-col items-center gap-2"
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt=""
                      className="h-20 w-20 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded bg-gray-200 shrink-0 flex items-center justify-center text-gray-400 text-xs">
                      —
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900 line-clamp-2 w-full text-center">
                    {product.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
