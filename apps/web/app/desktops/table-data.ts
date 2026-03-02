export interface TableConfig {
  id: string;
  label: string;
  seats: number;
  shape: 'rect' | 'oval';
  zone: string;
  byWindow?: boolean;
}

export const TABLES: TableConfig[] = [
  // ---- Top row ----
  { id: 't1', label: 'Սեղան 1', seats: 2, shape: 'rect', zone: 'top' },
  { id: 't2', label: 'Սեղան 2', seats: 3, shape: 'rect', zone: 'top' },
  { id: 't3', label: 'Սեղան 3', seats: 3, shape: 'rect', zone: 'top' },
  { id: 't4', label: 'Սեղան 4', seats: 2, shape: 'rect', zone: 'top' },

  // ---- Left small tables ----
  { id: 't5', label: 'Սեղան 5', seats: 2, shape: 'rect', zone: 'left' },
  { id: 't6', label: 'Սեղան 6', seats: 2, shape: 'rect', zone: 'left' },
  { id: 't7', label: 'Սեղան 7', seats: 4, shape: 'rect', zone: 'left' },
  { id: 't8', label: 'Սեղան 8', seats: 4, shape: 'rect', zone: 'left' },

  // ---- Center VIP oval ----
  { id: 't9', label: 'VIP Սեղան', seats: 8, shape: 'oval', zone: 'center' },

  // ---- Center-right cluster ----
  { id: 't10', label: 'Սեղան 10', seats: 4, shape: 'rect', zone: 'center-right' },
  { id: 't11', label: 'Սեղան 11', seats: 4, shape: 'rect', zone: 'center-right' },
  { id: 't12', label: 'Սեղան 12', seats: 4, shape: 'rect', zone: 'center-right' },
  { id: 't13', label: 'Սեղան 13', seats: 4, shape: 'rect', zone: 'center-right' },

  // ---- Right window tables ----
  { id: 't14', label: 'Սեղան 14', seats: 4, shape: 'rect', zone: 'window', byWindow: true },
  { id: 't15', label: 'Սեղան 15', seats: 4, shape: 'rect', zone: 'window', byWindow: true },
  { id: 't16', label: 'Սեղան 16', seats: 4, shape: 'rect', zone: 'window', byWindow: true },

  // ---- Bottom row ----
  { id: 't17', label: 'Սեղան 17', seats: 4, shape: 'rect', zone: 'bottom' },
  { id: 't18', label: 'Սեղան 18', seats: 4, shape: 'rect', zone: 'bottom' },
  { id: 't19', label: 'Սեղան 19', seats: 4, shape: 'rect', zone: 'bottom' },
];
