/**
 * AKN HTML parser for Lesotho legislation from lesotholii.org (LesLII).
 *
 * LesLII is part of the AfricanLII / Laws.Africa network. It serves two
 * document variants:
 *   1. display-type="akn" - full Akoma Ntoso HTML embedded in the page with
 *      semantic classes (akn-section, akn-part, akn-chapter, akn-paragraph,
 *      akn-num, akn-heading, akn-p, akn-intro, akn-content, akn-wrapUp).
 *   2. display-type="pdf" - PDF-only documents where the page only exposes a
 *      download link at /akn/ls/<frbr>/source.pdf. Ingest records an empty
 *      provision set and flags these so they can be re-parsed later via
 *      pdftotext when OCR is enabled.
 *
 * This parser handles variant (1) directly and returns an empty provision
 * list for variant (2) so ingest can downgrade those entries in the census.
 */

export interface ActIndexEntry {
  id: string;
  title: string;
  titleEn: string;
  shortName: string;
  status: 'in_force' | 'amended' | 'repealed' | 'partially_suspended' | 'not_yet_in_force';
  issuedDate: string;
  inForceDate: string;
  /** Canonical AKN URL on lesotholii.org (e.g. https://lesotholii.org/akn/ls/act/2024/3/eng@2024-04-02) */
  url: string;
  /** Category from the census ("act" for principal, "subsidiary" for Legal Notices) */
  category: 'act' | 'subsidiary' | 'constitution';
  /** AKN year (e.g. "2024") */
  aknYear: string;
  /** AKN number (e.g. "3") */
  aknNumber: string;
  description?: string;
}

export interface ParsedProvision {
  provision_ref: string;
  chapter?: string;
  section: string;
  title: string;
  content: string;
}

export interface ParsedDefinition {
  term: string;
  definition: string;
  source_provision?: string;
}

export interface ParsedAct {
  id: string;
  type: 'statute';
  title: string;
  title_en: string;
  short_name: string;
  status: 'in_force' | 'amended' | 'repealed' | 'partially_suspended' | 'not_yet_in_force';
  issued_date: string;
  in_force_date: string;
  url: string;
  description?: string;
  provisions: ParsedProvision[];
  definitions: ParsedDefinition[];
  /** Set by ingest when the document is PDF-only and could not be structurally parsed */
  pdf_only?: boolean;
}

/**
 * Strip HTML tags and decode common entities, normalising whitespace.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Determine the chapter/part container for a section from its AKN id.
 *
 * AKN ids follow patterns like:
 *   part_I__sec_1       -> chapter = "Part I"
 *   chp_ONE__sec_1      -> chapter = "Chapter ONE"
 *   sec_1               -> chapter = undefined
 */
function extractChapter(sectionId: string): string | undefined {
  const partMatch = sectionId.match(/^part_([^_]+)__/);
  if (partMatch) return `Part ${partMatch[1]}`;

  const chpMatch = sectionId.match(/^chp_([^_]+)__/);
  if (chpMatch) return `Chapter ${chpMatch[1]}`;

  return undefined;
}

/**
 * Extract the section number from an h3 heading text.
 * Handles patterns like "1. Short title" or "25. Principles of data protection".
 */
function extractSectionNumber(heading: string): string | null {
  const match = heading.match(/^(\d+[A-Za-z]*)\.\s/);
  return match ? match[1] : null;
}

/**
 * Extract the section title from an h3 heading text.
 * Strips the leading number and period.
 */
function extractSectionTitle(heading: string): string {
  return heading.replace(/^\d+[A-Za-z]*\.\s*/, '').trim();
}

/**
 * Detect whether a LesLII document page is a PDF-only display.
 * Returns true if the display type is "pdf" and no AKN sections are in the body.
 */
export function isPdfOnly(html: string): boolean {
  if (/data-display-type="pdf"/.test(html)) {
    const hasAknSections = /<section[^>]*class="akn-section"/.test(html);
    return !hasAknSections;
  }
  return false;
}

/**
 * Parse LesLII AKN HTML to extract provisions from a statute page.
 *
 * The HTML contains <section class="akn-section" id="..." data-eid="..."> elements.
 * Each section contains an <h3> with the section number and title, followed by
 * structural content using akn-intro, akn-paragraph, akn-subsection, akn-content,
 * akn-p, and akn-num elements.
 */
export function parseLesothoLawHtml(html: string, act: ActIndexEntry): ParsedAct {
  const provisions: ParsedProvision[] = [];
  const definitions: ParsedDefinition[] = [];

  // LesLII emits `data-eId` (mixed case) rather than `data-eid`; match
  // case-insensitively and accept either `id=... data-eId=...` or either
  // attribute alone to be robust across AKN renderers. Rules of court use
  // `akn-rule` containers instead of `akn-section` — treat them identically.
  const sectionPattern = /<section\s+class="akn-(?:section|rule)"\s+(?:id="([^"]+)"(?:\s+data-eid="[^"]*")?|data-eid="([^"]+)")[^>]*>/gi;
  const sectionStarts: { id: string; index: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = sectionPattern.exec(html)) !== null) {
    const id = match[1] ?? match[2];
    sectionStarts.push({ id, index: match.index });
  }

  for (let i = 0; i < sectionStarts.length; i++) {
    const start = sectionStarts[i];
    const endIndex = i + 1 < sectionStarts.length ? sectionStarts[i + 1].index : html.length;
    const sectionHtml = html.substring(start.index, endIndex);

    const headingMatch = sectionHtml.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
    if (!headingMatch) continue;

    const headingText = stripHtml(headingMatch[1]);
    const sectionNum = extractSectionNumber(headingText);
    if (!sectionNum) continue;

    const title = extractSectionTitle(headingText);
    const chapter = extractChapter(start.id);

    const isArticle = start.id.includes('__art_');
    const isRule = start.id.startsWith('rule_') || start.id.includes('__rule_');
    const provisionRef = isArticle ? `art${sectionNum}` : isRule ? `r${sectionNum}` : `s${sectionNum}`;

    const contentHtml = sectionHtml.replace(/<h3[^>]*>[\s\S]*?<\/h3>/, '');
    const content = stripHtml(contentHtml);

    if (content.length > 10) {
      provisions.push({
        provision_ref: provisionRef,
        chapter,
        section: sectionNum,
        title,
        content: content.substring(0, 12000),
      });
    }

    if (title.toLowerCase().includes('interpretation') || title.toLowerCase().includes('definition')) {
      extractDefinitions(sectionHtml, provisionRef, definitions);
    }
  }

  return {
    id: act.id,
    type: 'statute',
    title: act.title,
    title_en: act.titleEn,
    short_name: act.shortName,
    status: act.status,
    issued_date: act.issuedDate,
    in_force_date: act.inForceDate,
    url: act.url,
    description: act.description,
    provisions,
    definitions,
  };
}

/**
 * Extract term definitions from an Interpretation section.
 *
 * LesLII renders definitions with an explicit Akoma Ntoso `<span class="akn-def">`
 * wrapping the defined term, followed by the definition text. We scan for each
 * akn-def span and capture everything up to the next akn-def span or the next
 * akn-section boundary as the definition body.
 */
function extractDefinitions(
  sectionHtml: string,
  sourceProvision: string,
  definitions: ParsedDefinition[],
): void {
  const pattern = /<span class="akn-def"[^>]*>([^<]+)<\/span>([\s\S]*?)(?=<span class="akn-def"|<section class="akn-section")/g;
  let m: RegExpExecArray | null;

  while ((m = pattern.exec(sectionHtml)) !== null) {
    const term = stripHtml(m[1]);
    let definition = stripHtml(m[2]);

    // Trim leading quote and trailing ; or " or [ annotation
    if (definition.startsWith('"') || definition.startsWith('“')) {
      definition = definition.substring(1).trim();
    }
    // Strip trailing semicolon + quote + stray edit-annotation fragments
    definition = definition.replace(/[;,]\s*["”]?\s*$/, '').trim();
    // Cap at 2000 chars
    definition = definition.substring(0, 2000);

    if (term.length > 0 && definition.length > 5) {
      definitions.push({
        term,
        definition,
        source_provision: sourceProvision,
      });
    }
  }
}
