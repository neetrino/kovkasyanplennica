'use client';

import { useId } from 'react';
import { useTranslation } from '@/lib/i18n-client';
import { useAdminNavTheme } from '@/components/admin/AdminNavThemeContext';

/** Լամպի glow, երբ մուգ մենյուն միացված է (Tailwind arbitrary shadow). */
const LAMP_ON_SHADOW =
  'shadow-[0_0_16px_rgba(251,191,36,0.45)] shadow-amber-400/30';

/** SVG չափ (px)՝ շրջանի մեջ օպտիկական կենտրոնի համար։ */
const LAMP_ICON_PX = 22;

/**
 * Մենյուի թեմա՝ լամպիկ-կոճակ (սեղմելիս փոխվում է). role="switch" մնում է a11y-ի համար.
 */
export function AdminNavThemeToggle() {
  const labelId = useId();
  const { t } = useTranslation();
  const { isDark, setDark } = useAdminNavTheme();
  const label = t('admin.common.darkNavMenu');

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600" id={labelId}>
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-labelledby={labelId}
        onClick={() => setDark(!isDark)}
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-visible rounded-full border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 active:scale-95 ${
          isDark
            ? `border-amber-400/70 bg-zinc-900 ${LAMP_ON_SHADOW}`
            : 'border-gray-300 bg-gray-100 shadow-inner'
        }`}
      >
        {/* block + translate: inline-SVG baseline-ը չշեղի կենտրոնից; վառվածի ժամանակ՝ օպտիկական կենտրոն։ */}
        <span className="pointer-events-none inline-flex items-center justify-center leading-none">
          <svg
            width={LAMP_ICON_PX}
            height={LAMP_ICON_PX}
            className={`block shrink-0 transition-colors duration-200 ${
              isDark ? 'translate-y-px text-amber-300' : 'text-gray-400'
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
            <path d="M9 18h6" />
            <path d="M10 22h4" />
          </svg>
        </span>
      </button>
    </div>
  );
}
