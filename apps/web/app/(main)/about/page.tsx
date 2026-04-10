import Image from 'next/image';
import { t } from '@/lib/i18n';

export const revalidate = 3600;

/**
 * About Us page — styled to match the products page visual language:
 * dark #2F3F3D bg, union-decorative.png overlays, #fff4de headings, #7CB342 accent.
 */
export default function AboutPage() {
  const lang = 'ru' as const;

  return (
    <div className="w-full max-w-full bg-[#2F3F3D] relative">

      {/* ── Decorative overlays (same pattern as products page) ── */}
     
   
      <div
        className="absolute bottom-0  left-1/2 -translate-x-1/2 w-[320px] sm:w-[400px] md:w-[480px] lg:w-[560px] xl:w-[640px] aspect-square max-h-[640px] pointer-events-none z-0 opacity-50"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>

      {/* ══════════════════════════════════
          STORY — image + description
          ══════════════════════════════════ */}
      <section className="relative z-10 pt-4 sm:pt-6 md:pt-8 pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Image — left side */}
            <div className="relative w-full h-[380px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl group">
              <Image
                src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&dpr=1"
                alt="Our team"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                unoptimized
              />
              {/* subtle green accent frame */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-[#7CB342]/30 pointer-events-none" />
            </div>

            {/* Text — right side */}
            <div className="space-y-6">
              <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.25em] text-[#7CB342]">
                {t(lang, 'about.story.subtitle')}
              </p>
              <h1 className="text-[#fff4de] text-4xl md:text-5xl lg:text-6xl font-light italic leading-tight">
                {t(lang, 'about.story.title')}
              </h1>
              <div className="w-24 h-[2px] bg-[#7CB342]" />
              <div className="space-y-4 text-[#fff4de]/70 text-base md:text-lg leading-relaxed">
                {['paragraph1', 'paragraph2', 'paragraph3', 'paragraph4', 'paragraph5'].map((paragraphKey) => (
                  <p key={paragraphKey}>{t(lang, `about.description.${paragraphKey}`)}</p>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
