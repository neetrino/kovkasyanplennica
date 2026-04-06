import Link from 'next/link';
import { categoriesService } from '../../lib/services/categories.service';
import { getStoredLanguage } from '../../lib/language';

type CategoryTreeNode = {
  id: string;
  slug: string;
  title: string;
  children: CategoryTreeNode[];
};

async function getRootCategories(): Promise<CategoryTreeNode[]> {
  try {
    const lang = getStoredLanguage() || 'ru';
    const result = await categoriesService.getTree(lang);
    const data = result.data;
    return Array.isArray(data) ? (data as CategoryTreeNode[]) : [];
  } catch {
    return [];
  }
}

export async function MobileCategoriesSection() {
  const categories = await getRootCategories();

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="mb-9">
      <p className="mb-4 text-[16px] leading-[1.35]">Категории</p>
      <div className="-mr-4 flex gap-3 overflow-x-auto pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category, index) => (
          <Link
            key={category.id}
            href={`/products?category=${encodeURIComponent(category.slug)}`}
            className={`shrink-0 rounded-[40px] px-6 py-[9px] text-[16px] leading-[1.45] ${
              index === 0 ? 'bg-[#75bf5e] text-white' : 'bg-[#f1f5f5] text-[#0a2533]'
            }`}
          >
            {category.title}
          </Link>
        ))}
      </div>
    </section>
  );
}
