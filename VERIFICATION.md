# Verification Log - Lesotho Law MCP

Date: 2026-04-22
Branch: `feat/full-corpus-ingest`

## Build pipeline

| Step | Command | Result |
|------|---------|--------|
| Type-check | `npx tsc --noEmit` | clean |
| Census | `npx tsx scripts/census.ts` | 84 entries (61 acts + 23 subsidiary) |
| Ingest | `npx tsx scripts/ingest.ts` | 75 AKN-HTML parsed, 9 PDF-only flagged |
| Build DB | `npx tsx scripts/build-db.ts` | 84 docs, 4,324 provisions, 1,482 definitions, 9.2 MB |
| Contract tests | `npx vitest run __tests__/contract/` | 31/31 pass |

## Corpus summary

- **Total documents:** 84
- **Acts of Parliament:** 61
- **Subsidiary legislation (Legal Notices):** 23
- **AKN-HTML parsed:** 75 (89% coverage)
- **PDF-only (pending OCR):** 9
- **Total provisions extracted:** 4,324
- **Total definitions extracted:** 1,482
- **Database size:** 9.2 MB

## Sanity queries (against `data/database.db`)

### 1. Data Protection Act 2012, Section 2 (Interpretation)

```
SELECT document_id, provision_ref, title, substr(content, 1, 100) FROM legal_provisions
WHERE document_id = 'data-protection-act-2012-5' AND section = '2';

data-protection-act-2012-5 | s2 | Interpretation
"In this Act, unless the context otherwise requires - 'agent' in relation to personal data, means a..."
```

### 2. Anti-Trafficking Act, Section 1 (Short title)

```
anti-trafficking-in-persons-act-2011-1 | s1 | Short title and commencement
"This Act may be cited as the Anti-Trafficking in Persons Act, 2011, and shall come into operation..."
```

### 3. Penal Code Act 2012, first three sections

```
s1 | Citation and commencement
s2 | Application
s3 | Interpretation
```

### 4. FTS search: "money laundering"

Returns at least 3 matching provisions across Companies Act, Children's Protection Act, Financial Institutions Act.

### 5. FTS search: "terrorism"

Returns matches in Insurance Act s98, Money Laundering & Proceeds of Crime Act s2, and the Prevention and Suppression of Terrorism Act 2018.

### 6. Top documents by provision count

```
Criminal Procedure and Evidence Act, 1981   - 345 provisions
Children's Protection and Welfare Act, 2011 - 237 provisions
Companies Act, 2011                         - 187 provisions
Public Service Regulations, 2008            - 144 provisions
Insurance Act, 2014                         - 139 provisions
```

## PDF-only documents (flagged for future OCR pass)

Nine LesLII documents are rendered in `display-type="pdf"` mode with no AKN markup in the page body. Ingest writes an empty-provisions seed with `pdf_only: true` so a later OCR pass (via pdftotext on `/akn/.../source.pdf`) can populate them without re-running census:

1. Administration of Estates and Inheritance Act, 2024
2. Appropriation (1962/63) Law, 1962
3. High Court Civil Litigation Rules, 2024
4. International Organisations (Privileges and Immunities) Southern African Customs Union Regulations, 2017
5. Labour Act, 2024
6. Labour Code Wages (Minimum Wages) Notice, 2024
7. Legal Practitioners Act 1967
8. Road Traffic Regulations, 1981
9. Supplementary Appropriation (1961/62) Law, 1961

## Known gaps

- **Constitution of Lesotho:** not published as AKN on LesLII. Users seeking the Constitution should go to the official government portal.
- **Labour Act 2024 (PDF-only):** one of the highest-impact recent statutes is flagged for OCR, not yet searchable at the provision level.
- **Historical coverage:** LesLII's legislation index holds roughly 2 pages of results; a deeper enumeration of colonial-era and proclamation-era statutes would require another source (e.g. the Lesotho Gazette archive).

## Tool surface (unchanged from scaffold)

Standard law-MCP tool set:

- `search_legislation`
- `get_provision`
- `list_sources`
- `about`
- `validate_citation`
- `format_citation`
- `check_currency`
- `build_legal_stance`
- `get_eu_basis`, `get_lesotho_implementations`, `search_eu_implementations`, `get_provision_eu_basis`, `validate_eu_compliance` (EU cross-reference family, empty for LS until seeded)
