'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';
import {
  adminSolidButtonClass,
  adminSectionSubtitleClass,
  dashboardCardPadding,
  dashboardEmptyText,
  dashboardMainClass,
} from '../components/dashboardUi';
import { useCategories } from './hooks/useCategories';
import { useCategoryActions } from './hooks/useCategoryActions';
import { CategoriesList } from './components/CategoriesList';
import { AddCategoryModal } from './components/AddCategoryModal';
import { EditCategoryModal } from './components/EditCategoryModal';

export default function CategoriesPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const { categories, loading, fetchCategories } = useCategories();
  const {
    showAddModal,
    showEditModal,
    editingCategory,
    formData,
    saving,
    imageUploading,
    setShowAddModal,
    setShowEditModal,
    setFormData,
    handleCategoryImageUpload,
    removeCategoryImage,
    handleAddCategory,
    handleEditCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    resetForm,
  } = useCategoryActions();

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/admin');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-admin-brand">{t('admin.categories.title')}</h1>
            <p className={`mt-1 max-w-2xl ${adminSectionSubtitleClass}`}>{t('admin.categories.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${adminSolidButtonClass}`}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('admin.categories.addCategory')}
          </button>
        </div>
      </section>

      <Card variant="admin" className={dashboardCardPadding}>
        {loading ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
            <p className={dashboardEmptyText}>{t('admin.categories.loadingCategories')}</p>
          </div>
        ) : (
          <CategoriesList
            categories={categories}
            onEdit={handleEditCategory}
            onDelete={(categoryId, categoryTitle) => handleDeleteCategory(categoryId, categoryTitle, fetchCategories)}
          />
        )}
      </Card>

      <AddCategoryModal
        isOpen={showAddModal}
        formData={formData}
        categories={categories}
        saving={saving}
        imageUploading={imageUploading}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        onFormDataChange={setFormData}
        onImageUpload={handleCategoryImageUpload}
        onImageRemove={removeCategoryImage}
        onSubmit={() => handleAddCategory(fetchCategories)}
      />

      <EditCategoryModal
        isOpen={showEditModal}
        editingCategory={editingCategory}
        formData={formData}
        categories={categories}
        saving={saving}
        imageUploading={imageUploading}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        onFormDataChange={setFormData}
        onImageUpload={handleCategoryImageUpload}
        onImageRemove={removeCategoryImage}
        onSubmit={() => handleUpdateCategory(fetchCategories)}
      />
    </div>
  );
}
