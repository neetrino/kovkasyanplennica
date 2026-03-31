'use client';

import type { ReactNode } from 'react';
import { useTranslation } from '@/lib/i18n-client';
import type { TableConfig } from './table-data';
import {
  GraphicBoothOne,
  GraphicBoothTwo,
  GraphicLeft2Compact,
  GraphicLeft2Wide,
  GraphicOval78,
  GraphicRect34,
  GraphicTop2Seats,
  GraphicTop3Seats,
  GraphicWindow34,
} from './figmaFloorPlan.graphics';

const HIT =
  'absolute cursor-pointer border-0 bg-transparent p-0 transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7CB342]';

type HitProps = {
  table: TableConfig;
  label: string;
  className: string;
  children: ReactNode;
  onSelect: (t: TableConfig) => void;
};

function TableHit({ table, label, className, children, onSelect }: HitProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => onSelect(table)}
      className={`${HIT} ${className}`}
    >
      {children}
    </button>
  );
}

export type FigmaFloorPlanProps = {
  topTables: TableConfig[];
  leftTables: TableConfig[];
  centerTable: TableConfig[];
  crTables: TableConfig[];
  winTables: TableConfig[];
  botTables: TableConfig[];
  onSelectTable: (t: TableConfig) => void;
};

export function FigmaFloorPlan({
  topTables,
  leftTables,
  centerTable,
  crTables,
  winTables,
  botTables,
  onSelectTable,
}: FigmaFloorPlanProps) {
  const { t } = useTranslation();
  const label = (table: TableConfig) => t(`desktops.tables.${table.labelKey}`);

  const [t1, t2, t3, t4] = topTables;
  const [t5, t6, t7, t8] = leftTables;
  const [t9] = centerTable;
  const [t10, t11, t12, t13] = crTables;
  const [t14, t15, t16] = winTables;
  const [t17, t18, t19, t20] = botTables;

  const windowNote = `(${t('desktops.tableCard.byWindow')})`;

  return (
    <div className="relative h-[1124px] w-[1308px] shrink-0">
      <TableHit
        table={t9}
        label={label(t9)}
        onSelect={onSelectTable}
        className="left-[429px] top-[297px] h-[314.897px] w-[208.11px]"
      >
        <GraphicOval78 className="pointer-events-none h-full w-full" />
      </TableHit>

      <div className="absolute left-[464px] top-[51px] flex items-center gap-[72px]">
        <TableHit
          table={t1}
          label={label(t1)}
          onSelect={onSelectTable}
          className="relative h-[132.283px] w-[120.955px] shrink-0"
        >
          <GraphicTop2Seats className="pointer-events-none h-full w-full" />
        </TableHit>
        <TableHit
          table={t2}
          label={label(t2)}
          onSelect={onSelectTable}
          className="relative h-[132.336px] w-[179.359px] shrink-0"
        >
          <GraphicTop3Seats className="pointer-events-none h-full w-full" />
        </TableHit>
        <TableHit
          table={t3}
          label={label(t3)}
          onSelect={onSelectTable}
          className="relative h-[132.336px] w-[179.359px] shrink-0"
        >
          <GraphicTop3Seats className="pointer-events-none h-full w-full" />
        </TableHit>
        <TableHit
          table={t4}
          label={label(t4)}
          onSelect={onSelectTable}
          className="relative h-[132.283px] w-[120.955px] shrink-0"
        >
          <GraphicTop2Seats className="pointer-events-none h-full w-full" />
        </TableHit>
      </div>

      <TableHit
        table={t5}
        label={label(t5)}
        onSelect={onSelectTable}
        className="left-px top-[341px] h-[82.607px] w-[182.117px]"
      >
        <GraphicLeft2Compact className="pointer-events-none h-full w-full" />
      </TableHit>
      <TableHit
        table={t6}
        label={label(t6)}
        onSelect={onSelectTable}
        className="left-[216px] top-[329px] h-[92.962px] w-[177.611px]"
      >
        <GraphicLeft2Wide className="pointer-events-none h-full w-full" />
      </TableHit>
      <TableHit
        table={t7}
        label={label(t7)}
        onSelect={onSelectTable}
        className="left-0 top-[478px] h-[120.272px] w-[182.24px]"
      >
        <GraphicRect34 className="pointer-events-none h-full w-full" />
      </TableHit>
      <TableHit
        table={t8}
        label={label(t8)}
        onSelect={onSelectTable}
        className="left-[216px] top-[478px] h-[120.272px] w-[182.24px]"
      >
        <GraphicRect34 className="pointer-events-none h-full w-full" />
      </TableHit>

      <TableHit
        table={t10}
        label={label(t10)}
        onSelect={onSelectTable}
        className="left-[658px] top-[276px] h-[120.272px] w-[182.24px]"
      >
        <GraphicRect34 className="pointer-events-none h-full w-full" />
      </TableHit>
      <TableHit
        table={t11}
        label={label(t11)}
        onSelect={onSelectTable}
        className="left-[874.24px] top-[276px] h-[120.272px] w-[182.24px]"
      >
        <GraphicRect34 className="pointer-events-none h-full w-full" />
      </TableHit>
      <TableHit
        table={t12}
        label={label(t12)}
        onSelect={onSelectTable}
        className="left-[662px] top-[472px] h-[120.272px] w-[182.24px]"
      >
        <GraphicRect34 className="pointer-events-none h-full w-full" />
      </TableHit>
      <TableHit
        table={t13}
        label={label(t13)}
        onSelect={onSelectTable}
        className="left-[878px] top-[472px] h-[120.272px] w-[182.24px]"
      >
        <GraphicRect34 className="pointer-events-none h-full w-full" />
      </TableHit>

      <TableHit
        table={t14}
        label={label(t14)}
        onSelect={onSelectTable}
        className="left-[1162px] top-[221px] h-[182.083px] w-[120.174px]"
      >
        <GraphicWindow34 windowNote={windowNote} className="pointer-events-none h-full w-full" />
      </TableHit>
      <TableHit
        table={t15}
        label={label(t15)}
        onSelect={onSelectTable}
        className="left-[1162px] top-[436px] h-[182.083px] w-[120.174px]"
      >
        <GraphicWindow34 windowNote={windowNote} className="pointer-events-none h-full w-full" />
      </TableHit>
      <TableHit
        table={t16}
        label={label(t16)}
        onSelect={onSelectTable}
        className="left-[1162px] top-[651px] h-[182.083px] w-[120.174px]"
      >
        <GraphicWindow34 windowNote={windowNote} className="pointer-events-none h-full w-full" />
      </TableHit>

      <TableHit
        table={t17}
        label={label(t17)}
        onSelect={onSelectTable}
        className="left-[398px] top-[883px] h-[240.901px] w-[246.991px]"
      >
        <GraphicBoothOne className="pointer-events-none h-full w-full" />
      </TableHit>
      <TableHit
        table={t18}
        label={label(t18)}
        onSelect={onSelectTable}
        className="left-[619px] top-[883px] h-[240.901px] w-[246.987px]"
      >
        <GraphicBoothTwo className="pointer-events-none h-full w-full" />
      </TableHit>
      <TableHit
        table={t19}
        label={label(t19)}
        onSelect={onSelectTable}
        className="left-[840px] top-[883px] h-[240.901px] w-[246.987px]"
      >
        <GraphicBoothTwo className="pointer-events-none h-full w-full" />
      </TableHit>
      <TableHit
        table={t20}
        label={label(t20)}
        onSelect={onSelectTable}
        className="left-[1061px] top-[883px] h-[240.901px] w-[246.987px]"
      >
        <GraphicBoothTwo className="pointer-events-none h-full w-full" />
      </TableHit>
    </div>
  );
}
