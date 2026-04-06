import { MobileCategoriesSection } from './MobileCategoriesSection';
import { MobileHomeReservationBlock } from './MobileHomeReservationBlock';
import { MobileNewArrivalsSection } from './MobileNewArrivalsSection';
import { MobileTopSection } from './MobileTopSection';

export async function MobileHomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#2f3f3d] pb-[216px] text-white lg:hidden">
      <div className="mx-auto flex w-full max-w-[375px] flex-col px-4 pt-6">
        <MobileTopSection />

        <MobileCategoriesSection />

        <MobileNewArrivalsSection />

        <MobileHomeReservationBlock />
      </div>
    </div>
  );
}
