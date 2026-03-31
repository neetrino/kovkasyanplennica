export interface TableConfig {
  id: string;
  /** Key under `desktops.tables.*` in locales */
  labelKey: string;
  seats: number;
  shape: 'rect' | 'oval';
  zone: string;
  byWindow?: boolean;
}

export const TABLES: TableConfig[] = [
  { id: 't1', labelKey: 't1', seats: 2, shape: 'rect', zone: 'top' },
  { id: 't2', labelKey: 't2', seats: 3, shape: 'rect', zone: 'top' },
  { id: 't3', labelKey: 't3', seats: 3, shape: 'rect', zone: 'top' },
  { id: 't4', labelKey: 't4', seats: 2, shape: 'rect', zone: 'top' },

  { id: 't5', labelKey: 't5', seats: 2, shape: 'rect', zone: 'left' },
  { id: 't6', labelKey: 't6', seats: 2, shape: 'rect', zone: 'left' },
  { id: 't7', labelKey: 't7', seats: 4, shape: 'rect', zone: 'left' },
  { id: 't8', labelKey: 't8', seats: 4, shape: 'rect', zone: 'left' },

  { id: 't9', labelKey: 't9', seats: 8, shape: 'oval', zone: 'center' },

  { id: 't10', labelKey: 't10', seats: 4, shape: 'rect', zone: 'center-right' },
  { id: 't11', labelKey: 't11', seats: 4, shape: 'rect', zone: 'center-right' },
  { id: 't12', labelKey: 't12', seats: 4, shape: 'rect', zone: 'center-right' },
  { id: 't13', labelKey: 't13', seats: 4, shape: 'rect', zone: 'center-right' },

  { id: 't14', labelKey: 't14', seats: 4, shape: 'rect', zone: 'window', byWindow: true },
  { id: 't15', labelKey: 't15', seats: 4, shape: 'rect', zone: 'window', byWindow: true },
  { id: 't16', labelKey: 't16', seats: 4, shape: 'rect', zone: 'window', byWindow: true },

  { id: 't17', labelKey: 't17', seats: 4, shape: 'rect', zone: 'bottom' },
  { id: 't18', labelKey: 't18', seats: 4, shape: 'rect', zone: 'bottom' },
  { id: 't19', labelKey: 't19', seats: 4, shape: 'rect', zone: 'bottom' },
];
