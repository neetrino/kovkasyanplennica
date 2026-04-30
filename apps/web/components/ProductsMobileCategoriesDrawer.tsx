'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { useTranslation } from '@/lib/i18n-client';
import { ProductsCategorySidebar } from '@/components/CategoryNavigation/ProductsCategorySidebar';

const pillBase =
  'relative flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[rgba(200,200,200,0.36)] px-4 text-[16px] font-medium tracking-[0.02em] text-[rgba(255,230,196,0.6)] transition-colors hover:bg-[rgba(200,200,200,0.48)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fff4de]/50';

function FilterIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={22}
      height={21}
      viewBox="0 0 22 21"
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      <path
        d="M21.9999 17.7803C21.9999 17.9995 21.913 18.2098 21.7583 18.3649C21.6036 18.5199 21.3937 18.607 21.1749 18.607H15.5649C15.3812 19.2935 14.9765 19.9002 14.4137 20.3328C13.8509 20.7655 13.1613 21 12.452 21C11.7426 21 11.053 20.7655 10.4902 20.3328C9.92737 19.9002 9.52271 19.2935 9.33897 18.607H0.824997C0.606194 18.607 0.396353 18.5199 0.241636 18.3649C0.086919 18.2098 0 17.9995 0 17.7803C0 17.5611 0.086919 17.3508 0.241636 17.1957C0.396353 17.0407 0.606194 16.9536 0.824997 16.9536H9.33897C9.52271 16.2671 9.92737 15.6604 10.4902 15.2278C11.053 14.7951 11.7426 14.5606 12.452 14.5606C13.1613 14.5606 13.8509 14.7951 14.4137 15.2278C14.9765 15.6604 15.3812 16.2671 15.5649 16.9536H21.1749C21.3937 16.9536 21.6036 17.0407 21.7583 17.1957C21.913 17.3508 21.9999 17.5611 21.9999 17.7803ZM21.9999 3.2197C21.9999 3.43895 21.913 3.64922 21.7583 3.80425C21.6036 3.95929 21.3937 4.04638 21.1749 4.04638H18.4799C18.2962 4.73294 17.8915 5.33958 17.3287 5.77224C16.7659 6.2049 16.0763 6.43941 15.3669 6.43941C14.6576 6.43941 13.968 6.2049 13.4052 5.77224C12.8424 5.33958 12.4377 4.73294 12.254 4.04638H0.824997C0.716657 4.04638 0.609378 4.025 0.509284 3.98346C0.409191 3.94191 0.318244 3.88102 0.241636 3.80425C0.165028 3.72749 0.104259 3.63636 0.0627991 3.53606C0.0213391 3.43576 0 3.32826 0 3.2197C0 3.11114 0.0213391 3.00364 0.0627991 2.90335C0.104259 2.80305 0.165028 2.71192 0.241636 2.63515C0.318244 2.55839 0.409191 2.49749 0.509284 2.45595C0.609378 2.41441 0.716657 2.39302 0.824997 2.39302H12.254C12.4377 1.70646 12.8424 1.09983 13.4052 0.667168C13.968 0.234509 14.6576 0 15.3669 0C16.0763 0 16.7659 0.234509 17.3287 0.667168C17.8915 1.09983 18.2962 1.70646 18.4799 2.39302H21.1749C21.2837 2.39154 21.3916 2.41191 21.4924 2.45293C21.5931 2.49395 21.6847 2.55479 21.7616 2.63185C21.8385 2.70891 21.8992 2.80063 21.9401 2.9016C21.9811 3.00257 22.0014 3.11073 21.9999 3.2197ZM21.9999 10.4945C22.0014 10.6035 21.9811 10.7116 21.9401 10.8126C21.8992 10.9136 21.8385 11.0053 21.7616 11.0823C21.6847 11.1594 21.5931 11.2202 21.4924 11.2613C21.3916 11.3023 21.2837 11.3227 21.1749 11.3212H8.30497C8.12123 12.0077 7.71657 12.6144 7.15374 13.047C6.59091 13.4797 5.90135 13.7142 5.19198 13.7142C4.48261 13.7142 3.79305 13.4797 3.23023 13.047C2.6674 12.6144 2.26274 12.0077 2.07899 11.3212H0.824997C0.606194 11.3212 0.396353 11.2341 0.241636 11.079C0.086919 10.924 0 10.7137 0 10.4945C0 10.2752 0.086919 10.065 0.241636 9.90994C0.396353 9.75491 0.606194 9.66781 0.824997 9.66781H2.07899C2.26274 8.98125 2.6674 8.37461 3.23023 7.94195C3.79305 7.5093 4.48261 7.27479 5.19198 7.27479C5.90135 7.27479 6.59091 7.5093 7.15374 7.94195C7.71657 8.37461 8.12123 8.98125 8.30497 9.66781H21.1749C21.3937 9.66781 21.6036 9.75491 21.7583 9.90994C21.913 10.065 21.9999 10.2752 21.9999 10.4945Z"
        fill="#FFF4DE"
      />
    </svg>
  );
}

export type ProductsMobileCategoriesDrawerLayout = 'bar' | 'inline';

export type ProductsMobileCategoriesDrawerProps = {
  /** `bar`: full-width strip under header. `inline`: pill only (e.g. beside first category title). */
  layout?: ProductsMobileCategoriesDrawerLayout;
  className?: string;
};

export function ProductsMobileCategoriesDrawer({
  layout = 'bar',
  className,
}: ProductsMobileCategoriesDrawerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const closeLabel = t('products.mobileFilters.close');
  const isInline = layout === 'inline';

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const triggerButton = (
    <button
      type="button"
      className={`${pillBase} min-w-[170px] pl-[3.25rem] sm:min-w-[188px] ${isInline ? 'h-11 text-[14px] sm:h-12 sm:text-[15px]' : ''}`}
      aria-expanded={open}
      aria-controls="products-mobile-categories-panel"
      onClick={() => setOpen((v) => !v)}
    >
      <span className="pointer-events-none absolute left-[0.875rem] top-1/2 -translate-y-1/2">
        <FilterIcon />
      </span>
      {t('products.shop.categoryFilter')}
    </button>
  );

  const shell = isInline ? (
    <div className={className ?? ''}>{triggerButton}</div>
  ) : (
    <div className={`w-full border-b border-[#3d504e] bg-[#2F3F3D] py-3 sm:py-4 lg:hidden ${className ?? ''}`}>
      <div className="flex items-center justify-end px-3 sm:px-5 md:px-7">{triggerButton}</div>
    </div>
  );

  return (
    <>
      {shell}

      {open ? (
        <div className="fixed inset-0 z-app-overlay lg:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={closeLabel}
            onClick={close}
          />
          <div
            id="products-mobile-categories-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute left-0 top-0 flex h-[100dvh] max-h-[100dvh] w-[min(100vw-3rem,288px)] max-w-full flex-col border-r border-[#3d504e] bg-[#2F3F3D] pt-[env(safe-area-inset-top,0px)] shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#3d504e] px-3 py-3 pr-2">
              <h2
                id={titleId}
                className="min-w-0 truncate text-left text-base font-medium tracking-wide text-[#fff4de]"
              >
                {t('products.mobileFilters.title')}
              </h2>
              <button
                type="button"
                onClick={close}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#fff4de] transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fff4de]/60"
                aria-label={closeLabel}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-4 pb-8">
              <ProductsCategorySidebar
                variant="sidebar"
                fixedSidebarPillWidth
                onNavigate={close}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
