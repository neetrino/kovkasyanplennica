import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        secondary: '#FFFFFF',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        /** Storefront / mobile chrome — admin panel uses the same family */
        admin: {
          brand: '#2f3f3d',
          'brand-2': '#3d504e',
          surface: '#f1f5f4',
          elevated: '#ffffff',
          /** Peach accent (highlights, active nav) */
          warm: '#ffe5c2',
          muted: '#b8c5c0',
          /** Cream / skin-tone text on green chrome */
          flesh: '#faf3eb',
          'flesh-muted': '#d4c4b0',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
        heading: ['system-ui', '-apple-system', 'sans-serif'],
        /** Sansation Light (300) + italic — Google Fonts, имя семейства «Sansation» */
        sansation: ['Sansation', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

