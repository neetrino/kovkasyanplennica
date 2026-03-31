'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-client';
import { TABLES, type TableConfig } from './table-data';
import { ReservationModal } from './ReservationModal';
import { ScaledFigmaFloorPlan } from './figmaFloorPlan.scaled';

export default function DesktopsPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [selectedTable, setSelectedTable] = useState<TableConfig | null>(null);

  const productFromUrl = useMemo(() => {
    const title = searchParams.get('productTitle');
    const imageUrl = searchParams.get('productImageUrl');
    const profit = searchParams.get('profitCents');
    const profitNum = profit != null ? parseInt(profit, 10) : null;
    return {
      productTitle: title || null,
      productImageUrl: imageUrl || null,
      profitCents: profitNum != null && Number.isFinite(profitNum) ? profitNum : null,
    };
  }, [searchParams]);

  const topTables = TABLES.filter((x) => x.zone === 'top');
  const leftTables = TABLES.filter((x) => x.zone === 'left');
  const centerTable = TABLES.filter((x) => x.zone === 'center');
  const crTables = TABLES.filter((x) => x.zone === 'center-right');
  const winTables = TABLES.filter((x) => x.zone === 'window');
  const botTables = TABLES.filter((x) => x.zone === 'bottom');

  return (
    <div className="relative min-h-screen w-full bg-[#2F3E3E]">
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-0 aspect-square max-h-[650px] w-[400px] -translate-x-1/2 opacity-30 md:w-[650px]"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="size-full object-contain" />
      </div>
      <div
        className="pointer-events-none absolute bottom-0 right-0 z-[1] aspect-square max-h-[450px] w-[300px] translate-x-1/4 translate-y-1/4 opacity-20 md:w-[450px]"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="size-full object-contain" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="mb-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#7CB342]">
            {t('desktops.page.eyebrow')}
          </p>
          <h1 className="text-4xl font-light italic text-[#FCE6C9] md:text-5xl lg:text-6xl">
            {t('desktops.page.title')}
          </h1>
          <div className="mt-4 h-0.5 w-16 bg-[#7CB342]" />
        </div>

        <ScaledFigmaFloorPlan
          topTables={topTables}
          leftTables={leftTables}
          centerTable={centerTable}
          crTables={crTables}
          winTables={winTables}
          botTables={botTables}
          onSelectTable={setSelectedTable}
        />

        <p className="mt-6 text-center text-xs text-[#FCE6C9]/40">{t('desktops.page.footerNote')}</p>
      </div>

      {selectedTable && (
        <ReservationModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
          productTitle={productFromUrl.productTitle}
          productImageUrl={productFromUrl.productImageUrl}
          profitCents={productFromUrl.profitCents}
        />
      )}
    </div>
  );
}
