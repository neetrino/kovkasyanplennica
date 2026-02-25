import { HomePage } from '../components/homePage/HomePage';
import { MobileHomePage } from '../components/mobileHomePage/MobileHomePage';

/**
 * Գլխավոր էջ — դեսկտոպում HomePage, մոբայլում (< md) MobileHomePage.
 * Оба рендерятся; видимость переключается по breakpoint md (768px).
 */
export default async function Page() {
  return (
    <>
      {/* Desktop: visible from 768px */}
      <div className="hidden md:block">
        <HomePage />
      </div>
      {/* Mobile: visible below 768px */}
      <div className="block md:hidden">
        <MobileHomePage />
      </div>
    </>
  );
}
