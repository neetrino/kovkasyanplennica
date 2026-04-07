import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ProductPageClient } from './ProductPageClient';
import { getProductForPage } from './get-product';
import { getPdpReviewsAndRelated } from './pdp-supplemental';
import { RESERVED_ROUTES } from './types';
import type { Product } from './types';

type PageParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED_ROUTES.includes(slug.toLowerCase())) {
    return { title: 'Product' };
  }
  const product = await getProductForPage(slug);
  if (!product) {
    return { title: 'Not found' };
  }
  const desc =
    typeof product.description === 'string' && product.description.length > 0
      ? product.description.slice(0, 160)
      : undefined;
  return {
    title: product.title,
    description: desc,
  };
}

export default async function Page({ params }: PageParams) {
  const { slug } = await params;
  if (RESERVED_ROUTES.includes(slug.toLowerCase())) {
    redirect(`/${slug}`);
  }

  const product = await getProductForPage(slug);
  if (!product) {
    notFound();
  }

  const { reviews, related } = await getPdpReviewsAndRelated(slug);

  return (
    <ProductPageClient
      params={params}
      initialProduct={product as unknown as Product}
      initialReviews={reviews}
      initialRelatedProducts={related}
    />
  );
}
