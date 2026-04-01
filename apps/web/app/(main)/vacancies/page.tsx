import Image from 'next/image';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getStoredLanguage } from '@/lib/language';
import { t } from '@/lib/i18n';

const VACANCIES_REVALIDATE_SECONDS = 60;

export const revalidate = VACANCIES_REVALIDATE_SECONDS;

const FALLBACK_VACANCY_IMAGE =
  'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1200';

/** Bottom anchor union decorative */
const UNION_DECORATIVE_BOX_BOTTOM =
  'w-[300px] sm:w-[380px] md:w-[460px] lg:w-[520px] xl:w-[580px] aspect-square max-h-[580px]';

async function getVacanciesRequestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (host) {
    const proto = h.get('x-forwarded-proto') ?? 'http';
    return `${proto}://${host}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

interface VacancyDto {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  salary: string | null;
  location: string | null;
  contactPhone?: string | null;
}

async function fetchVacancies(): Promise<VacancyDto[]> {
  try {
    const origin = await getVacanciesRequestOrigin();
    const res = await fetch(`${origin}/api/v1/vacancies`, {
      next: {
        revalidate: VACANCIES_REVALIDATE_SECONDS,
        tags: ['vacancies-list'],
      },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: VacancyDto[] };
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = getStoredLanguage();
  return {
    title: t(lang, 'vacancies.meta.title'),
  };
}

/**
 * Public vacancies page — same visual language as products/about (#2F3F3D, union decorative, #fff4de headings).
 */
export default async function VacanciesPage() {
  const lang = getStoredLanguage();
  const vacancies = await fetchVacancies();
  const hasVacancies = vacancies.length > 0;

  return (
    <div className="w-full max-w-full bg-[#2F3F3D] relative min-h-[60vh]">
      {/* Top corner ornaments */}
      <div
        className="pointer-events-none absolute top-10 left-0 z-[2] w-[min(160px,36vw)] sm:w-[180px] md:w-[240px] select-none"
        aria-hidden
      >
        <img src="/hero-vector-2.svg" alt="" className="w-full h-auto object-contain object-left-top" />
      </div>
      <div
        className="pointer-events-none absolute top-10 right-0 z-[2] w-[min(160px,36vw)] sm:w-[180px] md:w-[240px] select-none"
        aria-hidden
      >
        <img
          src="/hero-vector-2.svg"
          alt=""
          className="w-full h-auto object-contain object-right-top scale-x-[-1]"
        />
      </div>

      {hasVacancies ? (
        <>
          {/* Bottom decorative — anchors the section */}
          <div
            className={`pointer-events-none absolute -bottom-20 left-1/2 z-[1] -translate-x-1/2 opacity-90 sm:-bottom-28 md:-bottom-72 ${UNION_DECORATIVE_BOX_BOTTOM}`}
            aria-hidden
          >
            <img src="/assets/hero/union-decorative.png" alt="" className="h-full w-full object-contain" />
          </div>
        </>
      ) : null}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[80px] sm:pt-[110px] pb-16 relative z-10">
        <header className="text-center mb-12 md:mb-16">
          <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.25em] text-[#7CB342] mb-3">
            {t(lang, 'vacancies.hero.eyebrow')}
          </p>
          <h1
            className="text-[#fff4de] text-4xl sm:text-5xl md:text-6xl font-light leading-tight"
            style={{ fontFamily: "'Sansation Light', sans-serif" }}
          >
            {t(lang, 'vacancies.hero.title')}
          </h1>
        </header>

        {vacancies.length === 0 ? (
          <p className="text-center text-[#fff4de]/80 text-lg max-w-xl mx-auto">{t(lang, 'vacancies.empty')}</p>
        ) : (
          <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 xl:gap-10">
            {vacancies.map((v) => {
              const img = v.imageUrl?.trim() || FALLBACK_VACANCY_IMAGE;
              return (
                <li
                  key={v.id}
                  className="rounded-2xl overflow-hidden border border-[#3d504e] bg-[#2a3836]/80 backdrop-blur-sm shadow-lg flex flex-col"
                >
                  <div className="relative aspect-[16/10] w-full bg-[#1a2221]">
                    <Image
                      src={img}
                      alt={`${t(lang, 'vacancies.imageAlt')}: ${v.title}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      unoptimized={img.startsWith('http')}
                    />
                  </div>
                  <div className="p-6 sm:p-8 flex flex-col flex-1">
                    <h2
                      className="text-2xl sm:text-3xl font-light text-[#fff4de] mb-4"
                      style={{ fontFamily: "'Sansation Light', sans-serif" }}
                    >
                      {v.title}
                    </h2>
                    {(v.salary || v.location || v.contactPhone) && (
                      <div className="flex flex-wrap gap-3 text-sm text-[#fff4de]/85 mb-4">
                        {v.salary ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3d504e]/80 px-3 py-1">
                            <span className="text-[#7CB342]">{t(lang, 'vacancies.salary')}:</span> {v.salary}
                          </span>
                        ) : null}
                        {v.location ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3d504e]/80 px-3 py-1">
                            <span className="text-[#7CB342]">{t(lang, 'vacancies.location')}:</span> {v.location}
                          </span>
                        ) : null}
                        {v.contactPhone?.trim() ? (
                          <a
                            href={`tel:${v.contactPhone.trim().replace(/\s/g, '')}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#7CB342]/60 bg-[#3d504e]/80 px-3 py-1 text-[#fff4de] underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-[#7CB342]/50"
                          >
                            <span className="text-[#7CB342]">{t(lang, 'vacancies.contactPhone')}:</span>
                            {v.contactPhone.trim()}
                          </a>
                        ) : null}
                      </div>
                    )}
                    <p className="text-[#fff4de]/90 text-sm sm:text-base leading-relaxed whitespace-pre-wrap flex-1">
                      {v.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
