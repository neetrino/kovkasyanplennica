'use client';

import type { CSSProperties } from 'react';
import { useTranslation } from '@/lib/i18n-client';
import type { TableConfig } from './table-data';

const HIT =
  'absolute cursor-pointer border-0 bg-transparent p-0 transition-[filter,transform] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffe5c2]';
const TABLE_FILL = 'bg-[#ffe5c2]';
const TABLE_TEXT = 'text-[#4b564f]';
const TABLE_SIZE_SCALE = 1.6;
const TABLE_CLUSTER_SCALE_X = 1.05;
const TABLE_CLUSTER_SCALE_Y = 1.26;
const FLOOR_PLAN_CENTER = { x: 531.5, y: 751 };
const FLOOR_PLAN_OFFSET = { x: -50, y: 190 };

type TableKind = 'square' | 'vertical' | 'small' | 'oval' | 'diagonal';
type ChairSet = 'horizontal4' | 'vertical4' | 'vertical6' | 'solo2' | 'oval2' | 'diagonal8';

type TablePlacement = {
  id: TableConfig['id'];
  x: number;
  y: number;
  w: number;
  h: number;
  kind: TableKind;
  chairs: ChairSet;
  rotate?: number;
};

type FixturePlacement = {
  label: 'Бар' | 'Хостес' | 'Мангал';
  x: number;
  y: number;
  w: number;
  h: number;
  radius: string;
};

const TABLE_PLACEMENTS: readonly TablePlacement[] = [
  { id: 't20', x: 59, y: 20, w: 108, h: 128, kind: 'vertical', chairs: 'vertical4' },
  { id: 't19', x: 59, y: 178, w: 108, h: 128, kind: 'vertical', chairs: 'vertical4' },
  { id: 't18', x: 59, y: 333, w: 108, h: 128, kind: 'vertical', chairs: 'vertical4' },
  { id: 't17', x: 59, y: 492, w: 108, h: 128, kind: 'vertical', chairs: 'vertical4' },
  { id: 't16', x: 59, y: 675, w: 108, h: 128, kind: 'vertical', chairs: 'vertical4' },
  { id: 't15', x: 254, y: 33, w: 118, h: 84, kind: 'square', chairs: 'horizontal4' },
  { id: 't14', x: 252, y: 244, w: 122, h: 122, kind: 'oval', chairs: 'oval2' },
  { id: 't13', x: 440, y: 33, w: 118, h: 84, kind: 'square', chairs: 'horizontal4' },
  { id: 't12', x: 440, y: 178, w: 118, h: 84, kind: 'square', chairs: 'horizontal4' },
  { id: 't11', x: 389, y: 404, w: 104, h: 214, kind: 'diagonal', chairs: 'diagonal8', rotate: -21 },
  { id: 't10', x: 613, y: 33, w: 118, h: 84, kind: 'square', chairs: 'horizontal4' },
  { id: 't9', x: 613, y: 178, w: 118, h: 84, kind: 'square', chairs: 'horizontal4' },
  { id: 't8', x: 613, y: 333, w: 118, h: 84, kind: 'square', chairs: 'horizontal4' },
  { id: 't7', x: 786, y: 33, w: 118, h: 84, kind: 'square', chairs: 'horizontal4' },
  { id: 't6', x: 786, y: 178, w: 118, h: 84, kind: 'square', chairs: 'horizontal4' },
  { id: 't5', x: 786, y: 333, w: 118, h: 84, kind: 'square', chairs: 'horizontal4' },
  { id: 't4', x: 959, y: 33, w: 118, h: 84, kind: 'square', chairs: 'horizontal4' },
  { id: 't3', x: 959, y: 178, w: 118, h: 84, kind: 'square', chairs: 'horizontal4' },
  { id: 't2', x: 959, y: 333, w: 118, h: 84, kind: 'square', chairs: 'horizontal4' },
  { id: 't1', x: 967, y: 494, w: 96, h: 110, kind: 'small', chairs: 'solo2' },
  { id: 't25', x: 568, y: 634, w: 92, h: 118, kind: 'small', chairs: 'solo2' },
  { id: 't21', x: 365, y: 737, w: 94, h: 170, kind: 'diagonal', chairs: 'diagonal8', rotate: 22 },
  { id: 't22', x: 342, y: 1053, w: 118, h: 142, kind: 'vertical', chairs: 'vertical6' },
  { id: 't23', x: 522, y: 1053, w: 118, h: 142, kind: 'vertical', chairs: 'vertical6' },
  { id: 't24', x: 727, y: 1068, w: 124, h: 124, kind: 'oval', chairs: 'solo2' },
];

const FIXTURES: readonly FixturePlacement[] = [
  { label: 'Бар', x: 60, y: 900, w: 164, h: 315, radius: 'rounded-[7px]' },
  { label: 'Хостес', x: 718, y: 681, w: 145, h: 349, radius: 'rounded-[7px]' },
  { label: 'Мангал', x: 60, y: 1375, w: 842, h: 91, radius: 'rounded-[7px]' },
];

function Chair({ className, style }: { className: string; style?: CSSProperties }) {
  return <span aria-hidden style={style} className={`absolute size-[18px] rounded-full ${TABLE_FILL} ${className}`} />;
}

function TableBody({ kind }: { kind: TableKind }) {
  if (kind === 'oval') {
    return <span className={`absolute inset-[17%] rounded-full ${TABLE_FILL}`} />;
  }
  if (kind === 'vertical') {
    return <span className={`absolute inset-y-[15%] left-[28%] right-[28%] rounded-[7px] ${TABLE_FILL}`} />;
  }
  if (kind === 'diagonal') {
    return <span className={`absolute inset-y-[9%] left-[24%] right-[24%] rounded-[7px] ${TABLE_FILL}`} />;
  }
  if (kind === 'small') {
    return <span className={`absolute inset-x-[17%] inset-y-[24%] rounded-[7px] ${TABLE_FILL}`} />;
  }
  return <span className={`absolute inset-x-[14%] inset-y-[10%] rounded-[7px] ${TABLE_FILL}`} />;
}

function Chairs({ set }: { set: ChairSet }) {
  if (set === 'horizontal4') {
    return (
      <>
        <Chair className="left-[30%] top-[-16px]" />
        <Chair className="right-[30%] top-[-16px]" />
        <Chair className="bottom-[-16px] left-[30%]" />
        <Chair className="bottom-[-16px] right-[30%]" />
      </>
    );
  }
  if (set === 'vertical4') {
    return (
      <>
        <Chair className="left-[-7px] top-[30%]" />
        <Chair className="bottom-[30%] left-[-7px]" />
        <Chair className="right-[-7px] top-[30%]" />
        <Chair className="bottom-[30%] right-[-7px]" />
      </>
    );
  }
  return <ExtraChairs set={set} />;
}

function ExtraChairs({ set }: { set: ChairSet }) {
  if (set === 'solo2' || set === 'oval2') {
    return (
      <>
        <Chair className="left-1/2 top-[-7px] -translate-x-1/2" />
        <Chair className="bottom-[-7px] left-1/2 -translate-x-1/2" />
      </>
    );
  }
  if (set === 'vertical6') {
    return (
      <>
        {[18, 50, 82].map((top) => (
          <Chair key={`l-${top}`} className="left-[-7px]" style={{ top: `${top}%` }} />
        ))}
        {[18, 50, 82].map((top) => (
          <Chair key={`r-${top}`} className="right-[-7px]" style={{ top: `${top}%` }} />
        ))}
      </>
    );
  }
  return <DiagonalChairs />;
}

function DiagonalChairs() {
  return (
    <>
      {[12, 32, 52, 72].map((top) => (
        <Chair key={`dl-${top}`} className="left-[-4px]" style={{ top: `${top}%` }} />
      ))}
      {[12, 32, 52, 72].map((top) => (
        <Chair key={`dr-${top}`} className="right-[-4px]" style={{ top: `${top}%` }} />
      ))}
    </>
  );
}

function getTableStyle(placement: TablePlacement): CSSProperties {
  const scaledWidth = placement.w * TABLE_SIZE_SCALE;
  const scaledHeight = placement.h * TABLE_SIZE_SCALE;
  const centerX = placement.x + placement.w / 2;
  const centerY = placement.y + placement.h / 2;
  const nextCenterX = FLOOR_PLAN_CENTER.x + (centerX - FLOOR_PLAN_CENTER.x) * TABLE_CLUSTER_SCALE_X;
  const nextCenterY = FLOOR_PLAN_CENTER.y + (centerY - FLOOR_PLAN_CENTER.y) * TABLE_CLUSTER_SCALE_Y;

  return {
    left: nextCenterX - scaledWidth / 2 + FLOOR_PLAN_OFFSET.x,
    top: nextCenterY - scaledHeight / 2 + FLOOR_PLAN_OFFSET.y,
    width: scaledWidth,
    height: scaledHeight,
    transform: placement.rotate ? `rotate(${placement.rotate}deg)` : undefined,
  };
}

function TableHit({
  table,
  placement,
  label,
  onSelect,
}: {
  table: TableConfig;
  placement: TablePlacement;
  label: string;
  onSelect: (t: TableConfig) => void;
}) {
  const tableNumber = table.id.replace('t', '');

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => onSelect(table)}
      className={`${HIT} origin-center`}
      style={getTableStyle(placement)}
    >
      <span className="absolute inset-0">
        <Chairs set={placement.chairs} />
        <TableBody kind={placement.kind} />
      </span>
      <span
        aria-hidden
        className={`absolute inset-0 z-10 flex items-center justify-center font-sans text-[22px] font-bold leading-3 ${TABLE_TEXT}`}
      >
        {tableNumber}
      </span>
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
  const allTables = [...topTables, ...leftTables, ...centerTable, ...crTables, ...winTables, ...botTables];
  const tablesById = new Map(allTables.map((table) => [table.id, table]));

  return (
    <div className="relative h-[1720px] w-[1240px] shrink-0">
      {FIXTURES.map((fixture) => (
        <div
          key={fixture.label}
          className={`absolute flex items-center justify-center ${fixture.radius} ${TABLE_FILL}`}
          style={{
            left: fixture.x + FLOOR_PLAN_OFFSET.x,
            top: fixture.y + FLOOR_PLAN_OFFSET.y,
            width: fixture.w,
            height: fixture.h,
          }}
        >
          <span className={`font-sans text-[22px] font-bold leading-3 ${TABLE_TEXT}`}>{fixture.label}</span>
        </div>
      ))}

      {TABLE_PLACEMENTS.map((placement) => {
        const table = tablesById.get(placement.id);
        if (!table) {
          return null;
        }
        return (
          <TableHit
            key={placement.id}
            table={table}
            placement={placement}
            label={t(`desktops.tables.${table.labelKey}`)}
            onSelect={onSelectTable}
          />
        );
      })}
    </div>
  );
}
