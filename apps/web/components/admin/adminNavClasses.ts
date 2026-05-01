/**
 * Admin sidebar + mobile drawer chrome — matches storefront `admin.*` tokens (tailwind.config.ts).
 */
export type AdminNavThemeMode = 'dark' | 'light';

/** Desktop nav sits on `aside` with `bg-admin-brand`; container stays subtle on that rail. */
const DARK_CONTAINER =
  'bg-transparent border-0 rounded-none rounded-r-lg p-2 space-y-1 shadow-none';
const LIGHT_CONTAINER =
  'bg-transparent border-0 rounded-none rounded-r-lg p-2 space-y-1 shadow-none';

/** Active: peach accent; text = brand green for contrast on warm. */
const DARK_ACTIVE =
  'bg-admin-warm text-admin-brand border border-admin-warm/90 shadow-sm';
const DARK_INACTIVE =
  'text-admin-flesh-muted hover:bg-black/15 hover:text-admin-flesh';

const LIGHT_ACTIVE = 'bg-admin-warm text-admin-brand border border-admin-warm/90 shadow-sm';
const LIGHT_INACTIVE =
  'text-admin-flesh-muted hover:bg-admin-brand-2/85 hover:text-admin-flesh';

function getActiveInactive(mode: AdminNavThemeMode): { active: string; inactive: string } {
  return mode === 'dark'
    ? { active: DARK_ACTIVE, inactive: DARK_INACTIVE }
    : { active: LIGHT_ACTIVE, inactive: LIGHT_INACTIVE };
}

export function getAdminNavContainerClass(mode: AdminNavThemeMode): string {
  return mode === 'dark' ? DARK_CONTAINER : LIGHT_CONTAINER;
}

export function getAdminNavLinkButtonClasses(
  mode: AdminNavThemeMode,
  isActive: boolean,
  isSubCategory: boolean,
): string {
  const { active, inactive } = getActiveInactive(mode);
  const indent = isSubCategory ? 'pl-12' : '';
  return [
    'w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all',
    indent,
    isActive ? active : inactive,
  ]
    .filter(Boolean)
    .join(' ');
}

export function getAdminNavIconClass(mode: AdminNavThemeMode, isActive: boolean): string {
  if (mode === 'dark') {
    return `flex-shrink-0 ${isActive ? 'text-admin-brand' : 'text-admin-flesh-muted'}`;
  }
  return `flex-shrink-0 ${isActive ? 'text-admin-brand' : 'text-admin-flesh-muted'}`;
}

/** Chevron next to «Товары» — expand/collapse catalog sub-links (desktop sidebar). */
export function getAdminNavGroupToggleClasses(mode: AdminNavThemeMode): string {
  const base =
    'flex shrink-0 items-center justify-center rounded-md px-2 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-warm/50 focus-visible:ring-offset-2 focus-visible:ring-offset-admin-brand';
  if (mode === 'dark') {
    return `${base} text-admin-flesh-muted hover:bg-black/15 hover:text-admin-flesh`;
  }
  return `${base} text-admin-flesh-muted hover:bg-admin-brand-2/85 hover:text-admin-flesh`;
}

export function getAdminDrawerRowClasses(
  mode: AdminNavThemeMode,
  isActive: boolean,
  isSubCategory: boolean,
): string {
  const { active, inactive } = getActiveInactive(mode);
  const indent = isSubCategory ? 'pl-8' : '';
  return [
    'flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium',
    indent,
    isActive ? active : inactive,
  ]
    .filter(Boolean)
    .join(' ');
}

export function getAdminDrawerChevronClass(mode: AdminNavThemeMode, isActive: boolean): string {
  if (mode === 'dark') {
    return `w-4 h-4 ${isActive ? 'text-admin-brand' : 'text-admin-flesh-muted'}`;
  }
  return `w-4 h-4 ${isActive ? 'text-admin-brand' : 'text-admin-flesh-muted'}`;
}

export function getAdminDrawerChromeClasses(mode: AdminNavThemeMode): {
  menuTrigger: string;
  panel: string;
  headerRow: string;
  headerTitle: string;
  closeButton: string;
  listDivide: string;
} {
  if (mode === 'dark') {
    return {
      menuTrigger:
        'inline-flex items-center gap-2 rounded-full border border-admin-flesh/25 bg-admin-brand-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-admin-flesh shadow-sm',
      panel:
        'flex h-full min-h-screen w-1/2 min-w-[16rem] max-w-full flex-col bg-admin-brand-2 shadow-2xl',
      headerRow: 'flex items-center justify-between border-b border-admin-brand px-5 py-4',
      headerTitle: 'text-lg font-semibold text-admin-flesh',
      closeButton:
        'h-10 w-10 rounded-full border border-admin-flesh/25 text-admin-flesh-muted hover:border-admin-flesh/40 hover:bg-black/15 hover:text-admin-flesh',
      listDivide: 'flex-1 overflow-y-auto divide-y divide-admin-brand',
    };
  }
  return {
    menuTrigger:
      'inline-flex items-center gap-2 rounded-full border border-admin-flesh/25 bg-admin-brand px-4 py-2 text-sm font-semibold uppercase tracking-wide text-admin-flesh shadow-sm',
    panel:
      'flex h-full min-h-screen w-1/2 min-w-[16rem] max-w-full flex-col bg-admin-brand shadow-2xl',
    headerRow: 'flex items-center justify-between border-b border-admin-brand-2/60 px-5 py-4',
    headerTitle: 'text-lg font-semibold text-admin-flesh',
    closeButton:
      'h-10 w-10 rounded-full border border-admin-flesh/25 text-admin-flesh-muted hover:border-admin-flesh/40 hover:bg-admin-brand-2/80 hover:text-admin-flesh',
    listDivide: 'flex-1 overflow-y-auto divide-y divide-admin-brand-2/50',
  };
}
