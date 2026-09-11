# AI Knowledge Base

Source documents and their derived artifacts for SAKSHAM's RAG pipeline.
This directory holds everything that will eventually be embedded into
`ai/vector_store/` — nothing else should be embedded from elsewhere in
the repo.

## Structure

```
knowledge_base/
├── raw/            Original source PDFs, never modified after being added
│   ├── scheme_docs/          Government scheme guidelines
│   ├── business_knowledge/   Sector-specific reference material (dairy, retail, textiles...)
│   ├── entrepreneurship/     General business-planning / DPR-writing knowledge
│   └── district_knowledge/   Mathura-specific local/industrial data
├── extracted/      Step 1.2 output — page-level text + metadata, one file per source PDF
├── cleaned/        Step 1.3 output — extracted text with boilerplate headers/footers
│                   stripped and whitespace normalized, same shape as extracted/
└── chunks/         Step 1.5 output — final paragraph/section chunks ready for embedding
```

## Why these folders exist

- **`raw/<category>/`** — documents are sorted into the same four categories
  used in the Step 0.4 knowledge base audit (scheme / business /
  entrepreneurship / district). Ingestion code reads the category from the
  folder path instead of guessing document type from content, so tagging is
  deterministic. Original files are never edited in place — matching the
  "raw file must remain unchanged" rule already used for the census data
  pipeline (see `docs/data_dictionary.md`).
- **`extracted/`** — kept separate from `raw/` so text extraction can be
  re-run (different extraction method, bug fix, etc.) without ever touching
  the source PDFs.
- **`cleaned/`** — kept separate from `extracted/` so header/footer stripping
  and whitespace normalization can be re-tuned without re-running PDF
  extraction. Boilerplate patterns removed from each document are recorded
  in the file itself (`removed_header_pattern`, `removed_footer_pattern`),
  so cleaning decisions stay inspectable rather than silent.
- **`chunks/`** — kept separate from `cleaned/` so chunking strategy can
  change independently of cleaning. Chunks carry forward the page/source
  metadata, they don't re-derive it.

## What's currently here (Mathura MVP set, per Step 0.4 audit)

| File | Category | Note |
|---|---|---|
| `raw/scheme_docs/pmfme_scheme_guidelines.pdf` | scheme_docs | PMFME only — **not** the primary 90%/10% Micro Finance/Term Loan scheme. Tag as `scheme: PMFME` during ingestion, never as the primary scheme. |
| `raw/business_knowledge/dairy_yogurt_plant_project_report.pdf` | business_knowledge | Tag as `business_category: dairy`, `document_type: project_report_template`. Contains example/template figures, not live Mathura market data. |
| `raw/entrepreneurship/manual_entrepreneurship_development.pdf` | entrepreneurship | Generic (not Mathura-specific). Only Chapters 4, 6, 7 are planned for extraction (business plans, project appraisal, DPR format). |
| `raw/district_knowledge/mathura_district_industrial_profile.pdf` | district_knowledge | MSME-DI Agra's "Brief Industrial Profile of District Mathura" — our only hyper-local document. |

**Deliberately excluded from this knowledge base:** the PMFME marketing
brochure (redundant with the guidelines above), `mainproblemstatement.docx`,
and `SAKSHAM_Master_Reference.md` — these are project-planning inputs, not
end-user-facing knowledge, per the Step 0.4 audit.