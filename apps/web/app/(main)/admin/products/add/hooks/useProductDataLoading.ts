import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import type { CurrencyCode } from '@/lib/currency';
import type { Brand, Category, Attribute } from '../types';
import { markEditTiming, measureEditAsync } from '../utils/editLoadTiming';

interface UseProductDataLoadingProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  setBrands: (brands: Brand[]) => void;
  setCategories: (categories: Category[]) => void;
  setAttributes: (attributes: Attribute[]) => void;
  setIsReferenceLoading: (loading: boolean) => void;
  setIsReferenceLoaded: (loaded: boolean) => void;
  setDefaultCurrency: (currency: CurrencyCode) => void;
  attributesDropdownOpen: boolean;
  setAttributesDropdownOpen: (open: boolean) => void;
  attributesDropdownRef: React.RefObject<HTMLDivElement | null>;
  categoriesExpanded: boolean;
  setCategoriesExpanded: (expanded: boolean) => void;
  brandsExpanded: boolean;
  setBrandsExpanded: (expanded: boolean) => void;
}

export function useProductDataLoading({
  isLoggedIn,
  isAdmin,
  isLoading,
  setBrands,
  setCategories,
  setAttributes,
  setIsReferenceLoading,
  setIsReferenceLoaded,
  setDefaultCurrency,
  attributesDropdownOpen,
  setAttributesDropdownOpen,
  attributesDropdownRef,
  categoriesExpanded,
  setCategoriesExpanded,
  brandsExpanded,
  setBrandsExpanded,
}: UseProductDataLoadingProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/admin');
        return;
      }
      markEditTiming('auth ready');
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attributesDropdownRef.current && !attributesDropdownRef.current.contains(event.target as Node)) {
        setAttributesDropdownOpen(false);
      }
    };

    if (attributesDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [attributesDropdownOpen, attributesDropdownRef, setAttributesDropdownOpen]);

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      setDefaultCurrency('RUB' as CurrencyCode);
    }
  }, [isLoggedIn, isAdmin, setDefaultCurrency]);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin || isLoading) {
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setIsReferenceLoading(true);
      setIsReferenceLoaded(false);
      markEditTiming('reference data fetch start');

      try {
        const [brandsRes, categoriesRes, attributesRes] = await Promise.all([
          measureEditAsync('brands GET', () =>
            apiClient.get<{ data: Brand[] }>('/api/v1/admin/brands')
          ),
          measureEditAsync('categories GET', () =>
            apiClient.get<{ data: Category[] }>('/api/v1/admin/categories')
          ),
          measureEditAsync('attributes GET', () =>
            apiClient.get<{ data: Attribute[] }>('/api/v1/admin/attributes')
          ),
        ]);

        if (cancelled) return;

        setBrands(brandsRes.data || []);
        setCategories(categoriesRes.data || []);
        setAttributes(attributesRes.data || []);

        const attributeValueCount = (attributesRes.data || []).reduce(
          (sum, attr) => sum + (attr.values?.length || 0),
          0
        );

        markEditTiming('reference data loaded', {
          brands: brandsRes.data?.length || 0,
          categories: categoriesRes.data?.length || 0,
          attributes: attributesRes.data?.length || 0,
          attributeValues: attributeValueCount,
        });

        if (process.env.NODE_ENV === 'development' && attributeValueCount === 0) {
          console.warn('⚠️ [ADMIN] No attributes loaded — variant builder may be limited.');
        }
      } catch (err: unknown) {
        if (!cancelled) {
          console.error('❌ [ADMIN] Error fetching reference data:', err);
          setBrands([]);
          setCategories([]);
          setAttributes([]);
        }
      } finally {
        if (!cancelled) {
          setIsReferenceLoading(false);
          setIsReferenceLoaded(true);
          markEditTiming('reference data fetch end');
        }
      }
    };

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, isAdmin, isLoading, setBrands, setCategories, setAttributes, setIsReferenceLoading, setIsReferenceLoaded]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (categoriesExpanded && !target.closest('[data-category-dropdown]')) {
        setCategoriesExpanded(false);
      }
    };

    if (categoriesExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [categoriesExpanded, setCategoriesExpanded]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (brandsExpanded && !target.closest('[data-brand-dropdown]')) {
        setBrandsExpanded(false);
      }
    };

    if (brandsExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [brandsExpanded, setBrandsExpanded]);
}
