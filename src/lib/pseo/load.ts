/**
 * Loads the pSEO seed rows from `src/data/pages.csv`.
 *
 * This file is read at build time only — never shipped to the client. The
 * CSV format is intentionally human-readable so the operator can hand-edit
 * rows between batches without touching code (the indexing-gate ritual in
 * MASTER-PLAN §9 Phase 4b requires this kind of low-friction iteration).
 *
 * Parser rules:
 *   • Header row required. Column order doesn't matter — we read by name.
 *   • Lines starting with `#` are comments.
 *   • Empty lines are skipped.
 *   • No quoting / escaping support — the CSV must avoid `,` in field values
 *     (the seed batch satisfies this by construction).
 */

/*
 * Vite's `?raw` import inlines the CSV at build time as a JS string. This
 * keeps the loader runtime-free (no `node:fs` calls in the Cloudflare
 * prerender environment) while preserving the human-editable CSV.
 *
 * The string is imported lazily through `getCsvSource()` so that unit tests
 * can substitute their own CSV without hitting Vite's import resolver.
 */
import type {
  AgeBand,
  IR35Status,
  PensionPref,
  Persona,
  PseoRow,
  Region,
  Structure,
} from './types';

import rawCsv from '../../data/pages.csv?raw';

let cache: PseoRow[] | null = null;

/**
 * Load (and cache) every row in pages.csv.
 */
export function loadPseoRows(): PseoRow[] {
  if (cache) return cache;
  cache = parseCsv(rawCsv);
  return cache;
}


export function parseCsv(raw: string): PseoRow[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length < 2) {
    throw new Error('pages.csv must contain at least a header and one row');
  }

  const headerLine = lines[0]!;
  const header = headerLine.split(',').map((h) => h.trim());
  const idx = (col: string): number => {
    const i = header.indexOf(col);
    if (i < 0) {
      throw new Error(`pages.csv missing required column: ${col}`);
    }
    return i;
  };

  const required = [
    'slug',
    'profession',
    'profession_label',
    'gross_income',
    'age',
    'age_band',
    'structure',
    'ir35_status',
    'pension_pref',
    'other_income',
    'region',
    'persona',
  ];
  required.forEach(idx); // throw early if anything missing

  const rows: PseoRow[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    const cells = line.split(',').map((c) => c.trim());
    if (cells.length < header.length) {
      throw new Error(
        `pages.csv row ${i + 1} has ${cells.length} cells, expected ${header.length}`,
      );
    }
    const row: PseoRow = {
      slug: cells[idx('slug')]!,
      profession: cells[idx('profession')]!,
      professionLabel: cells[idx('profession_label')]!,
      grossIncome: parseInt(cells[idx('gross_income')]!, 10),
      age: parseInt(cells[idx('age')]!, 10),
      ageBand: cells[idx('age_band')]! as AgeBand,
      structure: cells[idx('structure')]! as Structure,
      ir35Status: cells[idx('ir35_status')]! as IR35Status,
      pensionPref: cells[idx('pension_pref')]! as PensionPref,
      otherIncome: parseInt(cells[idx('other_income')]!, 10),
      region: cells[idx('region')]! as Region,
      persona: cells[idx('persona')]! as Persona,
    };
    if (!row.slug || !/^[a-z0-9-]+$/.test(row.slug)) {
      throw new Error(
        `pages.csv row ${i + 1} has invalid slug "${row.slug}" — must be [a-z0-9-]+`,
      );
    }
    if (seen.has(row.slug)) {
      throw new Error(`pages.csv duplicate slug "${row.slug}" on row ${i + 1}`);
    }
    seen.add(row.slug);
    if (!Number.isFinite(row.grossIncome) || row.grossIncome < 0) {
      throw new Error(
        `pages.csv row ${i + 1} has invalid gross_income "${cells[idx('gross_income')]}"`,
      );
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Map a `pensionPref` to the pensionWeight passed to the optimiser:
 *   none       → 0    (cash-only optimum)
 *   modest     → 0.5  (treat £1 pension ≈ £0.50 of cash)
 *   aggressive → 1.0  (treat £1 pension = £1 cash, full wealth view)
 *
 * Defined here (not in the optimiser) because it's a pSEO-specific concept.
 */
export function pensionWeightFor(pref: PensionPref): number {
  switch (pref) {
    case 'none':
      return 0;
    case 'modest':
      return 0.5;
    case 'aggressive':
      return 1.0;
  }
}
