export interface MobileCategoryItem {
  id: string;
  label: string;
  active?: boolean;
}

export const MOBILE_HOME_CATEGORIES: MobileCategoryItem[] = [
  { id: 'meat', label: 'Мясо', active: true },
  { id: 'vegan', label: 'Веган' },
  { id: 'seafood', label: 'Морепродукты' },
];
