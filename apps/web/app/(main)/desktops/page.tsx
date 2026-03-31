'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-client';
import { TABLES, type TableConfig } from './table-data';
import { ReservationModal } from './ReservationModal';

// ---- Chair components ----
function ChairRow({ count, side }: { count: number; side: 'top' | 'bottom' | 'left' | 'right' }) {
  const isHorizontal = side === 'top' || side === 'bottom';
  return (
    <div
      className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} gap-1 items-center justify-center`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-[#fff4de] rounded-full border border-[#c8a96e]/40 ${
            isHorizontal ? 'w-5 h-3' : 'w-3 h-5'
          }`}
        />
      ))}
    </div>
  );
}

// ---- Single table card ----
function TableCard({
  table,
  onClick,
}: {
  table: TableConfig;
  onClick: (t: TableConfig) => void;
}) {
  const { t } = useTranslation();
  const label = t(`desktops.tables.${table.labelKey}`);
  const seatsText = t('desktops.tableCard.seats').replace('{n}', String(table.seats));
  const sideSeats = table.shape === 'oval' ? 3 : Math.floor(table.seats / 2);
  const isOval = table.shape === 'oval';

  return (
    <button
      type="button"
      onClick={() => onClick(table)}
      className="group flex flex-col items-center gap-1 focus:outline-none"
      title={label}
    >
      {/* Top chairs */}
      <ChairRow count={sideSeats} side="top" />

      <div className="flex flex-row items-center gap-1">
        {/* Left chairs (oval only) */}
        {isOval && <ChairRow count={2} side="left" />}

        {/* Table surface */}
        <div
          className={`
            relative flex items-center justify-center
            bg-[#fff4de] border-2 border-[#c8a96e]/60
            group-hover:border-[#7CB342] group-hover:bg-[#f5f0d8]
            group-hover:shadow-[0_0_16px_rgba(124,179,66,0.4)]
            transition-all duration-200 cursor-pointer
            ${isOval
              ? 'w-24 h-36 rounded-[50%]'
              : table.seats <= 2
              ? 'w-16 h-12 rounded-md'
              : 'w-20 h-12 rounded-md'
            }
          `}
        >
          <div className="text-center px-1">
            <p className="text-[#2F3F3D] font-semibold text-[9px] leading-tight line-clamp-2">
              {label}
            </p>
            <p className="text-[#7CB342] text-[8px] font-bold mt-0.5">{seatsText}</p>
            {table.byWindow && (
              <p className="text-[#c8a96e] text-[7px] mt-0.5">
                {t('desktops.tableCard.byWindow')}
              </p>
            )}
          </div>
          {/* Hover indicator */}
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#7CB342] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>

        {/* Right chairs (oval only) */}
        {isOval && <ChairRow count={2} side="right" />}
      </div>

      {/* Bottom chairs */}
      <ChairRow count={sideSeats} side="bottom" />
    </button>
  );
}

// ---- Floor plan zones ----
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

  const topTables   = TABLES.filter(t => t.zone === 'top');
  const leftTables  = TABLES.filter(t => t.zone === 'left');
  const centerTable = TABLES.filter(t => t.zone === 'center');
  const crTables    = TABLES.filter(t => t.zone === 'center-right');
  const winTables   = TABLES.filter(t => t.zone === 'window');
  const botTables   = TABLES.filter(t => t.zone === 'bottom');

  return (
    <div className="w-full bg-[#2F3F3D] relative min-h-screen">

      {/* Decorative overlays */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] md:w-[650px] aspect-square max-h-[650px] pointer-events-none z-0 opacity-30"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>
      <div
        className="absolute bottom-0 right-0 w-[300px] md:w-[450px] aspect-square max-h-[450px] pointer-events-none z-[1] opacity-20 translate-x-1/4 translate-y-1/4"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">

        {/* Page header */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7CB342] mb-2">
            {t('desktops.page.eyebrow')}
          </p>
          <h1 className="text-[#fff4de] text-4xl md:text-5xl lg:text-6xl font-light italic">
            {t('desktops.page.title')}
          </h1>
          <div className="w-16 h-[2px] bg-[#7CB342] mt-4" />
          <p className="text-[#fff4de]/60 text-sm mt-4">
            {t('desktops.page.subtitle')}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-8 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#fff4de] border border-[#c8a96e]/60" />
            <span className="text-[#fff4de]/70 text-xs">{t('desktops.legend.available')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#f5f0d8] border-2 border-[#7CB342] shadow-[0_0_10px_rgba(124,179,66,0.5)]" />
            <span className="text-[#fff4de]/70 text-xs">{t('desktops.legend.selected')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#7CB342]" />
            <span className="text-[#fff4de]/70 text-xs">{t('desktops.legend.book')}</span>
          </div>
        </div>

        {/* ===== FLOOR PLAN ===== */}
        <div className="bg-[#243330]/70 border border-[#3d504e] rounded-3xl p-6 md:p-10 overflow-x-auto">

          {/* TOP ROW */}
          <div className="flex justify-center gap-6 mb-10">
            {topTables.map(t => (
              <TableCard key={t.id} table={t} onClick={setSelectedTable} />
            ))}
          </div>

          {/* MIDDLE SECTION */}
          <div className="flex gap-6 items-center justify-center mb-10">

            {/* Left column */}
            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                {leftTables.slice(0, 2).map(t => (
                  <TableCard key={t.id} table={t} onClick={setSelectedTable} />
                ))}
              </div>
              <div className="flex gap-4">
                {leftTables.slice(2, 4).map(t => (
                  <TableCard key={t.id} table={t} onClick={setSelectedTable} />
                ))}
              </div>
            </div>

            {/* Center VIP oval */}
            <div className="flex-shrink-0 mx-4">
              {centerTable.map(t => (
                <TableCard key={t.id} table={t} onClick={setSelectedTable} />
              ))}
            </div>

            {/* Center-right 2x2 */}
            <div className="grid grid-cols-2 gap-4">
              {crTables.map(t => (
                <TableCard key={t.id} table={t} onClick={setSelectedTable} />
              ))}
            </div>

            {/* Window tables */}
            <div className="flex flex-col gap-6 ml-2">
              {winTables.map(t => (
                <TableCard key={t.id} table={t} onClick={setSelectedTable} />
              ))}
            </div>

          </div>

          {/* BOTTOM ROW */}
          <div className="flex justify-center gap-6 mb-6">
            {botTables.map(t => (
              <TableCard key={t.id} table={t} onClick={setSelectedTable} />
            ))}
          </div>

        </div>

        <p className="text-[#fff4de]/40 text-xs text-center mt-6">
          {t('desktops.page.footerNote')}
        </p>

      </div>

      {/* Reservation Modal */}
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
