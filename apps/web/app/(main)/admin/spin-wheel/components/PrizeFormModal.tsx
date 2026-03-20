'use client';

import type {
  PrizeAudience,
  PrizeFormState,
  SelectedProductDisplay,
  UserOption,
} from '../spin-wheel-admin.types';
import { MAX_PRODUCTS_PER_PRIZE } from '../spin-wheel-admin.types';
interface PrizeFormModalProps {
  open: boolean;
  onClose: () => void;
  isEditMode: boolean;
  form: PrizeFormState;
  setForm: React.Dispatch<React.SetStateAction<PrizeFormState>>;
  selectedProducts: SelectedProductDisplay[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<SelectedProductDisplay[]>>;
  users: UserOption[];
  onUserToggle: (userId: string) => void;
  onSubmit: () => void;
  saving: boolean;
  onOpenProductPicker: () => void;
  t: (key: string) => string;
}

export function PrizeFormModal({
  open,
  onClose,
  isEditMode,
  form,
  setForm,
  selectedProducts,
  setSelectedProducts,
  users,
  onUserToggle,
  onSubmit,
  saving,
  onOpenProductPicker,
  t,
}: PrizeFormModalProps) {
  if (!open) return null;

  const selectedUsersLabel =
    form.userIds.length === 0
      ? t('admin.spinWheel.selectedUsersCount').replace('{count}', '0')
      : t('admin.spinWheel.selectedUsersCount').replace('{count}', form.userIds.length.toString());

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 pb-8 px-4 bg-black/50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prize-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl bg-white shadow-2xl p-6 shrink-0 overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="prize-modal-title" className="text-xl font-semibold text-gray-900">
            {isEditMode ? t('admin.spinWheel.editPrize') : t('admin.spinWheel.newPrize')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full border border-gray-200 text-gray-500 hover:text-gray-900"
            aria-label={t('admin.common.close')}
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-sm text-gray-700 md:col-span-2">
            <span className="block mb-1">{t('admin.spinWheel.productLabel')}</span>
            <p className="text-xs text-gray-500 mb-2">{t('admin.spinWheel.productsCountHint')}</p>
            <div className="rounded-md border border-gray-300 p-3 space-y-2">
              {selectedProducts.length > 0 && (
                <ul className="space-y-2">
                  {selectedProducts.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 rounded border border-gray-200 p-2 bg-gray-50"
                    >
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="h-10 w-10 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-gray-200 shrink-0 flex items-center justify-center text-gray-400 text-xs">
                          —
                        </div>
                      )}
                      <span className="flex-1 truncate text-gray-900 text-sm">{p.title}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedProducts((prev) => prev.filter((x) => x.id !== p.id))
                        }
                        className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        {t('admin.common.remove')}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {selectedProducts.length < MAX_PRODUCTS_PER_PRIZE && (
                <button
                  type="button"
                  onClick={onOpenProductPicker}
                  className="rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 w-full"
                >
                  {t('admin.spinWheel.addProduct')}
                </button>
              )}
            </div>
          </div>

          <label className="text-sm text-gray-700">
            <span className="block mb-1">{t('admin.spinWheel.audienceLabel')}</span>
            <select
              value={form.audience}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  audience: e.target.value as PrizeAudience,
                  userIds: e.target.value === 'all' ? [] : prev.userIds,
                }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="all">{t('admin.spinWheel.audienceAll')}</option>
              <option value="selected">{t('admin.spinWheel.audienceSelected')}</option>
            </select>
          </label>

          <label className="text-sm text-gray-700">
            <span className="block mb-1">{t('admin.spinWheel.startDateLabel')}</span>
            <input
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="text-sm text-gray-700">
            <span className="block mb-1">{t('admin.spinWheel.endDateLabel')}</span>
            <input
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="text-sm text-gray-700">
            <span className="block mb-1">{t('admin.spinWheel.maxSpinsLabel')}</span>
            <input
              type="number"
              min={1}
              value={form.maxSpinsPerUser}
              placeholder={t('admin.spinWheel.maxSpinsPlaceholder')}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, maxSpinsPerUser: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="text-sm text-gray-700">
            <span className="block mb-1">{t('admin.spinWheel.weightLabel')}</span>
            <input
              type="number"
              min={1}
              value={form.weight}
              onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
        </div>

        {form.audience === 'selected' && (
          <div className="mt-4 border border-gray-200 rounded-md p-4">
            <p className="text-sm font-medium text-gray-900 mb-3">
              {t('admin.spinWheel.userSelectionTitle')}
            </p>
            <p className="text-xs text-gray-500 mb-3">{selectedUsersLabel}</p>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {users.map((user) => {
                const userFullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
                const userLabel = userFullName || user.email || user.id;
                const isChecked = form.userIds.includes(user.id);
                return (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onUserToggle(user.id)}
                    />
                    <span>{userLabel}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {saving ? t('admin.common.saving') : t('admin.common.save')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
          >
            {t('admin.common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
