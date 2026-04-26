export const ADMIN_ROLE = "admin";
export const HOSTESS_ROLE = "hostess";

const HOSTESS_ALLOWED_ADMIN_PATH_PREFIXES = ["/admin/orders", "/admin/desktops", "/admin/dekstops"] as const;

export function hasRole(roles: string[] | undefined, role: string): boolean {
  return Array.isArray(roles) && roles.includes(role);
}

export function isAdminRole(roles: string[] | undefined): boolean {
  return hasRole(roles, ADMIN_ROLE);
}

export function isHostessRole(roles: string[] | undefined): boolean {
  return hasRole(roles, HOSTESS_ROLE);
}

export function canAccessAdminArea(roles: string[] | undefined): boolean {
  return isAdminRole(roles) || isHostessRole(roles);
}

export function canAccessAdminPath(roles: string[] | undefined, pathname: string): boolean {
  if (!pathname.startsWith("/admin")) {
    return true;
  }
  if (isAdminRole(roles)) {
    return true;
  }
  if (!isHostessRole(roles)) {
    return false;
  }
  return HOSTESS_ALLOWED_ADMIN_PATH_PREFIXES.some(
    (allowedPrefix) => pathname === allowedPrefix || pathname.startsWith(`${allowedPrefix}/`)
  );
}

export function resolveAdminDefaultPath(roles: string[] | undefined): string {
  if (isAdminRole(roles)) {
    return "/admin";
  }
  if (isHostessRole(roles)) {
    return "/admin/orders";
  }
  return "/";
}
