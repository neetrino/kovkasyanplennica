import Image from 'next/image';
import Link from 'next/link';
import {
  MOBILE_HOME_BANNERS,
  MOBILE_HOME_CATEGORIES,
  MOBILE_HOME_RECIPES,
} from './mobileHomeConfig';

function MobileBannerCard({
  title,
  duration,
  imageSrc,
}: {
  title: string;
  duration: string;
  imageSrc: string;
}) {
  return (
    <article className="relative h-[168px] w-[286px] shrink-0 overflow-hidden rounded-2xl bg-white">
      <Image src={imageSrc} alt={title} fill className="object-cover" priority />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(47,63,61,0)_32%,rgba(47,63,61,0.38)_100%)]" />
      <div className="absolute bottom-0 left-0 flex w-[152px] flex-col gap-2 rounded-tr-[24px] bg-[#75bf5e] px-3 py-3 text-white">
        <div className="flex items-center gap-1.5 text-[14px] leading-[1.45]">
          <Image src="/assets/mobile-home/time-light.svg" alt="" width={16} height={16} aria-hidden />
          <span>{duration}</span>
        </div>
        <p className="text-[16px] leading-[1.35]">{title}</p>
      </div>
    </article>
  );
}

function MobileRecipeCard({
  title,
  calories,
  duration,
  imageSrc,
}: {
  title: string;
  calories: string;
  duration: string;
  imageSrc: string;
}) {
  return (
    <article className="relative h-[240px] w-[200px] shrink-0 rounded-2xl bg-white p-4 shadow-[0_2px_16px_rgba(6,51,54,0.1)]">
      <div className="relative mb-4 h-32 overflow-hidden rounded-2xl">
        <Image src={imageSrc} alt={title} fill className="object-cover" />
      </div>
      <button
        type="button"
        className="absolute right-4 top-4 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white shadow-[0_2px_16px_rgba(6,51,54,0.1)]"
        aria-label={`Добавить ${title} в избранное`}
      >
        <Image src="/assets/mobile-home/heart.svg" alt="" width={24} height={24} aria-hidden />
      </button>
      <h3 className="mb-2 text-[16px] font-bold leading-[1.35] text-[#0a2533]">{title}</h3>
      <div className="flex items-center gap-2 text-[14px] leading-[1.45] text-[#97a2b0]">
        <span className="flex items-center gap-1">
          <Image src="/assets/mobile-home/calories.svg" alt="" width={16} height={16} aria-hidden />
          {calories}
        </span>
        <Image src="/assets/mobile-home/separator.svg" alt="" width={4} height={4} aria-hidden />
        <span className="flex items-center gap-1">
          <Image src="/assets/mobile-home/time-dark.svg" alt="" width={16} height={16} aria-hidden />
          {duration}
        </span>
      </div>
    </article>
  );
}

function MobileReservationField({
  iconSrc,
  value,
}: {
  iconSrc: string;
  value?: string;
}) {
  return (
    <button
      type="button"
      className="flex h-12 w-full items-center rounded-[40px] bg-[#dbdbdb] px-5 text-left text-[14px] text-[#909090]"
      aria-label={value ? value : 'Выбрать значение'}
    >
      <Image src={iconSrc} alt="" width={16} height={16} aria-hidden />
      <span className="ml-3 flex-1">{value ?? ''}</span>
      <Image src="/assets/mobile-home/reserve-chevron.svg" alt="" width={21} height={21} aria-hidden />
    </button>
  );
}

export function MobileHomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#2f3f3d] pb-[216px] text-white lg:hidden">
      <div className="mx-auto flex w-full max-w-[375px] flex-col px-4 pt-6">
        <section className="mb-8">
          <p className="mb-[14px] text-[16px] leading-[1.35]">Топ</p>
          <div className="-mr-4 flex gap-[10px] overflow-x-auto pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MOBILE_HOME_BANNERS.map((banner) => (
              <MobileBannerCard key={banner.id} {...banner} />
            ))}
          </div>
        </section>

        <section className="mb-9">
          <p className="mb-4 text-[16px] leading-[1.35]">Категории</p>
          <div className="-mr-4 flex gap-3 overflow-x-auto pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MOBILE_HOME_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`shrink-0 rounded-[40px] px-6 py-[9px] text-[16px] leading-[1.45] ${
                  category.active ? 'bg-[#75bf5e] text-white' : 'bg-[#f1f5f5] text-[#0a2533]'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-7">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-[16px] leading-[1.35]">Новинки</p>
            <Link href="/products" className="text-[16px] leading-[1.35] text-[#75bf5e]">
              Смотреть Все
            </Link>
          </div>
          <div className="-mr-4 flex gap-4 overflow-x-auto pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MOBILE_HOME_RECIPES.map((recipe) => (
              <MobileRecipeCard key={recipe.id} {...recipe} />
            ))}
          </div>
        </section>

        <section className="rounded-[24px] bg-white px-5 pb-9 pt-[22px] text-[#0a2533]">
          <h2 className="mb-[38px] text-center text-[16px] font-bold leading-[1.35]">
            Забронировать Стол
          </h2>
          <div className="space-y-[19px]">
            <MobileReservationField iconSrc="/assets/mobile-home/reserve-calendar.svg" />
            <MobileReservationField iconSrc="/assets/mobile-home/reserve-clock.svg" />
            <MobileReservationField
              iconSrc="/assets/mobile-home/reserve-users.svg"
              value="2 персоны"
            />
          </div>
        </section>

        <Link
          href="/desktops"
          className="mt-5 flex h-14 items-center justify-center rounded-[48px] bg-[#75bf5e] text-[16px] font-bold leading-6 text-white"
        >
          Забронировать
        </Link>
      </div>
    </div>
  );
}
