'use client';

import type { TableConfig } from './table-data';
import type { TableVisualVariant } from './tableLayout';

const TABLE_FILL = '#f7ddaf';
const TABLE_TEXT = '#4b564f';

interface TableIllustrationProps {
  table: TableConfig;
  variant: TableVisualVariant;
}

interface CapacityTextProps {
  lines: string[];
  x: number;
  y: number;
  noteSize?: number;
}

function CapacityText({ lines, x, y, noteSize = 11 }: CapacityTextProps) {
  return (
    <text
      x={x}
      y={y}
      fill={TABLE_TEXT}
      fontFamily="Inter, sans-serif"
      fontSize="14"
      fontWeight="700"
      textAnchor="middle"
    >
      {lines.map((line, index) => (
        <tspan
          key={`${line}-${index}`}
          x={x}
          dy={index === 0 ? 0 : index === lines.length - 1 && lines.length > 2 ? 16 : 14}
          fontSize={index === lines.length - 1 && lines.length > 2 ? noteSize : 14}
          opacity={index === lines.length - 1 && lines.length > 2 ? 0.65 : 1}
        >
          {line}
        </tspan>
      ))}
    </text>
  );
}

function getCapacityLines(table: TableConfig, variant: TableVisualVariant): string[] {
  if (variant === 'vipOval') return ['7-8', 'հոգի'];
  if (variant === 'windowFour') return ['3-4', 'հոգի', '( պատուհանի մոտ )'];
  if (variant === 'topTwo' || variant === 'sideTwo') return ['2', 'հոգի'];
  return ['3-4', 'հոգի'];
}

/** Pixel-aligned SVG illustrations adapted from the Figma table silhouettes. */
export function TableIllustration({ table, variant }: TableIllustrationProps) {
  const lines = getCapacityLines(table, variant);

  if (variant === 'topTwo') {
    return (
      <svg aria-hidden className="h-[132px] w-[121px]" viewBox="0 0 121 132">
        <rect x="14" y="0" width="93" height="61" rx="3" fill={TABLE_FILL} />
        <circle cx="39" cy="112" r="16" fill={TABLE_FILL} />
        <circle cx="82" cy="112" r="16" fill={TABLE_FILL} />
        <CapacityText lines={lines} x={60.5} y={28} />
      </svg>
    );
  }

  if (variant === 'topThree') {
    return (
      <svg aria-hidden className="h-[132px] w-[180px]" viewBox="0 0 180 132">
        <rect x="29" y="0" width="122" height="61" rx="3" fill={TABLE_FILL} />
        <circle cx="52" cy="111" r="17" fill={TABLE_FILL} />
        <circle cx="90" cy="111" r="17" fill={TABLE_FILL} />
        <circle cx="128" cy="111" r="17" fill={TABLE_FILL} />
        <CapacityText lines={['3', 'հոգի']} x={90} y={28} />
      </svg>
    );
  }

  if (variant === 'sideTwo') {
    return (
      <svg aria-hidden className="h-[83px] w-[182px]" viewBox="0 0 182 83">
        <circle cx="91" cy="41.5" r="31" fill={TABLE_FILL} />
        <circle cx="18" cy="41.5" r="17" fill={TABLE_FILL} />
        <circle cx="164" cy="41.5" r="17" fill={TABLE_FILL} />
        <CapacityText lines={lines} x={91} y={38} />
      </svg>
    );
  }

  if (variant === 'windowFour') {
    return (
      <svg aria-hidden className="h-[182px] w-[120px]" viewBox="0 0 120 182">
        <rect x="24" y="48" width="72" height="86" rx="3" fill={TABLE_FILL} />
        <circle cx="34" cy="18" r="17" fill={TABLE_FILL} />
        <circle cx="86" cy="18" r="17" fill={TABLE_FILL} />
        <circle cx="34" cy="164" r="17" fill={TABLE_FILL} />
        <circle cx="86" cy="164" r="17" fill={TABLE_FILL} />
        <CapacityText lines={lines} x={60} y={81} noteSize={10} />
      </svg>
    );
  }

  if (variant === 'vipOval') {
    const seats = [
      [56, 22], [152, 22], [26, 76], [182, 76], [14, 140],
      [194, 140], [26, 204], [182, 204], [56, 292], [152, 292],
    ];

    return (
      <svg aria-hidden className="h-[315px] w-[208px]" viewBox="0 0 208 315">
        <ellipse cx="104" cy="157.5" rx="43" ry="119" fill={TABLE_FILL} />
        {seats.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="18" fill={TABLE_FILL} />
        ))}
        <CapacityText lines={lines} x={104} y={154} />
      </svg>
    );
  }

  if (variant === 'booth') {
    return (
      <svg aria-hidden className="h-[241px] w-[247px]" viewBox="0 0 247 241">
        <path
          d="M79 20C42 45 21 84 21 130C21 171 35 206 59 240L87 204C72 188 65 162 65 131C65 100 74 75 89 57L79 20Z"
          fill={TABLE_FILL}
        />
        <path
          d="M168 20L158 57C173 75 182 100 182 131C182 162 175 188 160 204L188 240C212 206 226 171 226 130C226 84 205 45 168 20Z"
          fill={TABLE_FILL}
        />
        <circle cx="123.5" cy="132" r="28" fill={TABLE_FILL} />
      </svg>
    );
  }

  return (
    <svg aria-hidden className="h-[120px] w-[182px]" viewBox="0 0 182 120">
      <rect x="51" y="14" width="80" height="92" rx="3" fill={TABLE_FILL} />
      <circle cx="18" cy="33" r="17" fill={TABLE_FILL} />
      <circle cx="18" cy="60" r="17" fill={TABLE_FILL} />
      <circle cx="18" cy="87" r="17" fill={TABLE_FILL} />
      <circle cx="164" cy="33" r="17" fill={TABLE_FILL} />
      <circle cx="164" cy="60" r="17" fill={TABLE_FILL} />
      <circle cx="164" cy="87" r="17" fill={TABLE_FILL} />
      <CapacityText lines={lines} x={91} y={57} />
    </svg>
  );
}
