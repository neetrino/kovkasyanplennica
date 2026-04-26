import { canAccessAdminPath, resolveAdminDefaultPath } from "@/lib/auth/roles";

/**
 * Resolves where to send the user after login.
 * Admin users keep explicit /admin/* redirects.
 * Hostess users can only land under allowed admin sections.
 */
export function resolvePostLoginDestination(redirectPath: string, roles: string[] = []): string {
  if (!redirectPath.startsWith("/admin")) {
    return resolveAdminDefaultPath(roles) === "/" ? redirectPath : resolveAdminDefaultPath(roles);
  }
  if (canAccessAdminPath(roles, redirectPath)) {
    return redirectPath;
  }
  return resolveAdminDefaultPath(roles);
}
