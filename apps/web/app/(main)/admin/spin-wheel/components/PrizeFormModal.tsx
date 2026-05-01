'use client';

import type {
  PrizeAudience,
  PrizeFormState,
  SelectedProductDisplay,
  UserOption,
} from '../spin-wheel-admin.types';
import { MAX_PRODUCTS_PER_PRIZE } from '../spin-wheel-admin.types';
import {
  adminFormControlClass,
  adminGhostIconButtonClass,
  adminModalBackdropAlignStartClass,
  adminModalTitleClass,
  adminPaginationNavButtonClass,
  adminSectionSubtitleClass,
  adminSolidButtonClass,
  dashboardInsetRowCompact,
  dashboardRowMeta,
} from '../../components/dashboardUi';
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
      className={adminModalBackdropAlignStartClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby="prize-modal-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[calc(100vh-6rem)] w-full max-w-2xl shrink-0 overflow-y-auto overscroll-contain rounded-xl border border-admin-brand-2/20 bg-white p-6 shadow-[0_24px_60px_-16px_rgba(47,63,61,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between border-b border-admin-brand-2/15 pb-4">
          <h2 id="prize-modal-title" className={adminModalTitleClass}>
            {isEditMode ? t('admin.spinWheel.editPrize') : t('admin.spinWheel.newPrize')}
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className={`text-sm text-admin-brand md:col-span-2`}>
            <span className="mb-1 block font-medium text-admin-brand">{t('admin.spinWheel.productLabel')}</span>
            <p className={`mb-2 text-xs ${adminSectionSubtitleClass}`}>{t('admin.spinWheel.productsCountHint')}</p>
            <div className="space-y-2 rounded-lg border border-admin-brand-2/18 bg-admin-surface/30 p-3">
              {selectedProducts.length > 0 && (
                <ul className="space-y-2">
                  {selectedProducts.map((p) => (
                    <li key={p.id} className={`flex items-center gap-3 ${dashboardInsetRowCompact}`}>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-md border border-admin-brand-2/15 object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-admin-brand-2/15 bg-admin-surface text-xs text-admin-muted">
                          —
                        </div>
                      )}
                      <span className="flex-1 truncate text-sm text-admin-brand">{p.title}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedProducts((prev) => prev.filter((x) => x.id !== p.id))}
                        className="rounded-md border border-red-200/90 px-2 py-1 text-xs font-medium text-red-800 transition-colors hover:bg-red-50"
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
                  className="w-full rounded-md border border-dashed border-admin-brand-2/30 px-3 py-2 text-sm font-medium text-admin-brand/70 transition-colors hover:border-admin-brand-2/50 hover:bg-admin-surface/60 hover:text-admin-brand"
                >
                  {t('admin.spinWheel.addProduct')}
                </button>
              )}
            </div>
          </div>

          <label className="text-sm text-admin-brand">
            <span className="mb-1 block font-medium">{t('admin.spinWheel.audienceLabel')}</span>
            <select
              value={form.audience}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  audience: e.target.value as PrizeAudience,
                  userIds: e.target.value === 'all' ? [] : prev.userIds,
                }))
              }
              className={`${adminFormControlClass} w-full`}
            >
              <option value="all">{t('admin.spinWheel.audienceAll')}</option>
              <option value="selected">{t('admin.spinWheel.audienceSelected')}</option>
            </select>
          </label>

          <label className="text-sm text-admin-brand">
            <span className="mb-1 block font-medium">{t('admin.spinWheel.startDateLabel')}</span>
            <input
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
              className={`${adminFormControlClass} w-full`}
            />
          </label>

          <label className="text-sm text-admin-brand">
            <span className="mb-1 block font-medium">{t('admin.spinWheel.endDateLabel')}</span>
            <input
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              className={`${adminFormControlClass} w-full`}
            />
          </label>

          <label className="text-sm text-admin-brand">
            <span className="mb-1 block font-medium">{t('admin.spinWheel.maxSpinsLabel')}</span>
            <input
              type="number"
              min={1}
              value={form.maxSpinsPerUser}
              placeholder={t('admin.spinWheel.maxSpinsPlaceholder')}
              onChange={(e) => setForm((prev) => ({ ...prev, maxSpinsPerUser: e.target.value }))}
              className={`${adminFormControlClass} w-full`}
            />
          </label>

          <label className="text-sm text-admin-brand">
            <span className="mb-1 block font-medium">{t('admin.spinWheel.weightLabel')}</span>
            <input
              type="number"
              min={1}
              value={form.weight}
              onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
              className={`${adminFormControlClass} w-full`}
            />
          </label>
        </div>

        {form.audience === 'selected' && (
          <div className="mt-4 rounded-lg border border-admin-brand-2/18 bg-admin-surface/25 p-4">
            <p className={`mb-3 text-sm font-medium text-admin-brand`}>{t('admin.spinWheel.userSelectionTitle')}</p>
            <p className={`mb-3 text-xs ${dashboardRowMeta}`}>{selectedUsersLabel}</p>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {users.map((user) => {
                const userFullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
                const userLabel = userFullName || user.email || user.id;
                const isChecked = form.userIds.includes(user.id);
                return (
                  <label key={user.id} className="flex items-center gap-3 text-sm text-admin-brand">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onUserToggle(user.id)}
                      className="rounded border-admin-brand-2/35 text-admin-brand focus:ring-admin-brand/30"
                    />
                    <span>{userLabel}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-admin-brand-2/15 pt-4">
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${adminSolidButtonClass}`}
          >
            {saving ? t('admin.common.saving') : t('admin.common.save')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${adminPaginationNavButtonClass}`}
          >
            {t('admin.common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
