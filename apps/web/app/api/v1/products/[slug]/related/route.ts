import { NextRequest, NextResponse } from 'next/server';
import { productsService } from '@/lib/services/products.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/products/[slug]/related
 * Related products for PDP — same rules as client list (category if present, else catalog),
 * excluding the current product. Enables parallel fetch using only slug (no productId wait).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') || 'ru';

    const product = await productsService.findBySlug(slug, lang);
    if (!product?.id) {
      return NextResponse.json(
        {
          type: 'https://api.shop.am/problems/not-found',
          title: 'Product not found',
          status: 404,
          detail: `Product with slug '${slug}' does not exist`,
          instance: req.url,
        },
        { status: 404 }
      );
    }

    const categorySlug = product.categories?.[0]?.slug;
    const result = await productsService.findAll({
      page: 1,
      limit: 30,
      lang,
      ...(categorySlug ? { category: categorySlug } : {}),
    });

    const rows = result.data && Array.isArray(result.data) ? result.data : [];
    const filtered = rows.filter((p: { id: string }) => p.id !== product.id).slice(0, 10);

    return NextResponse.json({ data: filtered });
  } catch (error: unknown) {
    const err = error as { status?: number; detail?: string; message?: string };
    if (err.status === 404) {
      return NextResponse.json(
        {
          type: 'https://api.shop.am/problems/not-found',
          title: 'Product not found',
          status: 404,
          detail: err.detail || 'Product not found',
          instance: req.url,
        },
        { status: 404 }
      );
    }
    const status = err.status ?? 500;
    return NextResponse.json(
      {
        type: 'https://api.shop.am/problems/internal-error',
        title: 'Internal Server Error',
        status,
        detail: err.detail || err.message || 'An error occurred',
        instance: req.url,
      },
      { status }
    );
  }
}
