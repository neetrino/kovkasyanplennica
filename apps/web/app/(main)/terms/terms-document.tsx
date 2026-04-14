'use client';

import { Card } from '@shop/ui';
import Link from 'next/link';

type Translate = (path: string) => string;

type SectionProps = {
  t: Translate;
};

type TermsDocumentProps = SectionProps & {
  title: string;
};

function TermsSection1({ t }: SectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-gray-900">{t('terms.s1.title')}</h2>
      <p className="text-gray-600">{t('terms.s1.p1')}</p>
      <p className="text-gray-600">{t('terms.s1.p2')}</p>
      <p className="text-gray-600">{t('terms.s1.p3')}</p>
      <p className="text-gray-600">{t('terms.s1.p4')}</p>
      <p className="text-gray-600">{t('terms.s1.p5')}</p>
    </section>
  );
}

function TermsSection2({ t }: SectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-gray-900">{t('terms.s2.title')}</h2>
      <p className="text-gray-600">{t('terms.s2.intro')}</p>
      <ul className="ml-4 list-inside list-disc space-y-1 text-gray-600">
        <li>{t('terms.s2.site')}</li>
        <li>{t('terms.s2.user')}</li>
        <li>{t('terms.s2.services')}</li>
        <li>{t('terms.s2.content')}</li>
        <li>{t('terms.s2.intellectualProperty')}</li>
        <li>{t('terms.s2.transaction')}</li>
      </ul>
    </section>
  );
}

function TermsSection3({ t }: SectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-gray-900">{t('terms.s3.title')}</h2>
      <p className="text-gray-600">{t('terms.s3.lead')}</p>
      <ul className="ml-4 list-inside list-disc space-y-1 text-gray-600">
        <li>{t('terms.s3.oblLegal')}</li>
        <li>{t('terms.s3.oblSecurity')}</li>
        <li>{t('terms.s3.oblMalware')}</li>
        <li>{t('terms.s3.oblContent')}</li>
      </ul>
      <p className="text-gray-600">{t('terms.s3.p2')}</p>
    </section>
  );
}

function TermsSection4({ t }: SectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-gray-900">{t('terms.s4.title')}</h2>
      <p className="text-gray-600">{t('terms.s4.p1')}</p>
      <p className="text-gray-600">{t('terms.s4.lead')}</p>
      <ul className="ml-4 list-inside list-disc space-y-1 text-gray-600">
        <li>{t('terms.s4.itemTech')}</li>
        <li>{t('terms.s4.itemInfo')}</li>
        <li>{t('terms.s4.itemIndirect')}</li>
      </ul>
    </section>
  );
}

function TermsSection5({ t }: SectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-gray-900">{t('terms.s5.title')}</h2>
      <p className="text-gray-600">{t('terms.s5.p1')}</p>
      <p className="text-gray-600">{t('terms.s5.p2')}</p>
      <p className="text-gray-600">{t('terms.s5.p3')}</p>
    </section>
  );
}

function TermsSection6({ t }: SectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-gray-900">{t('terms.s6.title')}</h2>
      <p className="text-gray-600">{t('terms.s6.p1')}</p>
      <p className="text-gray-600">{t('terms.s6.p2')}</p>
      <p className="text-gray-600">{t('terms.s6.p3')}</p>
    </section>
  );
}

function TermsSection7({ t }: SectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-gray-900">{t('terms.s7.title')}</h2>
      <p className="text-gray-600">{t('terms.s7.p1')}</p>
      <p className="text-gray-600">{t('terms.s7.p2')}</p>
      <p className="text-gray-600">{t('terms.s7.p3')}</p>
    </section>
  );
}

function TermsSection8({ t }: SectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-gray-900">{t('terms.s8.title')}</h2>
      <p className="text-gray-600">{t('terms.s8.lead')}</p>
      <ul className="ml-4 list-inside list-disc space-y-1 text-gray-600">
        <li>{t('terms.s8.itemNature')}</li>
        <li>{t('terms.s8.itemState')}</li>
        <li>{t('terms.s8.itemConflict')}</li>
        <li>{t('terms.s8.itemTech')}</li>
      </ul>
    </section>
  );
}

function TermsSection9({ t }: SectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-gray-900">{t('terms.s9.title')}</h2>
      <p className="text-gray-600">
        {t('terms.s9.p1Before')}{' '}
        <Link href="/privacy" className="text-blue-600 hover:underline">
          {t('terms.s9.p1Link')}
        </Link>
        {t('terms.s9.p1After')}
      </p>
      <p className="text-gray-600">{t('terms.s9.p2')}</p>
      <p className="text-gray-600">{t('terms.s9.p3')}</p>
    </section>
  );
}

/**
 * Full terms of use document body (sections 1–9).
 */
export function TermsDocument({ t, title }: TermsDocumentProps) {
  return (
    <Card className="policy-glass-card space-y-6 p-6">
      <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
      <TermsSection1 t={t} />
      <TermsSection2 t={t} />
      <TermsSection3 t={t} />
      <TermsSection4 t={t} />
      <TermsSection5 t={t} />
      <TermsSection6 t={t} />
      <TermsSection7 t={t} />
      <TermsSection8 t={t} />
      <TermsSection9 t={t} />
    </Card>
  );
}
