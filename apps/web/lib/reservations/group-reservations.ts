export interface TableReservationRow {
  id: string;
  bookingGroupId: string | null;
  tableId: string;
  tableLabel: string;
  tableSeats: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  timeEnd: string;
  occasion: 'birthday' | 'regular';
  guestCount: number;
  note: string | null;
  status: string;
  profitCents: number | null;
  productTitle: string | null;
  productImageUrl: string | null;
  createdAt: string;
}

export interface ReservationGroup {
  key: string;
  reservations: TableReservationRow[];
  ids: string[];
}

export function reservationGroupKey(row: TableReservationRow): string {
  if (row.bookingGroupId) {
    return `gid:${row.bookingGroupId}`;
  }

  const createdBucket = Math.floor(new Date(row.createdAt).getTime() / 60_000);
  return [
    'legacy',
    row.email.trim().toLowerCase(),
    row.phone.trim(),
    row.firstName.trim(),
    row.lastName.trim(),
    row.date.trim(),
    row.time.trim(),
    row.timeEnd.trim(),
    row.occasion,
    String(row.guestCount),
    row.note ?? '',
    row.status,
    String(createdBucket),
  ].join('\u001f');
}

function sortTablesInGroup(rows: TableReservationRow[]): TableReservationRow[] {
  return [...rows].sort((a, b) => a.tableLabel.localeCompare(b.tableLabel, 'ru'));
}

export function groupReservations(rows: readonly TableReservationRow[]): ReservationGroup[] {
  const map = new Map<string, TableReservationRow[]>();

  for (const row of rows) {
    const key = reservationGroupKey(row);
    const list = map.get(key);
    if (list) {
      list.push(row);
    } else {
      map.set(key, [row]);
    }
  }

  return Array.from(map.entries()).map(([key, groupRows]) => {
    const reservations = sortTablesInGroup(groupRows);
    return {
      key,
      reservations,
      ids: reservations.map((r) => r.id),
    };
  });
}

export function groupRepresentative(group: ReservationGroup): TableReservationRow {
  return group.reservations[0];
}

export function groupProfitCents(group: ReservationGroup): number | null {
  let sum = 0;
  let hasValue = false;
  for (const row of group.reservations) {
    if (row.profitCents == null) continue;
    sum += row.profitCents;
    hasValue = true;
  }
  return hasValue ? sum : null;
}
