import Image from 'next/image';
import Link from 'next/link';
import { MOBILE_HOME_CATEGORIES } from './mobileHomeConfig';
import { MobileNewArrivalsSection } from './MobileNewArrivalsSection';
import { MobileTopSection } from './MobileTopSection';

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

export async function MobileHomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#2f3f3d] pb-[216px] text-white lg:hidden">
      <div className="mx-auto flex w-full max-w-[375px] flex-col px-4 pt-6">
        <MobileTopSection />

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

        <MobileNewArrivalsSection />

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
