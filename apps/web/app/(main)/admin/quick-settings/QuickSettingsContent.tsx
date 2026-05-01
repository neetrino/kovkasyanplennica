'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';
import { dashboardMainClass, dashboardCardPadding, adminModalTitleClass, adminSectionSubtitleClass } from '../components/dashboardUi';
import { GlobalDiscountCard } from './components/GlobalDiscountCard';
import { QuickInfoCard } from './components/QuickInfoCard';
import { CategoryDiscountsCard } from './components/CategoryDiscountsCard';
import { BrandDiscountsCard } from './components/BrandDiscountsCard';
import { ProductDiscountsCard } from './components/ProductDiscountsCard';

interface AdminCategory {
  id: string;
  title: string;
  parentId: string | null;
}

interface AdminBrand {
  id: string;
  name: string;
  logoUrl?: string;
}

interface QuickSettingsContentProps {
  globalDiscount: number;
  setGlobalDiscount: (value: number) => void;
  discountLoading: boolean;
  discountSaving: boolean;
  handleDiscountSave: () => void;
  categories: AdminCategory[];
  categoriesLoading: boolean;
  categoryDiscounts: Record<string, number>;
  updateCategoryDiscountValue: (categoryId: string, value: string) => void;
  clearCategoryDiscount: (categoryId: string) => void;
  handleCategoryDiscountSave: () => void;
  categorySaving: boolean;
  brands: AdminBrand[];
  brandsLoading: boolean;
  brandDiscounts: Record<string, number>;
  updateBrandDiscountValue: (brandId: string, value: string) => void;
  clearBrandDiscount: (brandId: string) => void;
  handleBrandDiscountSave: () => void;
  brandSaving: boolean;
  products: any[];
  productsLoading: boolean;
  productDiscounts: Record<string, number>;
  setProductDiscounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  handleProductDiscountSave: (productId: string) => void;
  savingProductId: string | null;
}

export function QuickSettingsContent({
  globalDiscount,
  setGlobalDiscount,
  discountLoading,
  discountSaving,
  handleDiscountSave,
  categories,
  categoriesLoading,
  categoryDiscounts,
  updateCategoryDiscountValue,
  clearCategoryDiscount,
  handleCategoryDiscountSave,
  categorySaving,
  brands,
  brandsLoading,
  brandDiscounts,
  updateBrandDiscountValue,
  clearBrandDiscount,
  handleBrandDiscountSave,
  brandSaving,
  products,
  productsLoading,
  productDiscounts,
  setProductDiscounts,
  handleProductDiscountSave,
  savingProductId,
}: QuickSettingsContentProps) {
  const { t } = useTranslation();

  return (
    <div className={dashboardMainClass}>
      <Card variant="admin" className={`${dashboardCardPadding} mb-6 sm:mb-8`}>
        <div className="mb-6">
          <h2 className={adminModalTitleClass}>{t('admin.quickSettings.quickSettingsTitle')}</h2>
          <p className={`mt-1 ${adminSectionSubtitleClass}`}>{t('admin.quickSettings.quickSettingsSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <GlobalDiscountCard
            globalDiscount={globalDiscount}
            setGlobalDiscount={setGlobalDiscount}
            discountLoading={discountLoading}
            discountSaving={discountSaving}
            handleDiscountSave={handleDiscountSave}
          />

          <QuickInfoCard />
        </div>
      </Card>

      <div className="space-y-6 sm:space-y-8">
        <CategoryDiscountsCard
          categories={categories}
          categoriesLoading={categoriesLoading}
          categoryDiscounts={categoryDiscounts}
          updateCategoryDiscountValue={updateCategoryDiscountValue}
          clearCategoryDiscount={clearCategoryDiscount}
          handleCategoryDiscountSave={handleCategoryDiscountSave}
          categorySaving={categorySaving}
        />

        <BrandDiscountsCard
          brands={brands}
          brandsLoading={brandsLoading}
          brandDiscounts={brandDiscounts}
          updateBrandDiscountValue={updateBrandDiscountValue}
          clearBrandDiscount={clearBrandDiscount}
          handleBrandDiscountSave={handleBrandDiscountSave}
          brandSaving={brandSaving}
        />

        <ProductDiscountsCard
          products={products}
          productsLoading={productsLoading}
          productDiscounts={productDiscounts}
          setProductDiscounts={setProductDiscounts}
          handleProductDiscountSave={handleProductDiscountSave}
          savingProductId={savingProductId}
        />
      </div>
    </div>
  );
}
