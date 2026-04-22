# Lesotho Law MCP Server

**The Lesotho Law alternative for the AI age.**

[![npm version](https://badge.fury.io/js/%40ansvar/lesotho-law-mcp.svg)](https://www.npmjs.com/package/@ansvar/lesotho-law-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub stars](https://img.shields.io/github/stars/Ansvar-Systems/Lesotho-law-mcp?style=social)](https://github.com/Ansvar-Systems/Lesotho-law-mcp)
[![CI](https://github.com/Ansvar-Systems/Lesotho-law-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/Lesotho-law-mcp/actions/workflows/ci.yml)
[![Database](https://img.shields.io/badge/database-pre--built-green)]()
[![Provisions](https://img.shields.io/badge/provisions-4%2C324-blue)]()

Query **84 Lesotho legal documents** -- 61 Acts of Parliament and 23 Legal Notices, from the Data Protection Act, 2012 and Anti-Trafficking in Persons Act, 2011 to the Companies Act, 2011, Penal Code Act, 2012, and more -- directly from Claude, Cursor, or any MCP-compatible client.

If you're building legal tech, compliance tools, or doing Lesotho legal research, this is your verified reference database.

Built by [Ansvar Systems](https://ansvar.eu) -- Stockholm, Sweden

---

## Why This Exists

Lesotho legal research lives on the Lesotho Legal Information Institute (LesLII) and the Lesotho Government Gazette, with no free programmatic access. Whether you're:
- A **lawyer** validating citations in a brief or contract under Lesotho law
- A **compliance officer** checking how the Data Protection Act, 2012 applies to your processing activities
- A **legal tech developer** building tools on Lesotho legislation
- A **researcher** tracing statutes from the Prescription Act of 1861 forward

...you shouldn't need dozens of browser tabs and manual PDF cross-referencing. Ask Claude. Get the exact provision. With context.

This MCP server makes Lesotho law **searchable, cross-referenceable, and AI-readable**.

---

## Quick Start

### Use Remotely (No Install Needed)

> Connect directly to the hosted version -- zero dependencies, nothing to install.

**Endpoint:** `https://lesotho-law-mcp.vercel.app/mcp`

| Client | How to Connect |
|--------|---------------|
| **Claude.ai** | Settings > Connectors > Add Integration > paste URL |
| **Claude Code** | `claude mcp add lesotho-law --transport http https://lesotho-law-mcp.vercel.app/mcp` |
| **Claude Desktop** | Add to config (see below) |
| **GitHub Copilot** | Add to VS Code settings (see below) |

**Claude Desktop** -- add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "lesotho-law": {
      "type": "url",
      "url": "https://lesotho-law-mcp.vercel.app/mcp"
    }
  }
}
```

**GitHub Copilot** -- add to VS Code `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "lesotho-law": {
      "type": "http",
      "url": "https://lesotho-law-mcp.vercel.app/mcp"
    }
  }
}
```

### Use Locally (npm)

```bash
npx @ansvar/lesotho-law-mcp
```

**Claude Desktop** -- add to `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "lesotho-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/lesotho-law-mcp"]
    }
  }
}
```

**Cursor / VS Code:**

```json
{
  "mcp.servers": {
    "lesotho-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/lesotho-law-mcp"]
    }
  }
}
```

---

## Example Queries

Once connected, just ask naturally:

- *"What does the Data Protection Act, 2012 say about consent?"*
- *"Is the Companies Act, 2011 still in force?"*
- *"Find provisions about trafficking in persons under Lesotho law"*
- *"Summarise the Money Laundering and Proceeds of Crime Act, 2008"*
- *"What does the Penal Code Act, 2012 say about murder?"*
- *"Retrieve Section 2 of the Anti-Trafficking in Persons Act, 2011"*
- *"Validate this legal citation"*
- *"Build a legal stance on personal data processing in Lesotho"*

---

## Key Legislation Covered

| Act | Year | Significance |
|-----|------|-------------|
| **Data Protection Act** | 2012 | Personal data protection framework in Lesotho |
| **Anti-Trafficking in Persons Act** | 2011 | Criminalises human trafficking; victim protection framework |
| **Penal Code Act** | 2012 | Codified criminal offences |
| **Criminal Procedure and Evidence Act** | 1981 | Criminal procedure and evidence (345 provisions) |
| **Companies Act** | 2011 | Modern company law framework |
| **Money Laundering and Proceeds of Crime Act** | 2008 | AML framework with accompanying 2019 regulations |
| **Prevention and Suppression of Terrorism Act** | 2018 | Counter-terrorism and related financing offences |
| **Prevention of Corruption and Economic Offences Act** | 1999 | Anti-corruption framework |
| **Financial Institutions Act** | 2012 | Banking and financial services regulation |
| **Insurance Act** | 2014 | Insurance sector regulation (139 provisions) |
| **Communications Act** | 2012 | Communications sector regulation |
| **Labour Act** | 2024 | Labour law (PDF-only on LesLII, pending OCR) |

---

## Deployment Tier

**SMALL** -- Single tier, bundled SQLite database shipped with the npm package.

**Database size:** ~9.2 MB (84 documents, 4,324 provisions, 1,482 definitions)

---

## Available Tools (13)

### Core Legal Research Tools (8)

| Tool | Description |
|------|-------------|
| `search_legislation` | FTS5 full-text search across all provisions with BM25 ranking |
| `get_provision` | Retrieve specific provision by statute + chapter/section |
| `check_currency` | Check if statute is in force, amended, or repealed |
| `validate_citation` | Validate citation against database (zero-hallucination check) |
| `build_legal_stance` | Aggregate citations from statutes for a legal topic |
| `format_citation` | Format citations per Lesotho conventions (full/short/pinpoint) |
| `list_sources` | List all available statutes with metadata |
| `about` | Server info, capabilities, and coverage summary |

### EU/International Law Integration Tools (5)

| Tool | Description |
|------|-------------|
| `get_eu_basis` | Get EU directives/regulations for Lesotho statute |
| `get_lesotho_implementations` | Find Lesotho laws implementing EU act |
| `search_eu_implementations` | Search EU documents with Lesotho implementation counts |
| `get_provision_eu_basis` | Get EU law references for specific provision |
| `validate_eu_compliance` | Check implementation status of EU directives |

---

## Why This Works

**Verbatim Source Text (No LLM Processing):**
- All statute text is ingested from official Lesotho government sources
- Provisions are returned **unchanged** from SQLite FTS5 database rows
- Zero LLM summarization or paraphrasing -- the database contains regulation text, not AI interpretations

**Smart Context Management:**
- Search returns ranked provisions with BM25 scoring (safe for context)
- Provision retrieval gives exact text by statute identifier + chapter/section
- Cross-references help navigate without loading everything at once

**Technical Architecture:**
```
Official Sources --> Parse --> SQLite --> FTS5 snippet() --> MCP response
                     ^                       ^
              Provision parser         Verbatim database query
```

### Traditional Research vs. This MCP

| Traditional Approach | This MCP Server |
|---------------------|-----------------|
| Search official databases by statute number | Search by plain language |
| Navigate multi-chapter statutes manually | Get the exact provision with context |
| Manual cross-referencing between laws | `build_legal_stance` aggregates across sources |
| "Is this statute still in force?" --> check manually | `check_currency` tool --> answer in seconds |
| Find EU basis --> dig through EUR-Lex | `get_eu_basis` --> linked EU directives instantly |
| No API, no integration | MCP protocol --> AI-native |

---

## Data Sources & Freshness

All content is sourced from authoritative Lesotho legal databases:

- **[Lesotho Legal Information Institute (LesLII)](https://lesotholii.org)** -- the official legal information institute, part of the AfricanLII / Laws.Africa network. Content served as Akoma Ntoso HTML.

Ingestion runs against `https://lesotholii.org/legislation/` (acts and legal notices). Nine documents that LesLII serves PDF-only (including the Labour Act, 2024 and the 2024 High Court Civil Litigation Rules) are flagged in `data/census.json` with `pdf_only: true` pending a later OCR pass.

**Verified data only** -- every citation is validated against the LesLII source document. Zero LLM-generated content.

---

## Security

This project uses multiple layers of automated security scanning:

| Scanner | What It Does | Schedule |
|---------|-------------|----------|
| **CodeQL** | Static analysis for security vulnerabilities | Weekly + PRs |
| **Semgrep** | SAST scanning (OWASP top 10, secrets, TypeScript) | Every push |
| **Gitleaks** | Secret detection across git history | Every push |
| **Trivy** | CVE scanning on filesystem and npm dependencies | Daily |
| **Socket.dev** | Supply chain attack detection | PRs |
| **Dependabot** | Automated dependency updates | Weekly |

See [SECURITY.md](SECURITY.md) for the full policy and vulnerability reporting.

---

## Important Disclaimers

### Legal Advice

> **THIS TOOL IS NOT LEGAL ADVICE**
>
> Statute text is sourced from official Lesotho government publications. However:
> - This is a **research tool**, not a substitute for professional legal counsel
> - **Court case coverage is limited** -- do not rely solely on this for case law research
> - **Verify critical citations** against primary sources for court filings
> - **EU cross-references** are extracted from statute text, not EUR-Lex full text

**Before using professionally, read:** [DISCLAIMER.md](DISCLAIMER.md) | [SECURITY.md](SECURITY.md)

### Client Confidentiality

Queries go through the Claude API. For privileged or confidential matters, use on-premise deployment.

---

## Development

### Setup

```bash
git clone https://github.com/Ansvar-Systems/Lesotho-law-mcp
cd Lesotho-law-mcp
npm install
npm run build
npm test
```

### Running Locally

```bash
npm run dev                                       # Start MCP server
npx @anthropic/mcp-inspector node dist/index.js   # Test with MCP Inspector
```

---

## Related Projects: Complete Compliance Suite

This server is part of **Ansvar's Compliance Suite** -- MCP servers that work together for end-to-end compliance coverage:

### [@ansvar/eu-regulations-mcp](https://github.com/Ansvar-Systems/EU_compliance_MCP)
**Query 49 EU regulations directly from Claude** -- GDPR, AI Act, DORA, NIS2, MiFID II, eIDAS, and more. Full regulatory text with article-level search. `npx @ansvar/eu-regulations-mcp`

### [@ansvar/us-regulations-mcp](https://github.com/Ansvar-Systems/US_Compliance_MCP)
**Query US federal and state compliance laws** -- HIPAA, CCPA, SOX, GLBA, FERPA, and more. `npx @ansvar/us-regulations-mcp`

### [@ansvar/security-controls-mcp](https://github.com/Ansvar-Systems/security-controls-mcp)
**Query 261 security frameworks** -- ISO 27001, NIST CSF, SOC 2, CIS Controls, SCF, and more. `npx @ansvar/security-controls-mcp`

### [@ansvar/automotive-cybersecurity-mcp](https://github.com/Ansvar-Systems/Automotive-MCP)
**Query UNECE R155/R156 and ISO 21434** -- Automotive cybersecurity compliance. `npx @ansvar/automotive-cybersecurity-mcp`

**30+ national law MCPs** covering Australia, Brazil, Canada, China, Denmark, Finland, France, Germany, Ghana, Iceland, India, Ireland, Israel, Italy, Japan, Lesotho, Netherlands, Nigeria, Norway, Singapore, Slovenia, South Korea, Sweden, Switzerland, Thailand, UAE, UK, and more.

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Priority areas:
- Court case law expansion
- EU cross-reference improvements
- Historical statute versions and amendment tracking
- Additional statutory instruments and regulations

---

## Roadmap

- [x] Core statute database with FTS5 search
- [x] EU/international law cross-references
- [x] Vercel Streamable HTTP deployment
- [x] npm package publication
- [ ] Court case law expansion
- [ ] Historical statute versions (amendment tracking)
- [ ] Preparatory works / explanatory memoranda
- [ ] Lower court and tribunal decisions

---

## Citation

If you use this MCP server in academic research:

```bibtex
@software{lesotho_law_mcp_2025,
  author = {Ansvar Systems AB},
  title = {Lesotho Law MCP Server: AI-Powered Legal Research Tool},
  year = {2025},
  url = {https://github.com/Ansvar-Systems/Lesotho-law-mcp},
  note = {Lesotho legal database with full-text search and EU cross-references}
}
```

---

## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.

### Data Licenses

- **Statutes & Legislation:** Lesotho Government (public domain)
- **EU Metadata:** EUR-Lex (EU public domain)

---

## About Ansvar Systems

We build AI-accelerated compliance and legal research tools for the global market. This MCP server started as our internal reference tool -- turns out everyone building compliance tools has the same research frustrations.

So we're open-sourcing it.

**[ansvar.eu](https://ansvar.eu)** -- Stockholm, Sweden

---

<p align="center">
  <sub>Built with care in Stockholm, Sweden</sub>
</p>
