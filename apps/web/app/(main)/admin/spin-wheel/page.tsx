'use client';

import { dashboardMainClass, adminSolidButtonClass } from '../components/dashboardUi';
import { useSpinWheelAdmin } from './hooks/useSpinWheelAdmin';
import { PrizeFormModal } from './components/PrizeFormModal';
import { ProductPickerModal } from './components/ProductPickerModal';
import { ActivePrizesList } from './components/ActivePrizesList';

export default function AdminSpinWheelPage() {
  const {
    t,
    isLoading,
    isLoggedIn,
    isAdmin,
    pageLoading,
    prizes,
    users,
    form,
    setForm,
    selectedProducts,
    setSelectedProducts,
    prizeModalOpen,
    closePrizeModal,
    openNewPrizeModal,
    isEditMode,
    saving,
    handleUserToggle,
    handleSubmit,
    handleEdit,
    handleDelete,
    openProductPicker,
    productPickerOpen,
    setProductPickerOpen,
    categories,
    pickerCategoryId,
    setPickerCategoryId,
    pickerSearch,
    setPickerSearch,
    pickerProducts,
    pickerLoading,
    handleSelectProduct,
  } = useSpinWheelAdmin();

  if (isLoading || pageLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
          <p className="text-sm text-admin-brand/55">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <div className={dashboardMainClass}>
      <section className="rounded-xl border border-admin-brand-2/18 bg-white p-5 shadow-[0_1px_2px_rgba(47,63,61,0.05),0_8px_24px_-8px_rgba(47,63,61,0.1)] sm:p-6">
        <h2 className="mb-2 text-xl font-semibold tracking-tight text-admin-brand">{t('admin.spinWheel.prizesSectionTitle')}</h2>
        <p className="mb-4 text-sm text-admin-brand/60">{t('admin.spinWheel.prizesSectionSubtitle')}</p>
        <button
          type="button"
          onClick={openNewPrizeModal}
          className={`inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium ${adminSolidButtonClass}`}
        >
          {t('admin.spinWheel.addNewPrize')}
        </button>
      </section>

      <PrizeFormModal
        open={prizeModalOpen}
        onClose={closePrizeModal}
        isEditMode={isEditMode}
        form={form}
        setForm={setForm}
        selectedProducts={selectedProducts}
        setSelectedProducts={setSelectedProducts}
        users={users}
        onUserToggle={handleUserToggle}
        onSubmit={handleSubmit}
        saving={saving}
        onOpenProductPicker={openProductPicker}
        t={t}
      />

      <ProductPickerModal
        open={productPickerOpen}
        onClose={() => setProductPickerOpen(false)}
        categories={categories}
        categoryId={pickerCategoryId}
        onCategoryChange={setPickerCategoryId}
        search={pickerSearch}
        onSearchChange={setPickerSearch}
        products={pickerProducts}
        loading={pickerLoading}
        onSelectProduct={handleSelectProduct}
        t={t}
      />

      <ActivePrizesList prizes={prizes} onEdit={handleEdit} onDelete={handleDelete} t={t} />
    </div>
  );
}
