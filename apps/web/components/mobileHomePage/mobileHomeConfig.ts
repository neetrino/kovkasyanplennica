export interface MobileBannerItem {
  id: string;
  title: string;
  duration: string;
  imageSrc: string;
}

export interface MobileCategoryItem {
  id: string;
  label: string;
  active?: boolean;
}

export interface MobileRecipeItem {
  id: string;
  title: string;
  calories: string;
  duration: string;
  imageSrc: string;
}

export const MOBILE_HOME_BANNERS: MobileBannerItem[] = [
  {
    id: 'steak-mushrooms-1',
    title: 'Куриный стейк с Грибами',
    duration: '20 Мин',
    imageSrc: '/assets/mobile-home/banner-dish.png',
  },
  {
    id: 'steak-mushrooms-2',
    title: 'Куриный стейк с Грибами',
    duration: '20 Мин',
    imageSrc: '/assets/mobile-home/banner-dish.png',
  },
];

export const MOBILE_HOME_CATEGORIES: MobileCategoryItem[] = [
  { id: 'meat', label: 'Мясо', active: true },
  { id: 'vegan', label: 'Веган' },
  { id: 'seafood', label: 'Морепродукты' },
];

export const MOBILE_HOME_RECIPES: MobileRecipeItem[] = [
  {
    id: 'pork-kebab',
    title: 'Шашлык из свинины',
    calories: '120 Ккал',
    duration: '20 Мин',
    imageSrc: '/assets/mobile-home/banner-dish.png',
  },
  {
    id: 'shrimp-salad',
    title: 'Салат с креветками',
    calories: '64 Ккал',
    duration: '12 Min',
    imageSrc: '/assets/mobile-home/card-salad.png',
  },
];
