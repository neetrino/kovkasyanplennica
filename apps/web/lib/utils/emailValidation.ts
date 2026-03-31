/**
 * Basic email format check for login and forms (not full RFC 5322).
 */
const LOGIN_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidLoginEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && LOGIN_EMAIL_PATTERN.test(trimmed);
}
