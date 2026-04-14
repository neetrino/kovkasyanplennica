import type { Metadata } from 'next';

/** Shared SEO / Open Graph copy for the storefront — keep in sync across root layout and `/`. */
export const SITE_TITLE = 'Kovkasyan Plennica';

export const SITE_DESCRIPTION =
  'В «Кавказской пленнице» вы окунётесь в атмосферу любимого фильма, насладитесь вкусной кухней и прекрасно проведёте время с семьёй или друзьями.';

/** Default site-wide metadata fragment (requires `metadataBase` from the root layout). */
const FAVICON_PATH = '/assets/New%20folder/favicon.png';

export function getRootSiteMetadata(metadataBase: URL): Metadata {
  return {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    metadataBase,
    icons: {
      icon: [
        { url: FAVICON_PATH, type: 'image/png', sizes: '48x48' },
        { url: FAVICON_PATH, type: 'image/png', sizes: '96x96' },
      ],
      apple: [{ url: FAVICON_PATH, sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      type: 'website',
      locale: 'ru_RU',
      url: metadataBase,
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    },
  };
}

/** Home route: explicit defaults so link previews always use `SITE_DESCRIPTION` (inherits `metadataBase`). */
export const HOME_PAGE_METADATA: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: 'website',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};
