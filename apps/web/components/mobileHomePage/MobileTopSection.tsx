import Image from 'next/image';
import Link from 'next/link';
import { formatPrice, getStoredCurrency } from '../../lib/currency';
import type { MobileTopProduct } from '@/lib/home/mobile-home-sections';

/** Bottom-left blob for «Топ» card (matches design SVG). */
const MOBILE_TOP_CARD_GREEN_PATH =
  'M188.998 105.816C177.926 175.267 104.938 221.362 25.9751 208.773C-52.9879 196.185 -108.024 129.679 -96.9518 60.228C-85.8796 -9.22257 21.0272 -19.0189 74.8779 32.969C128.729 84.9568 206.027 -0.995504 188.998 105.816Z';

function MobileTopFeaturedCard({
  title,
  meta,
  imageSrc,
  href,
  priority,
}: {
  title: string;
  meta: string;
  imageSrc: string | null;
  href: string;
  priority?: boolean;
}) {
  return (
    <Link href={href} className="block shrink-0">
      <article className="relative h-[196px] w-[304px] overflow-hidden rounded-2xl bg-[#f1f5f5]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-contain object-center"
            priority={priority}
            sizes="304px"
          />
        ) : (
          <div className="absolute inset-0 bg-[#e8ecec]" aria-hidden />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(47,63,61,0)_32%,rgba(47,63,61,0.38)_100%)]" />
        <div className="absolute bottom-0 left-0 z-10 w-[min(192px,calc(100%-4px))]">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 192 121"
              fill="none"
              className="block h-auto w-full"
              aria-hidden
            >
              <path d={MOBILE_TOP_CARD_GREEN_PATH} fill="#75BF5E" />
            </svg>
            <div className="absolute inset-0 flex flex-col justify-end gap-2 px-3 pb-3 pt-6 text-white">
              <div className="flex min-w-0 items-center gap-1.5 text-[14px] leading-[1.45]">
                <Image src="/assets/mobile-home/time-light.svg" alt="" width={16} height={16} aria-hidden />
                <span className="truncate">{meta}</span>
              </div>
              <p className="line-clamp-2 text-[16px] leading-[1.35]">{title}</p>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

type MobileTopSectionProps = {
  products: MobileTopProduct[];
};

export function MobileTopSection({ products }: MobileTopSectionProps) {
  const currency = getStoredCurrency();

  return (
    <section className="mb-8">
      <p className="mb-[14px] text-[16px] leading-[1.35]">Топ</p>
      {products.length > 0 ? (
        <div className="-mr-4 flex gap-[10px] overflow-x-auto pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map((product, index) => (
            <MobileTopFeaturedCard
              key={product.id}
              title={product.title}
              meta={formatPrice(product.price, currency)}
              imageSrc={product.image}
              href={
                product.slug ? `/products/${product.slug}` : '/coming-soon'
              }
              priority={index < 3}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
