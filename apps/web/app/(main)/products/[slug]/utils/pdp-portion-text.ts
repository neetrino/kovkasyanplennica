import { getProductText } from '@/lib/i18n';
import type { LanguageCode } from '@/lib/language';
import type { Product } from '../types';

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function plainField(htmlOrText: string): string {
  return stripHtml(htmlOrText.trim())
    .replace(/\s+/g, ' ')
    .trim();
}

function plainFirstLine(htmlOrText: string): string {
  return plainField(htmlOrText).split(/\r?\n/)[0]?.trim() ?? '';
}

function stripEnUsThousandsInString(input: string): string {
  let s = input;
  let prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(/(?<=\d),(\d{3})(?=\D|$)/, '$1');
  }
  return s;
}

export function normalizePortionDisplayLine(raw: string): string {
  const trimmed = plainFirstLine(raw);
  if (!trimmed) return '';
  const deGrouped = stripEnUsThousandsInString(trimmed);
  const hasPortionWord = /^порция\b/i.test(deGrouped);
  if (hasPortionWord) {
    return deGrouped.replace(/^порция\b/i, 'порция');
  }
  const looksLikeAmountLeading = /^[\d(]/.test(deGrouped) && /\d/.test(deGrouped);
  if (looksLikeAmountLeading) {
    if (deGrouped.startsWith('(') && deGrouped.endsWith(')')) {
      return `порция ${deGrouped}`;
    }
    return `порция (${deGrouped})`;
  }
  return deGrouped;
}

function isStandalonePortionCandidate(s: string): boolean {
  const t = (s.trim().split(/\r?\n/)[0] ?? '').trim();
  if (!t || t.length > 40) return false;
  if (t.includes(',') && !/^\([\d\s,]+\)$/.test(t) && !/^[\d][\d\s,]*,\d{3}\b/.test(t)) {
    return false;
  }
  return /^(?:\([\d\s,]+\)|[\d][\d\s,]*)(?:\s*(?:г|Г|g|кг|Кг|кг\.|ккал|Ккал|ккал\.?|мл|Мл|ml|kcal|l|л))?\.?\s*$/iu.test(
    t,
  );
}

function tryLeadingPortionToken(plainDescription: string): { portion: string; rest: string } | null {
  const t = plainDescription.trim();
  if (!t) return null;
  const re = /^((?:\([\d\s,]+\)|[\d][\d\s,]*)(?:\s*(?:г|Г|g|кг|Кг|кг\.|ккал|Ккал|ккал\.?|мл|Мл|ml|kcal|l|л))?\.?)\s*/iu;
  const m = t.match(re);
  if (!m) return null;
  const portion = m[1].trim();
  if (!isStandalonePortionCandidate(portion)) return null;
  const rest = t.slice(m[0].length).trim();
  return { portion, rest };
}

function stripLeadingDuplicatePortion(body: string, portionSource: string): string {
  if (!portionSource.trim() || !body.trim()) return body;
  const lead = tryLeadingPortionToken(body.trim());
  if (!lead) return body;
  const n1 = stripEnUsThousandsInString(lead.portion.trim());
  const n2 = stripEnUsThousandsInString(portionSource.trim());
  if (n1 === n2) return lead.rest.trim();
  return body;
}

/** Remove first `<p>…</p>` when its plain text equals the portion token (avoids duplicate under gallery). */
function stripFirstHtmlParagraphIfPlainMatchesPortion(html: string, portionPlain: string): string {
  const p = portionPlain.trim();
  if (!p || !html.trim()) return html;
  const trimmed = html.trim();
  const m = trimmed.match(/^<p\b[^>]*>([\s\S]*?)<\/p>/i);
  if (!m) return html;
  const innerPlain = plainField(m[1]);
  if (stripEnUsThousandsInString(innerPlain) !== stripEnUsThousandsInString(p)) return html;
  return trimmed.replace(/^<p\b[^>]*>[\s\S]*?<\/p>\s*/i, '').trim();
}

export type PdpPortionBundle = {
  portionLine: string;
  ingredientsPlain: string;
  longDescriptionHtml: string;
};

export function resolvePdpPortionBundle(language: LanguageCode, product: Product): PdpPortionBundle {
  const subtitleSource =
    getProductText(language, product.id, 'subtitle').trim() ||
    (typeof product.subtitle === 'string' ? product.subtitle.trim() : '');
  const subtitlePlain = plainFirstLine(subtitleSource);

  const shortDescSource = getProductText(language, product.id, 'shortDescription').trim();
  const shortPlainBlock = plainField(shortDescSource);
  const shortDescLines = shortPlainBlock
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const firstShortLine = shortDescLines[0] ?? '';
  const portionFromShort =
    !subtitlePlain && isStandalonePortionCandidate(firstShortLine) ? firstShortLine : '';

  const longRaw = getProductText(language, product.id, 'longDescription') || product.description || '';
  const longPlainFull = plainField(longRaw);
  const longToken =
    !subtitlePlain && !portionFromShort ? tryLeadingPortionToken(longPlainFull) : null;
  const portionFromLong = longToken?.portion ?? '';

  const portionLineRaw = subtitlePlain || portionFromShort || portionFromLong;
  const portionLine = normalizePortionDisplayLine(portionLineRaw);

  const shortForIngredients = portionFromShort
    ? shortDescLines.slice(1).join(' ').trim()
    : shortPlainBlock;
  let longPlainForIngredients = longToken?.rest ?? longPlainFull;
  let ingredientsPlain =
    shortForIngredients ||
    (longPlainForIngredients
      ? longPlainForIngredients.length > 220
        ? `${longPlainForIngredients.slice(0, 220)}…`
        : longPlainForIngredients
      : '');

  if (portionLineRaw) {
    ingredientsPlain = stripLeadingDuplicatePortion(ingredientsPlain, portionLineRaw);
  }

  let longDescriptionHtml = longRaw.trim();
  if (portionLineRaw && longDescriptionHtml) {
    longDescriptionHtml = stripFirstHtmlParagraphIfPlainMatchesPortion(longDescriptionHtml, portionLineRaw);
  }

  return { portionLine, ingredientsPlain, longDescriptionHtml };
}
