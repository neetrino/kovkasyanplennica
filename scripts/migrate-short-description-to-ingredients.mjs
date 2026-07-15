/**
 * Migrate ProductTranslation.descriptionHtml → ingredients (composition).
 *
 * Modes:
 *   node scripts/migrate-short-description-to-ingredients.mjs --backup
 *   node scripts/migrate-short-description-to-ingredients.mjs --dry-run
 *   node scripts/migrate-short-description-to-ingredients.mjs --apply   (requires confirmation; not used yet)
 *
 * Rules:
 * - Only fill ingredients when empty
 * - Never modify subtitle / descriptionHtml / longDescriptionHtml / title / slug
 * - Skip standalone portion-only first lines (e.g. "160г")
 * - Idempotent: safe to re-run after partial apply
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
dotenv.config({ path: join(root, '.env') });

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const AUDIT_DIR = join(root, 'audit', 'product-composition-migration');
const REQUIRED_TITLES = [
  'Мацун',
  'Мацун чесночный',
  'Картофель фри',
  'Хашлама',
  'Оссобуко',
  'Толма',
  'Хачапури по-аджарски',
];

/** Decode common HTML entities (named + numeric). */
function decodeHtmlEntities(input) {
  let s = String(input ?? '');
  s = s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&laquo;/gi, '«')
    .replace(/&raquo;/gi, '»')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&hellip;/gi, '…');
  s = s.replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
    try {
      return String.fromCodePoint(Number.parseInt(hex, 16));
    } catch {
      return _;
    }
  });
  s = s.replace(/&#(\d+);/g, (_, n) => {
    try {
      return String.fromCodePoint(Number.parseInt(n, 10));
    } catch {
      return _;
    }
  });
  return s;
}

/**
 * Strip HTML to plain lines.
 * <br>, <br/>, <br /> → newline; other tags removed; entities decoded.
 */
export function htmlToPlainLines(html) {
  let s = String(html ?? '');
  s = s.replace(/<br\s*\/?\s*>/gi, '\n');
  s = s.replace(/<\/p>/gi, '\n');
  s = s.replace(/<\/div>/gi, '\n');
  s = s.replace(/<\/li>/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  s = decodeHtmlEntities(s);
  return s
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0);
}

/**
 * True when the whole string is only a portion/serving amount.
 * Covers: 160г, 300 г, 100 мл, 200/40г, 0.5 л, (350г)
 */
export function isStandalonePortionCandidate(raw) {
  const t = String(raw ?? '')
    .trim()
    .split(/\r?\n/)[0]
    ?.trim();
  if (!t || t.length > 40) return false;
  // reject ingredient-looking lists
  if (t.includes(',') && !/^\([\d\s,./]+\)$/.test(t)) return false;
  return /^(?:\([\d\s,./]+\)|\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)?(?:\s*[-–—]\s*\d+(?:[.,]\d+)?)?)(?:\s*(?:г|Г|g|кг|Кг|кг\.|ккал|Ккал|ккал\.?|мл|Мл|ml|kcal|l|л))?\.?\s*$/u.test(
    t,
  );
}

function isIngredientsEmpty(value) {
  return value == null || String(value).trim() === '';
}

function isSubtitleFilled(value) {
  return value != null && String(value).trim() !== '';
}

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows, columns) {
  const header = columns.join(',');
  const body = rows
    .map((row) => columns.map((col) => csvEscape(row[col])).join(','))
    .join('\n');
  return `${header}\n${body}\n`;
}

async function createBackup() {
  mkdirSync(AUDIT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const translations = await prisma.productTranslation.findMany({
    orderBy: [{ locale: 'asc' }, { productId: 'asc' }],
    select: {
      id: true,
      productId: true,
      locale: true,
      title: true,
      subtitle: true,
      descriptionHtml: true,
      ingredients: true,
      longDescriptionHtml: true,
    },
  });

  const jsonPath = join(AUDIT_DIR, `product-translations-backup-${stamp}.json`);
  const csvPath = join(AUDIT_DIR, `product-translations-backup-${stamp}.csv`);

  writeFileSync(jsonPath, JSON.stringify(translations, null, 2), 'utf8');
  writeFileSync(
    csvPath,
    toCsv(translations, [
      'id',
      'productId',
      'locale',
      'title',
      'subtitle',
      'descriptionHtml',
      'ingredients',
      'longDescriptionHtml',
    ]),
    'utf8',
  );

  return { translations, jsonPath, csvPath, count: translations.length };
}

/**
 * @typedef {'MIGRATE' | 'SKIP'} Action
 * @typedef {{
 *   translationId: string,
 *   productId: string,
 *   locale: string,
 *   title: string,
 *   descriptionHtml: string,
 *   currentIngredients: string,
 *   proposedIngredients: string | null,
 *   subtitle: string,
 *   subtitleStatus: 'exists' | 'missing',
 *   action: Action,
 *   reason: string,
 * }} PlanRow
 */

/** @returns {PlanRow} */
function planOne(row) {
  const descriptionHtml = row.descriptionHtml ?? '';
  const currentIngredients = row.ingredients ?? '';
  const subtitle = row.subtitle ?? '';
  const subtitleStatus = isSubtitleFilled(subtitle) ? 'exists' : 'missing';

  const base = {
    translationId: row.id,
    productId: row.productId,
    locale: row.locale,
    title: row.title ?? '',
    descriptionHtml,
    currentIngredients,
    proposedIngredients: null,
    subtitle,
    subtitleStatus,
  };

  if (!isIngredientsEmpty(currentIngredients)) {
    return {
      ...base,
      action: 'SKIP',
      reason: 'ingredients already exists',
    };
  }

  if (!descriptionHtml.trim()) {
    return {
      ...base,
      action: 'SKIP',
      reason: 'empty description',
    };
  }

  const lines = htmlToPlainLines(descriptionHtml);
  if (lines.length === 0) {
    return {
      ...base,
      action: 'SKIP',
      reason: 'empty description',
    };
  }

  const firstLine = lines[0];
  if (isStandalonePortionCandidate(firstLine)) {
    return {
      ...base,
      proposedIngredients: null,
      action: 'SKIP',
      reason: 'standalone portion',
    };
  }

  return {
    ...base,
    proposedIngredients: firstLine,
    action: 'MIGRATE',
    reason: 'first line from descriptionHtml',
  };
}

async function buildPlan() {
  const rows = await prisma.productTranslation.findMany({
    where: { locale: 'ru' },
    orderBy: { title: 'asc' },
    select: {
      id: true,
      productId: true,
      locale: true,
      title: true,
      subtitle: true,
      descriptionHtml: true,
      ingredients: true,
      longDescriptionHtml: true,
    },
  });

  /** @type {PlanRow[]} */
  const plan = rows.map(planOne);
  return { rows, plan };
}

function summarize(plan) {
  const total = plan.length;
  const migrate = plan.filter((p) => p.action === 'MIGRATE');
  const skippedIngredientsExists = plan.filter(
    (p) => p.reason === 'ingredients already exists',
  );
  const skippedPortion = plan.filter((p) => p.reason === 'standalone portion');
  const skippedEmpty = plan.filter((p) => p.reason === 'empty description');
  const subtitleExists = plan.filter((p) => p.subtitleStatus === 'exists');
  const subtitleMissing = plan.filter((p) => p.subtitleStatus === 'missing');
  const errors = [];

  return {
    total,
    readyToMigrate: migrate.length,
    skippedIngredientsExists: skippedIngredientsExists.length,
    skippedStandalonePortion: skippedPortion.length,
    skippedEmptyDescription: skippedEmpty.length,
    subtitleAlreadyExists: subtitleExists.length,
    subtitleMissing: subtitleMissing.length,
    errors: errors.length,
    migrate,
    skippedPortion,
    subtitleMissingRows: subtitleMissing,
  };
}

function titleMatch(title, needle) {
  const t = String(title ?? '').toLowerCase().trim();
  const n = needle.toLowerCase().trim();
  if (n === 'мацун') return t === 'мацун';
  if (n === 'мацун чесночный') return t === 'мацун чесночный';
  if (n === 'хашлама') return t.includes('хашлама');
  if (n === 'хачапури по-аджарски') return t === 'хачапури по-аджарски';
  if (n === 'картофель фри') return t === 'картофель фри';
  return t === n || t.includes(n);
}

function pickRequiredExamples(plan) {
  const found = [];
  for (const needle of REQUIRED_TITLES) {
    const matches = plan.filter((p) => titleMatch(p.title, needle));
    if (matches.length === 0) {
      found.push({
        requestedTitle: needle,
        productId: '',
        title: '(not found)',
        descriptionHtml: '',
        currentIngredients: '',
        proposedIngredients: null,
        subtitle: '',
        action: 'SKIP',
        reason: 'product not found in ru translations',
      });
      continue;
    }
    // Prefer exact title match when multiple
    const exact = matches.find((p) => p.title.toLowerCase() === needle.toLowerCase());
    const pick = exact ?? matches[0];
    found.push({ requestedTitle: needle, ...pick });
  }
  return found;
}

function formatReportTable(rows) {
  const lines = [
    '| Product ID | Title | descriptionHtml | Current ingredients | Proposed ingredients | subtitle | Action | Reason |',
    '| ---------- | ----- | --------------- | ------------------- | -------------------- | -------- | ------ | ------ |',
  ];
  for (const r of rows) {
    const short = String(r.descriptionHtml ?? '')
      .replace(/\n/g, ' ')
      .slice(0, 120);
    lines.push(
      `| ${r.productId} | ${r.title} | ${short} | ${r.currentIngredients || '∅'} | ${r.proposedIngredients ?? '∅'} | ${r.subtitle || '∅'} | ${r.action} | ${r.reason} |`,
    );
  }
  return lines.join('\n');
}

async function writeDryRunArtifacts(plan, summary) {
  mkdirSync(AUDIT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = join(AUDIT_DIR, `dry-run-plan-${stamp}.json`);
  const csvPath = join(AUDIT_DIR, `dry-run-plan-${stamp}.csv`);
  const mdPath = join(AUDIT_DIR, `dry-run-report-${stamp}.md`);

  const csvRows = plan.map((p) => ({
    translationId: p.translationId,
    productId: p.productId,
    locale: p.locale,
    title: p.title,
    descriptionHtml: p.descriptionHtml,
    currentIngredients: p.currentIngredients,
    proposedIngredients: p.proposedIngredients ?? '',
    subtitle: p.subtitle,
    subtitleStatus: p.subtitleStatus,
    action: p.action,
    reason: p.reason,
  }));

  writeFileSync(
    jsonPath,
    JSON.stringify({ summary: {
      total: summary.total,
      readyToMigrate: summary.readyToMigrate,
      skippedIngredientsExists: summary.skippedIngredientsExists,
      skippedStandalonePortion: summary.skippedStandalonePortion,
      skippedEmptyDescription: summary.skippedEmptyDescription,
      subtitleAlreadyExists: summary.subtitleAlreadyExists,
      subtitleMissing: summary.subtitleMissing,
      errors: summary.errors,
    }, plan }, null, 2),
    'utf8',
  );

  writeFileSync(
    csvPath,
    toCsv(csvRows, [
      'translationId',
      'productId',
      'locale',
      'title',
      'descriptionHtml',
      'currentIngredients',
      'proposedIngredients',
      'subtitle',
      'subtitleStatus',
      'action',
      'reason',
    ]),
    'utf8',
  );

  const examples = pickRequiredExamples(plan);
  const md = [
    '# Dry-run: descriptionHtml → ingredients',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Total translations (ru): ${summary.total}`,
    `- Ready to migrate: ${summary.readyToMigrate}`,
    `- Skipped: ingredients already exists: ${summary.skippedIngredientsExists}`,
    `- Skipped: standalone portion: ${summary.skippedStandalonePortion}`,
    `- Skipped: empty description: ${summary.skippedEmptyDescription}`,
    `- Subtitle already exists: ${summary.subtitleAlreadyExists}`,
    `- Subtitle missing: ${summary.subtitleMissing}`,
    `- Errors: ${summary.errors}`,
    '',
    '## Required examples',
    '',
    formatReportTable(examples),
    '',
    '## Standalone portion skips',
    '',
    formatReportTable(summary.skippedPortion),
    '',
    '## Subtitle missing (not auto-filled)',
    '',
    formatReportTable(summary.subtitleMissingRows),
    '',
    '## All MIGRATE candidates',
    '',
    formatReportTable(summary.migrate),
  ].join('\n');

  writeFileSync(mdPath, md, 'utf8');

  return { jsonPath, csvPath, mdPath, examples };
}

/**
 * Apply only MIGRATE rows. Idempotent: re-checks empty ingredients inside transaction.
 * DO NOT call unless operator passed --apply after reviewing dry-run.
 */
async function applyOneCandidate(tx, row) {
  const result = await tx.productTranslation.updateMany({
    where: {
      id: row.translationId,
      OR: [{ ingredients: null }, { ingredients: '' }],
    },
    data: {
      ingredients: row.proposedIngredients,
    },
  });
  if (result.count === 1) return 'updated';

  const current = await tx.productTranslation.findUnique({
    where: { id: row.translationId },
    select: { ingredients: true },
  });
  if (!isIngredientsEmpty(current?.ingredients)) return 'skipped';

  // whitespace-only ingredients
  await tx.productTranslation.update({
    where: { id: row.translationId },
    data: { ingredients: row.proposedIngredients },
  });
  return 'updated';
}

/**
 * Apply only MIGRATE rows in chunked transactions (Neon interactive tx timeout safe).
 * Idempotent: re-checks empty ingredients before/during update.
 */
async function applyMigration(plan) {
  const candidates = plan.filter((p) => p.action === 'MIGRATE' && p.proposedIngredients);
  let actualUpdates = 0;
  let skipped = 0;
  const failed = [];
  const CHUNK = 25;

  for (let i = 0; i < candidates.length; i += CHUNK) {
    const chunk = candidates.slice(i, i + CHUNK);
    let chunkUpdated = 0;
    let chunkSkipped = 0;
    let chunkFailed = [];

    try {
      await prisma.$transaction(
        async (tx) => {
          chunkUpdated = 0;
          chunkSkipped = 0;
          chunkFailed = [];
          for (const row of chunk) {
            try {
              const status = await applyOneCandidate(tx, row);
              if (status === 'updated') chunkUpdated += 1;
              else chunkSkipped += 1;
            } catch (err) {
              chunkFailed.push({
                translationId: row.translationId,
                productId: row.productId,
                title: row.title,
                error: err instanceof Error ? err.message : String(err),
              });
            }
          }
          if (chunkFailed.length > 0) {
            throw new Error(`Chunk had ${chunkFailed.length} row errors; rolling back`);
          }
        },
        { timeout: 60_000, maxWait: 20_000 },
      );
      actualUpdates += chunkUpdated;
      skipped += chunkSkipped;
    } catch {
      // Chunk-level failure / timeout: apply each row individually (still idempotent).
      for (const row of chunk) {
        try {
          const status = await applyOneCandidate(prisma, row);
          if (status === 'updated') actualUpdates += 1;
          else skipped += 1;
        } catch (rowErr) {
          failed.push({
            translationId: row.translationId,
            productId: row.productId,
            title: row.title,
            error: rowErr instanceof Error ? rowErr.message : String(rowErr),
          });
        }
      }
    }
  }

  return {
    expectedUpdates: candidates.length,
    actualUpdates,
    skipped,
    failed,
  };
}

function parseArgs(argv) {
  const flags = new Set(argv.slice(2));
  return {
    backup: flags.has('--backup') || flags.has('--dry-run') || flags.has('--apply'),
    dryRun: flags.has('--dry-run'),
    apply: flags.has('--apply'),
  };
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.backup && !args.dryRun && !args.apply) {
    console.error(
      'Usage:\n' +
        '  node scripts/migrate-short-description-to-ingredients.mjs --backup\n' +
        '  node scripts/migrate-short-description-to-ingredients.mjs --dry-run\n' +
        '  node scripts/migrate-short-description-to-ingredients.mjs --apply\n',
    );
    process.exit(1);
  }

  if (args.apply && args.dryRun) {
    console.error('Use either --dry-run or --apply, not both.');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is missing. Load .env first.');
    process.exit(1);
  }

  console.log('=== Product composition migration ===\n');

  // Stage 1: always backup before dry-run/apply
  if (args.backup) {
    console.log('Stage 1: Backup…');
    const backup = await createBackup();
    console.log(`  Translations backed up: ${backup.count}`);
    console.log(`  JSON: ${backup.jsonPath}`);
    console.log(`  CSV:  ${backup.csvPath}\n`);
  }

  if (args.dryRun || args.apply) {
    console.log('Building plan…');
    const { plan } = await buildPlan();
    const summary = summarize(plan);

    console.log('\n=== DRY-RUN / PLAN SUMMARY ===');
    console.log(`Total translations:                    ${summary.total}`);
    console.log(`Ready to migrate:                      ${summary.readyToMigrate}`);
    console.log(`Skipped: ingredients already exists:   ${summary.skippedIngredientsExists}`);
    console.log(`Skipped: standalone portion:           ${summary.skippedStandalonePortion}`);
    console.log(`Skipped: empty description:            ${summary.skippedEmptyDescription}`);
    console.log(`Subtitle already exists:               ${summary.subtitleAlreadyExists}`);
    console.log(`Subtitle missing:                      ${summary.subtitleMissing}`);
    console.log(`Errors:                                ${summary.errors}`);

    const artifacts = await writeDryRunArtifacts(plan, summary);
    console.log('\n=== REQUIRED EXAMPLES ===\n');
    console.log(formatReportTable(artifacts.examples));
    console.log('\n=== STANDALONE PORTION SKIPS ===\n');
    console.log(formatReportTable(summary.skippedPortion));
    console.log('\nArtifacts:');
    console.log(`  Plan JSON: ${artifacts.jsonPath}`);
    console.log(`  Plan CSV:  ${artifacts.csvPath}`);
    console.log(`  Report MD: ${artifacts.mdPath}`);

    if (args.dryRun) {
      console.log('\n✅ Dry-run complete. NO database UPDATEs were performed.');
      console.log('STOP — wait for explicit confirmation before --apply.');
      return;
    }

    if (args.apply) {
      const confirmPath = join(AUDIT_DIR, 'APPLY_CONFIRMED');
      if (!existsSync(confirmPath)) {
        console.error(
          '\nRefusing --apply: create audit/product-composition-migration/APPLY_CONFIRMED after reviewing dry-run.',
        );
        process.exit(1);
      }
      console.log('\nStage 4: Applying ingredient updates in a transaction…');
      const result = await applyMigration(plan);
      console.log(`Expected updates: ${result.expectedUpdates}`);
      console.log(`Actual updates:   ${result.actualUpdates}`);
      console.log(`Skipped:          ${result.skipped}`);
      console.log(`Failed:           ${result.failed.length}`);
      if (result.failed.length) {
        console.log(JSON.stringify(result.failed, null, 2));
      }
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
