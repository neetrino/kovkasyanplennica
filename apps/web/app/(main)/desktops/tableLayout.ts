import type { TableConfig } from './table-data';

export type TableVisualVariant =
  | 'topTwo'
  | 'topThree'
  | 'sideTwo'
  | 'fourSeat'
  | 'windowFour'
  | 'vipOval'
  | 'booth';

export interface TableLayoutConfig {
  positionClass: string;
  variant: TableVisualVariant;
}

export const FLOOR_PLAN_CANVAS_CLASS = 'relative h-[1124px] w-[1282px]';

export const TABLE_LAYOUT: Record<string, TableLayoutConfig> = {
  t1: { positionClass: 'left-[356px] top-[38px]', variant: 'topTwo' },
  t2: { positionClass: 'left-[503px] top-[39px]', variant: 'topThree' },
  t3: { positionClass: 'left-[738px] top-[39px]', variant: 'topThree' },
  t4: { positionClass: 'left-[914px] top-[38px]', variant: 'topTwo' },
  t5: { positionClass: 'left-0 top-[290px]', variant: 'sideTwo' },
  t6: { positionClass: 'left-[170px] top-[290px]', variant: 'sideTwo' },
  t7: { positionClass: 'left-0 top-[435px]', variant: 'fourSeat' },
  t8: { positionClass: 'left-[170px] top-[435px]', variant: 'fourSeat' },
  t9: { positionClass: 'left-[429px] top-[297px]', variant: 'vipOval' },
  t10: { positionClass: 'left-[544px] top-[308px]', variant: 'fourSeat' },
  t11: { positionClass: 'left-[708px] top-[308px]', variant: 'fourSeat' },
  t12: { positionClass: 'left-[544px] top-[505px]', variant: 'fourSeat' },
  t13: { positionClass: 'left-[708px] top-[505px]', variant: 'fourSeat' },
  t14: { positionClass: 'left-[1162px] top-[221px]', variant: 'windowFour' },
  t15: { positionClass: 'left-[1162px] top-[436px]', variant: 'windowFour' },
  t16: { positionClass: 'left-[1162px] top-[651px]', variant: 'windowFour' },
  t17: { positionClass: 'left-[360px] top-[882px]', variant: 'booth' },
  t18: { positionClass: 'left-[582px] top-[882px]', variant: 'booth' },
  t19: { positionClass: 'left-[804px] top-[882px]', variant: 'booth' },
};

export function getTableLayout(tableId: TableConfig['id']): TableLayoutConfig {
  return TABLE_LAYOUT[tableId] ?? { positionClass: 'left-0 top-0', variant: 'fourSeat' };
}
