import type { Category } from "@/components/CategoryNavigation/utils";

type CategoryNode = Pick<Category, "id" | "children">;

function collectDescendantIds(node: CategoryNode): string[] {
  const ids: string[] = [];
  for (const child of node.children ?? []) {
    ids.push(child.id);
    ids.push(...collectDescendantIds(child));
  }
  return ids;
}

/** In-memory map: category id → all descendant ids (excluding self). */
export function buildCategoryDescendantIdMap(
  roots: CategoryNode[]
): Map<string, string[]> {
  const map = new Map<string, string[]>();

  const walk = (node: CategoryNode) => {
    map.set(node.id, collectDescendantIds(node));
    for (const child of node.children ?? []) {
      walk(child);
    }
  };

  for (const root of roots) {
    walk(root);
  }

  return map;
}

function resolveCategoryIds(
  target: { id?: string },
  descendantMap: Map<string, string[]>
): string[] {
  if (!target.id) return [];
  return [target.id, ...(descendantMap.get(target.id) ?? [])];
}

export function productMatchesCategoryIds(
  product: {
    primaryCategoryId: string | null;
    categoryIds: string[];
  },
  categoryIds: Set<string>
): boolean {
  if (product.primaryCategoryId && categoryIds.has(product.primaryCategoryId)) {
    return true;
  }
  return product.categoryIds.some((id) => categoryIds.has(id));
}

export { buildCategoryDescendantIdMap, productMatchesCategoryIds };
