'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/auth/AuthContext';
import { apiClient } from '../../../../lib/api-client';
import { useTranslation } from '../../../../lib/i18n-client';
import type {
  SpinWheelPrize,
  UserOption,
  CategoryOption,
  PickerProductItem,
  SelectedProductDisplay,
  PrizeFormState,
} from '../spin-wheel-admin.types';
import {
  INITIAL_FORM_STATE,
  MAX_PRODUCTS_PER_PRIZE,
  toDateTimeLocalValue,
  toIsoValue,
} from '../spin-wheel-admin.types';

interface PrizesResponse {
  data: SpinWheelPrize[];
}

interface AdminProductsListResponse {
  data: Array<{ id: string; title: string; image?: string | null }>;
}

interface CategoriesResponse {
  data: Array<{ id: string; title: string; slug: string; parentId: string | null; requiresSizes: boolean }>;
}

interface UsersResponse {
  data: UserOption[];
}

function getProductImageFromUnknown(product: unknown): string | null {
  if (!product || typeof product !== 'object') {
    return null;
  }

  const raw = product as {
    productImageUrl?: string | null;
    imageUrl?: string | null;
    image?: string | null;
    url?: string | null;
  };

  return raw.productImageUrl ?? raw.imageUrl ?? raw.image ?? raw.url ?? null;
}

export function useSpinWheelAdmin() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  const [prizes, setPrizes] = useState<SpinWheelPrize[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [form, setForm] = useState<PrizeFormState>(INITIAL_FORM_STATE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prizeModalOpen, setPrizeModalOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProductDisplay[]>([]);

  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [pickerCategoryId, setPickerCategoryId] = useState('');
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerProducts, setPickerProducts] = useState<PickerProductItem[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const isEditMode = editingId !== null;

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM_STATE);
    setEditingId(null);
    setSelectedProducts([]);
  }, []);

  const fetchPrizes = useCallback(async () => {
    const response = await apiClient.get<PrizesResponse>('/api/v1/admin/spin-wheel/prizes');
    setPrizes(response.data || []);
  }, []);

  const fetchCategories = useCallback(async () => {
    const response = await apiClient.get<CategoriesResponse>('/api/v1/admin/categories');
    setCategories(response.data || []);
  }, []);

  const fetchPickerProducts = useCallback(async (categoryId: string, search: string) => {
    setPickerLoading(true);
    try {
      const params: { page: string; limit: string; category?: string; search?: string } = {
        page: '1',
        limit: '100',
      };
      if (categoryId) params.category = categoryId;
      if (search.trim()) params.search = search.trim();
      const response = await apiClient.get<AdminProductsListResponse>('/api/v1/admin/products', {
        params,
      });
      const items = (response.data || []).map((p) => ({
        id: p.id,
        title: p.title,
        image: p.image ?? null,
      }));
      setPickerProducts(items);
    } finally {
      setPickerLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    const response = await apiClient.get<UsersResponse>('/api/v1/admin/users');
    setUsers(response.data || []);
  }, []);

  const fetchAll = useCallback(async () => {
    setPageLoading(true);
    try {
      await Promise.all([fetchPrizes(), fetchUsers()]);
    } finally {
      setPageLoading(false);
    }
  }, [fetchPrizes, fetchUsers]);

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !isAdmin)) {
      router.push('/admin');
    }
  }, [isLoading, isLoggedIn, isAdmin, router]);

  useEffect(() => {
    if (!isLoading && isLoggedIn && isAdmin) {
      fetchAll();
    }
  }, [fetchAll, isLoading, isLoggedIn, isAdmin]);

  useEffect(() => {
    if (productPickerOpen && categories.length === 0) {
      fetchCategories();
    }
  }, [productPickerOpen, categories.length, fetchCategories]);

  useEffect(() => {
    if (!productPickerOpen) return;
    const timer = setTimeout(
      () => fetchPickerProducts(pickerCategoryId, pickerSearch),
      pickerSearch ? 300 : 0
    );
    return () => clearTimeout(timer);
  }, [productPickerOpen, pickerCategoryId, pickerSearch, fetchPickerProducts]);

  // Scroll is allowed when prize modal is open (no body overflow lock).

  const openNewPrizeModal = useCallback(() => {
    resetForm();
    setPrizeModalOpen(true);
  }, [resetForm]);

  const closePrizeModal = useCallback(() => {
    setPrizeModalOpen(false);
    resetForm();
  }, [resetForm]);

  const handleUserToggle = useCallback((userId: string) => {
    setForm((prev) => {
      const alreadySelected = prev.userIds.includes(userId);
      const updatedUserIds = alreadySelected
        ? prev.userIds.filter((id) => id !== userId)
        : [...prev.userIds, userId];
      return { ...prev, userIds: updatedUserIds };
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (selectedProducts.length === 0 || !form.startDate || !form.endDate) {
      alert(t('admin.spinWheel.validationRequired'));
      return;
    }
    if (form.audience === 'selected' && form.userIds.length === 0) {
      alert(t('admin.spinWheel.validationSelectUsers'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        productIds: selectedProducts.map((p) => p.id),
        startDate: toIsoValue(form.startDate),
        endDate: toIsoValue(form.endDate),
        audience: form.audience,
        userIds: form.audience === 'selected' ? form.userIds : [],
        maxSpinsPerUser: form.maxSpinsPerUser ? Number(form.maxSpinsPerUser) : null,
        weight: form.weight ? Number(form.weight) : 1,
      };

      if (isEditMode && editingId) {
        await apiClient.put(`/api/v1/admin/spin-wheel/prizes/${editingId}`, payload);
      } else {
        await apiClient.post('/api/v1/admin/spin-wheel/prizes', payload);
      }

      await fetchPrizes();
      resetForm();
      setPrizeModalOpen(false);
      alert(t('admin.spinWheel.savedSuccess'));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('admin.common.error');
      alert(t('admin.spinWheel.saveError').replace('{message}', errorMessage));
    } finally {
      setSaving(false);
    }
  }, [
    selectedProducts,
    form,
    isEditMode,
    editingId,
    t,
    resetForm,
    fetchPrizes,
  ]);

  const handleEdit = useCallback((prize: SpinWheelPrize) => {
    setEditingId(prize.id);
    setForm({
      startDate: toDateTimeLocalValue(prize.startDate),
      endDate: toDateTimeLocalValue(prize.endDate),
      audience: prize.audience,
      userIds: prize.userIds,
      maxSpinsPerUser: prize.maxSpinsPerUser ? String(prize.maxSpinsPerUser) : '',
      weight: String(prize.weight),
    });
    const products = prize.products?.length
      ? prize.products
      : [
          {
            productId: prize.productId,
            productTitle: prize.productTitle,
            productSlug: prize.productSlug,
            productImageUrl: prize.productImageUrl,
          },
        ];
    setSelectedProducts(
      products.map((p) => ({
        id: p.productId,
        title: p.productTitle,
        imageUrl: getProductImageFromUnknown(p),
      }))
    );
    setPrizeModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (prizeId: string) => {
      if (!window.confirm(t('admin.spinWheel.deleteConfirm'))) return;
      try {
        await apiClient.delete(`/api/v1/admin/spin-wheel/prizes/${prizeId}`);
        await fetchPrizes();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : t('admin.common.error');
        alert(t('admin.spinWheel.deleteError').replace('{message}', errorMessage));
      }
    },
    [t, fetchPrizes]
  );

  const openProductPicker = useCallback(() => {
    setPickerCategoryId('');
    setPickerSearch('');
    setProductPickerOpen(true);
  }, []);

  const handleSelectProduct = useCallback((product: SelectedProductDisplay) => {
    setSelectedProducts((prev) => {
      if (prev.some((p) => p.id === product.id) || prev.length >= MAX_PRODUCTS_PER_PRIZE) {
        return prev;
      }
      return [...prev, product];
    });
    setProductPickerOpen(false);
  }, []);

  return {
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
  };
}
