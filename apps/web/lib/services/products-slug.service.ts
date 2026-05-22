import { productSlugKey } from "@/lib/cache/redis-keys";
import { withRedisCache } from "@/lib/cache/with-redis-cache";
import { buildProductQuery } from "./products-slug/product-query-builder";
import { transformProduct } from "./products-slug/product-transformer";

const PRODUCT_SLUG_TTL_SECONDS = 120;

/**
 * Service for fetching products by slug
 */
class ProductsSlugService {
  /**
   * Get product by slug
   */
  async findBySlug(slug: string, lang: string = "en") {
    const cacheKey = productSlugKey(slug, lang);
    return withRedisCache(cacheKey, PRODUCT_SLUG_TTL_SECONDS, () =>
      this.findBySlugUncached(slug, lang)
    );
  }

  private async findBySlugUncached(slug: string, lang: string) {
    const product = await buildProductQuery(slug, lang);

    if (!product) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Product not found",
        detail: `Product with slug '${slug}' does not exist or is not published`,
      };
    }

    return transformProduct(product, lang);
  }
}

export const productsSlugService = new ProductsSlugService();
