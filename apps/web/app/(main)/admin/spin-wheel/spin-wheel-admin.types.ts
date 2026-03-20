export type PrizeAudience = 'all' | 'selected';

export interface SpinWheelPrizeProduct {
  productId: string;
  productTitle: string;
  productSlug: string;
  productImageUrl: string | null;
}

export interface SpinWheelPrize {
  id: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  productImageUrl: string | null;
  productIds: string[];
  products: SpinWheelPrizeProduct[];
  startDate: string;
  endDate: string;
  audience: PrizeAudience;
  userIds: string[];
  maxSpinsPerUser: number | null;
  weight: number;
}

export interface CategoryOption {
  id: string;
  title: string;
  slug: string;
}

export interface PickerProductItem {
  id: string;
  title: string;
  image: string | null;
}

export interface SelectedProductDisplay {
  id: string;
  title: string;
  imageUrl: string | null;
}

export interface UserOption {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export interface SpinWinRow {
  id: string;
  userId: string;
  userEmail: string | null;
  userPhone: string | null;
  userName: string | null;
  userContact: string;
  productId: string;
  productTitle: string | null;
  productSlug: string | null;
  prizeId: string;
  createdAt: string;
}

export interface PrizeFormState {
  startDate: string;
  endDate: string;
  audience: PrizeAudience;
  userIds: string[];
  maxSpinsPerUser: string;
  weight: string;
}

export const MAX_PRODUCTS_PER_PRIZE = 9;

export const INITIAL_FORM_STATE: PrizeFormState = {
  startDate: '',
  endDate: '',
  audience: 'all',
  userIds: [],
  maxSpinsPerUser: '',
  weight: '1',
};

export function toDateTimeLocalValue(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function toIsoValue(value: string): string {
  return new Date(value).toISOString();
}
