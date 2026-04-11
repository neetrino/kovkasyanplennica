/**
 * Resolves where to send the user after login.
 * Admins default to /admin; explicit /admin/* redirects are preserved.
 */
export function resolvePostLoginDestination(redirectPath: string, isAdmin: boolean): string {
  if (!isAdmin) return redirectPath;
  if (redirectPath.startsWith('/admin')) return redirectPath;
  return '/admin';
}
