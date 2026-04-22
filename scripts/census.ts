#!/usr/bin/env tsx
/**
 * Lesotho Law MCP - Census Script
 *
 * Enumerates all Acts and Legal Notices from lesotholii.org by scraping the
 * paginated /legislation/ listing page. The site is part of the AfricanLII /
 * Laws.Africa network and serves Akoma Ntoso HTML at canonical URLs of the
 * form /akn/ls/act/<year>/<number>/eng@<date> (Acts) or
 * /akn/ls/act/ln/<year>/<number>/eng@<date> (Legal Notices / statutory
 * instruments).
 *
 * Output: data/census.json in the golden-standard shape used by the Kenya /
 * Botswana / Zambia law MCPs.
 *
 * Usage:
 *   npx tsx scripts/census.ts
 *   npx tsx scripts/census.ts --page 2    # Fetch only page 2 (resume)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { fetchWithRateLimit } from './lib/fetcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LII_BASE = 'https://lesotholii.org';
const BROWSE_URL = `${LII_BASE}/legislation/`;
const CENSUS_PATH = path.resolve(__dirname, '../data/census.json');
/** LesLII pagination is sized by the server (~60 items per page); walk up to
 *  this many pages. Empty pages are benign and stop the walk. */
const MAX_PAGES = 20;

/* ---------- Types ---------- */

interface CensusLawEntry {
  id: string;
  title: string;
  identifier: string;
  url: string;
  status: 'in_force' | 'amended' | 'repealed';
  category: 'act' | 'subsidiary' | 'constitution';
  classification: 'ingestable' | 'excluded' | 'inaccessible';
  ingested: boolean;
  provision_count: number;
  ingestion_date: string | null;
}

interface CensusFile {
  schema_version: string;
  jurisdiction: string;
  jurisdiction_name: string;
  portal: string;
  census_date: string;
  agent: string;
  summary: {
    total_laws: number;
    ingestable: number;
    ocr_needed: number;
    inaccessible: number;
    excluded: number;
  };
  laws: CensusLawEntry[];
}

/* ---------- Helpers ---------- */

function parseArgs(): { page: number | null } {
  const args = process.argv.slice(2);
  let page: number | null = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--page' && args[i + 1]) {
      page = parseInt(args[i + 1], 10);
      i++;
    }
  }
  return { page };
}

/**
 * Normalise a Lesotho law title into a stable kebab-case ID.
 * The (ln_)year/number suffix keeps ids unique even when titles collide.
 */
function buildId(title: string, isLn: boolean, year: string, number: string): string {
  const slug = title
    .replace(/['']/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  const suffix = isLn ? `ln-${year}-${number}` : `${year}-${number}`;
  if (slug.endsWith(suffix)) return slug;
  // If the slug already ends with the year, only append the number.
  if (!isLn && slug.endsWith(`-${year}`)) return `${slug}-${number}`;
  return `${slug}-${suffix}`;
}

/**
 * Extract AKN year/number from a URL path.
 */
function parseAknUrl(urlPath: string): { year: string; number: string; isLn: boolean } | null {
  const lnMatch = urlPath.match(/\/akn\/ls\/act\/ln\/(\d{4})\/([^/]+)/);
  if (lnMatch) return { year: lnMatch[1], number: lnMatch[2].trim(), isLn: true };

  const actMatch = urlPath.match(/\/akn\/ls\/act\/(\d{4})\/([^/]+)/);
  if (actMatch) return { year: actMatch[1], number: actMatch[2].trim(), isLn: false };

  return null;
}

/**
 * Decode common HTML entities that appear in link text.
 */
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&nbsp;/g, ' ');
}

/**
 * Parse AKN entries from a LesLII legislation browse page.
 */
function parseLawEntries(html: string): { title: string; urlPath: string }[] {
  const entries: { title: string; urlPath: string }[] = [];
  const seen = new Set<string>();

  const pattern = /<a\s+href="(\/akn\/ls\/act\/(?:ln\/)?\d{4}\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    const urlPath = match[1].trim();
    const rawTitle = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const title = decodeEntities(rawTitle);

    if (!title || title.length < 4) continue;

    const workIri = urlPath.replace(/\/eng@[^/]*$/, '');
    if (seen.has(workIri)) continue;
    seen.add(workIri);

    entries.push({ title, urlPath });
  }

  return entries;
}

/**
 * Load existing census for merge/resume (preserves ingestion data).
 */
function loadExistingCensus(): Map<string, CensusLawEntry> {
  const existing = new Map<string, CensusLawEntry>();
  if (fs.existsSync(CENSUS_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(CENSUS_PATH, 'utf-8')) as CensusFile;
      if (Array.isArray(data.laws)) {
        for (const law of data.laws) {
          if (law && typeof law.id === 'string' && 'url' in law) {
            existing.set(law.id, law);
          }
        }
      }
    } catch {
      // Ignore parse errors, start fresh
    }
  }
  return existing;
}

/* ---------- Main ---------- */

async function main(): Promise<void> {
  const { page: singlePage } = parseArgs();

  console.log('Lesotho Law MCP - Census');
  console.log('========================\n');
  console.log(`  Source: ${LII_BASE} (Lesotho Legal Information Institute / LesLII)`);
  console.log(`  Browse URL: ${BROWSE_URL}`);
  console.log(`  Max pages: ${MAX_PAGES}`);
  if (singlePage) console.log(`  Single page mode: page ${singlePage}`);
  console.log();

  const existingEntries = loadExistingCensus();
  if (existingEntries.size > 0) {
    console.log(`  Loaded ${existingEntries.size} existing entries from previous census\n`);
  }

  const allEntries: { title: string; urlPath: string }[] = [];
  const pages = singlePage ? [singlePage] : Array.from({ length: MAX_PAGES }, (_, i) => i + 1);

  for (const pageNum of pages) {
    const url = pageNum === 1 ? BROWSE_URL : `${BROWSE_URL}?page=${pageNum}`;
    process.stdout.write(`  Fetching page ${pageNum}...`);

    const result = await fetchWithRateLimit(url);
    if (result.status !== 200) {
      console.log(` HTTP ${result.status} (stopping)`);
      break;
    }

    const entries = parseLawEntries(result.body);
    console.log(` ${entries.length} entries`);
    if (entries.length === 0) break;
    allEntries.push(...entries);
  }

  console.log(`\n  Total unique entries found: ${allEntries.length}`);

  const today = new Date().toISOString().split('T')[0];

  for (const { title, urlPath } of allEntries) {
    const akn = parseAknUrl(urlPath);
    if (!akn) {
      console.log(`  WARNING: Could not parse AKN URL: ${urlPath}`);
      continue;
    }

    const id = buildId(title, akn.isLn, akn.year, akn.number);
    const fullUrl = `${LII_BASE}${urlPath}`;
    const category: CensusLawEntry['category'] = akn.isLn ? 'subsidiary' : 'act';
    const identifier = akn.isLn
      ? `act/ln/${akn.year}/${akn.number}`
      : `act/${akn.year}/${akn.number}`;

    const existing = existingEntries.get(id);

    const entry: CensusLawEntry = {
      id,
      title,
      identifier,
      url: fullUrl,
      status: 'in_force',
      category,
      classification: 'ingestable',
      ingested: existing?.ingested ?? false,
      provision_count: existing?.provision_count ?? 0,
      ingestion_date: existing?.ingestion_date ?? null,
    };

    existingEntries.set(id, entry);
  }

  const allLaws = Array.from(existingEntries.values()).sort((a, b) =>
    a.title.localeCompare(b.title),
  );

  const ingestable = allLaws.filter(l => l.classification === 'ingestable').length;
  const inaccessible = allLaws.filter(l => l.classification === 'inaccessible').length;
  const excluded = allLaws.filter(l => l.classification === 'excluded').length;

  const census: CensusFile = {
    schema_version: '1.0',
    jurisdiction: 'LS',
    jurisdiction_name: 'Lesotho',
    portal: LII_BASE,
    census_date: today,
    agent: 'claude-opus-4-7',
    summary: {
      total_laws: allLaws.length,
      ingestable,
      ocr_needed: 0,
      inaccessible,
      excluded,
    },
    laws: allLaws,
  };

  fs.mkdirSync(path.dirname(CENSUS_PATH), { recursive: true });
  fs.writeFileSync(CENSUS_PATH, JSON.stringify(census, null, 2));

  console.log('\n========================');
  console.log('Census Complete');
  console.log('========================\n');
  console.log(`  Total laws:     ${allLaws.length}`);
  console.log(`    Acts:             ${allLaws.filter(l => l.category === 'act').length}`);
  console.log(`    Subsidiary:       ${allLaws.filter(l => l.category === 'subsidiary').length}`);
  console.log(`  Ingestable:     ${ingestable}`);
  console.log(`  Inaccessible:   ${inaccessible}`);
  console.log(`  Excluded:       ${excluded}`);
  console.log(`\n  Output: ${CENSUS_PATH}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
