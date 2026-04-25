export interface Category {
  id: string;
  slug: string;
  title: string;
  parentId: string | null;
  requiresSizes?: boolean;
  imageUrl?: string | null;
  children?: Category[];
}

export interface CategoryWithLevel extends Category {
  level: number;
}

export interface CategoryFormData {
  title: string;
  slug: string;
  parentId: string;
  requiresSizes: boolean;
  imageUrl: string;
  subcategoryIds: string[];
}








