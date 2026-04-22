/**
 * Desktop home gallery — paths under `public/`. Encoded hrefs match `encodeURI` for Cyrillic segments.
 */
export const HOME_CAROUSEL_RAW_PATHS = [
  '/assets/New folder/JW_06812 1.webp',
  '/assets/New folder/JW_06330 1.webp',
  '/assets/New folder/JW_01463-редакт 1.webp',
  '/assets/New folder/JW_01347 1.webp',
  '/assets/New folder/JW_01522 1.webp',
  '/assets/New folder/JW_05698 1.webp',
  '/assets/New folder/JW_01369-редакт 1.webp',
] as const;

export const HOME_CAROUSEL_IMAGE_HREFS: readonly string[] =
  HOME_CAROUSEL_RAW_PATHS.map((p) => encodeURI(p));
