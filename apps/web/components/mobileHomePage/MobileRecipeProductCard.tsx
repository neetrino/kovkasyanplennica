import Image from 'next/image';
import Link from 'next/link';

export type MobileRecipeProductCardProps = {
  slug: string;
  title: string;
  imageSrc: string | null;
  caloriesLabel: string;
  durationLabel: string;
};

export function MobileRecipeProductCard({
  slug,
  title,
  imageSrc,
  caloriesLabel,
  durationLabel,
}: MobileRecipeProductCardProps) {
  const href = slug ? `/products/${slug}` : '/products';

  return (
    <article className="h-[240px] w-[200px] shrink-0 rounded-2xl bg-white p-4 shadow-[0_2px_16px_rgba(6,51,54,0.1)]">
      <Link href={href} className="block text-inherit no-underline">
        <div className="relative mb-4 flex h-32 w-full items-center justify-center overflow-hidden rounded-2xl bg-[#f1f5f5]">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={title}
              fill
              className="object-contain object-center"
              sizes="200px"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#eef1f3]">
              <span className="text-[12px] text-[#97a2b0]">{title.slice(0, 1)}</span>
            </div>
          )}
        </div>
        <h3 className="mb-2 text-[16px] font-bold leading-[1.35] text-[#0a2533]">{title}</h3>
        <div className="flex items-center gap-2 text-[14px] leading-[1.45] text-[#97a2b0]">
          <span className="flex items-center gap-1">
            <Image src="/assets/mobile-home/calories.svg" alt="" width={16} height={16} aria-hidden />
            {caloriesLabel}
          </span>
          <Image src="/assets/mobile-home/separator.svg" alt="" width={4} height={4} aria-hidden />
          <span className="flex items-center gap-1">
            <Image src="/assets/mobile-home/time-dark.svg" alt="" width={16} height={16} aria-hidden />
            {durationLabel}
          </span>
        </div>
      </Link>
    </article>
  );
}
