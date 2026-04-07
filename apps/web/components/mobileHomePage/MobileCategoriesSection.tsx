import Link from 'next/link';
import type { MobileCategoryChipNode } from '@/lib/home/mobile-home-sections';

type MobileCategoriesSectionProps = {
  categories: MobileCategoryChipNode[];
};

export function MobileCategoriesSection({ categories }: MobileCategoriesSectionProps) {
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
