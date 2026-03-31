/**
 * Admin sidebar / mobile drawer: dark (default) or light nav chrome.
 */
export type AdminNavThemeMode = 'dark' | 'light';

const DARK_CONTAINER = 'bg-black border border-zinc-800 rounded-lg p-2 space-y-1 shadow-sm';
const LIGHT_CONTAINER = 'bg-white border border-gray-200 rounded-lg p-2 space-y-1 shadow-sm';

const DARK_ACTIVE = 'bg-zinc-900 text-white border border-white/20 shadow-sm';
const DARK_INACTIVE = 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200';

const LIGHT_ACTIVE = 'bg-gray-900 text-white shadow-sm';
const LIGHT_INACTIVE = 'text-gray-700 hover:bg-gray-100 hover:text-gray-900';

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
    return `flex-shrink-0 ${isActive ? 'text-white' : 'text-zinc-500'}`;
  }
  return `flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`;
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
    return `w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500'}`;
  }
  return `w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`;
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
        'inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-black px-4 py-2 text-sm font-semibold uppercase tracking-wide text-zinc-300 shadow-sm',
      panel: 'h-full min-h-screen w-1/2 min-w-[16rem] max-w-full bg-black flex flex-col shadow-2xl',
      headerRow: 'flex items-center justify-between border-b border-zinc-800 px-5 py-4',
      headerTitle: 'text-lg font-semibold text-zinc-300',
      closeButton:
        'h-10 w-10 rounded-full border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-900 hover:text-zinc-200',
      listDivide: 'flex-1 overflow-y-auto divide-y divide-zinc-900',
    };
  }
  return {
    menuTrigger:
      'inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-wide text-gray-800 shadow-sm',
    panel: 'h-full min-h-screen w-1/2 min-w-[16rem] max-w-full bg-white flex flex-col shadow-2xl',
    headerRow: 'flex items-center justify-between border-b border-gray-200 px-5 py-4',
    headerTitle: 'text-lg font-semibold text-gray-900',
    closeButton:
      'h-10 w-10 rounded-full border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900',
    listDivide: 'flex-1 overflow-y-auto divide-y divide-gray-100',
  };
}
