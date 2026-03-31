/**
 * Navigation label display: first letter of each word uppercase, rest lowercase.
 */
export function formatNavLabel(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return '';
  }

  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (word.length === 0) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
