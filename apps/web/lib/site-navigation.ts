export type SiteNavItemId =
  | 'home'
  | 'products'
  | 'about'
  | 'vacancies'
  | 'team'
  | 'contact'
  | 'menuPage';

type SiteNavItem = {
  id: SiteNavItemId;
  href: string;
  labelKey: string;
  /** Set to `true` to show the link in header, footer, and mobile nav. */
  visible: boolean;
  showInMobileDrawer?: boolean;
};

/** Toggle `visible` to restore hidden nav links site-wide. */
export const HEADER_NAV_ITEMS: readonly SiteNavItem[] = [
  { id: 'home', href: '/', labelKey: 'home.header.navigation.home', visible: true },
  {
    id: 'products',
    href: '/products',
    labelKey: 'home.header.navigation.menu',
    visible: true,
    showInMobileDrawer: true,
  },
  {
    id: 'about',
    href: '/about',
    labelKey: 'home.header.navigation.about',
    visible: true,
    showInMobileDrawer: true,
  },
  {
    id: 'vacancies',
    href: '/coming-soon',
    labelKey: 'home.header.navigation.vacancies',
    visible: false,
  },
  {
    id: 'team',
    href: '/coming-soon',
    labelKey: 'home.header.navigation.team',
    visible: false,
  },
  {
    id: 'contact',
    href: '/contact',
    labelKey: 'home.header.navigation.contact',
    visible: true,
  },
  {
    id: 'menuPage',
    href: '/coming-soon',
    labelKey: 'home.header.navigation.menu',
    visible: false,
  },
] as const;

export const FOOTER_NAV_ITEMS: readonly SiteNavItem[] = [
  {
    id: 'products',
    href: '/products',
    labelKey: 'home.footer.navigation.menu',
    visible: true,
  },
  {
    id: 'about',
    href: '/about',
    labelKey: 'home.footer.navigation.about',
    visible: true,
  },
  {
    id: 'vacancies',
    href: '/vacancies',
    labelKey: 'home.footer.navigation.vacancies',
    visible: false,
  },
  {
    id: 'team',
    href: '/coming-soon',
    labelKey: 'home.footer.navigation.team',
    visible: false,
  },
  {
    id: 'contact',
    href: '/contact',
    labelKey: 'home.footer.navigation.contacts',
    visible: true,
  },
  {
    id: 'menuPage',
    href: '/coming-soon',
    labelKey: 'home.footer.navigation.menu',
    visible: false,
  },
] as const;

export function getVisibleNavItems<T extends { visible: boolean }>(
  items: readonly T[],
): T[] {
  return items.filter((item) => item.visible);
}

export function getMobileDrawerNavItems(
  items: readonly SiteNavItem[],
): SiteNavItem[] {
  return items.filter((item) => item.visible && item.showInMobileDrawer);
}
