'use client';

import { usePathname, useRouter } from 'next/navigation';
import { AdminSidebar } from '../components/AdminSidebar';
import { useSpinWheelAdmin } from './hooks/useSpinWheelAdmin';
import { PrizeFormModal } from './components/PrizeFormModal';
import { ProductPickerModal } from './components/ProductPickerModal';
import { ActivePrizesList } from './components/ActivePrizesList';

export default function AdminSpinWheelPage() {
  const router = useRouter();
  const pathname = usePathname();
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">{t('admin.common.loading')}</div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.spinWheel.title')}</h1>
          <p className="text-gray-600 mt-2">{t('admin.spinWheel.subtitle')}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <AdminSidebar currentPath={pathname || '/admin/spin-wheel'} router={router} t={t} />

          <div className="flex-1 space-y-6">
            <section className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t('admin.spinWheel.prizesSectionTitle')}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {t('admin.spinWheel.prizesSectionSubtitle')}
              </p>
              <button
                type="button"
                onClick={openNewPrizeModal}
                className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800"
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

            <ActivePrizesList
              prizes={prizes}
              onEdit={handleEdit}
              onDelete={handleDelete}
              t={t}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
