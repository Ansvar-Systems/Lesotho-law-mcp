# Changelog

## 1.0.0 (2026-04-22)

- First full ingest of the LesLII corpus
- 84 documents: 61 Acts of Parliament + 23 Legal Notices (statutory instruments)
- 4,324 provisions + 1,482 definitions parsed from Akoma Ntoso HTML
- 9 PDF-only documents flagged for a later OCR pass (Labour Act 2024,
  Legal Practitioners Act 1967, Appropriation laws, etc.)
- SQLite database `data/database.db` (9.2 MB) shipped with the package
- FTS5 indexes over `provisions` and `definitions`
- Parser handles both `akn-section` (statutes) and `akn-rule`/`akn-subrule`
  (rules of court) containers; case-insensitive `data-eId` matching

## 0.1.0 (2026-03-01)

- Initial scaffold from golden standard template
- Configured for Lesotho (LS) - English
- Source: lesotholii.org
