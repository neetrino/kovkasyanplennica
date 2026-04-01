import type { Metadata } from 'next';
import { getStoredLanguage } from '@/lib/language';
import { t } from '@/lib/i18n';
import { TeamPageClient } from './TeamPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const lang = getStoredLanguage();
  return {
    title: t(lang, 'team.meta.title'),
  };
}

export default function TeamPage() {
  return <TeamPageClient />;
}
