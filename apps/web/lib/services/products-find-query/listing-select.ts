import { Prisma } from "@prisma/client";

const translationFields = {
  locale: true,
  slug: true,
  title: true,
  descriptionHtml: true,
} as const;

const brandTranslationFields = {
  locale: true,
  name: true,
} as const;

const categoryTranslationFields = {
  locale: true,
  slug: true,
  title: true,
} as const;

const labelFields = {
  id: true,
  type: true,
  value: true,
  position: true,
  color: true,
} as const;

const colorOptionSelect = {
  attributeKey: true,
  value: true,
  attributeValue: {
    select: {
      value: true,
      imageUrl: true,
      colors: true,
      translations: {
        select: {
          locale: true,
          label: true,
        },
      },
      attribute: {
        select: {
          key: true,
        },
      },
    },
  },
} as const;

const variantListingFields = {
  id: true,
  price: true,
  stock: true,
  compareAtPrice: true,
  attributes: true,
  options: {
    select: colorOptionSelect,
  },
} as const;

const variantListingFieldsWithoutAttributeValue = {
  id: true,
  price: true,
  stock: true,
  compareAtPrice: true,
  attributes: true,
  options: {
    select: {
      attributeKey: true,
      value: true,
    },
  },
} as const;

const variantListingFieldsWithoutAttributesColumn = {
  id: true,
  price: true,
  stock: true,
  compareAtPrice: true,
  options: {
    select: colorOptionSelect,
  },
} as const;

const variantListingFieldsMinimal = {
  id: true,
  price: true,
  stock: true,
  compareAtPrice: true,
  options: {
    select: {
      attributeKey: true,
      value: true,
    },
  },
} as const;

const productListingCore = {
  id: true,
  discountPercent: true,
  primaryCategoryId: true,
  categoryIds: true,
  media: true,
  brandId: true,
  translations: {
    select: translationFields,
  },
  brand: {
    select: {
      id: true,
      translations: {
        select: brandTranslationFields,
      },
    },
  },
  labels: {
    select: labelFields,
  },
  categories: {
    select: {
      id: true,
      translations: {
        select: categoryTranslationFields,
      },
    },
  },
} as const;

const listingSelect = {
  ...productListingCore,
  variants: {
    where: { published: true as const },
    select: variantListingFields,
  },
} satisfies Prisma.ProductSelect;

/** Phase 5C: minimal Prisma select for public catalog listing cards. */
export function getListingSelect() {
  return listingSelect;
}

export function getListingSelectWithoutAttributeValue(): Prisma.ProductSelect {
  return {
    ...productListingCore,
    variants: {
      where: { published: true },
      select: variantListingFieldsWithoutAttributeValue,
    },
  };
}

export function getListingSelectWithoutAttributesColumn(): Prisma.ProductSelect {
  return {
    ...productListingCore,
    variants: {
      where: { published: true },
      select: variantListingFieldsWithoutAttributesColumn,
    },
  };
}

export function getListingSelectMinimal(): Prisma.ProductSelect {
  return {
    ...productListingCore,
    variants: {
      where: { published: true },
      select: variantListingFieldsMinimal,
    },
  };
}

export type ProductListingRow = Prisma.ProductGetPayload<{
  select: typeof listingSelect;
}>;

export function asProductListingRows(rows: unknown): ProductListingRow[] {
  return rows as ProductListingRow[];
}
