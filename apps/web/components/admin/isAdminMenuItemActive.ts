/**
 * Sidebar active state. Root "/" must not use startsWith("/") — that would match every route.
 */
export function isAdminMenuItemActive(tabPath: string, currentPath: string): boolean {
  if (tabPath === '/') {
    return currentPath === '/' || currentPath === '';
  }
  if (currentPath === tabPath) {
    return true;
  }
  if (tabPath === '/admin') {
    return currentPath === '/admin';
  }
  return currentPath.startsWith(`${tabPath}/`);
}
