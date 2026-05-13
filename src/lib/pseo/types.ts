/**
 * Programmatic-SEO ("pSEO") row + computed-result types.
 *
 * One row in `src/data/pages.csv` produces one page at `/pay/{slug}`. Each
 * page renders entirely from build-time computation — the row tells us which
 * engine to drive and what inputs to drive it with; the engine produces
 * numbers; the templates dress those numbers in prose.
 *
 * Cross-references:
 *   • MASTER-PLAN.md §11.5 — the 7-layer variance model
 *   • MASTER-PLAN.md §9 Phase 4b — the indexing-rate gate (max 200 pages
 *     in batch 1 before pausing for indexing)
 *   • bracketmath/src/data/pages.csv — the seed batch (200 rows, hand-curated)
 */

import type { OptimiserResult } from '../optim/salary-dividend';
import type { TakeHomeResult } from '../ir35/compare';

/* ────────────────────────────────────────────────────────────────────────── */
/* CSV row schema                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

export type AgeBand = 'under_30' | '30_to_45' | '45_to_55' | '55_plus';
export type Structure = 'sole_trader' | 'umbrella' | 'ltd_co';
export type IR35Status = 'inside' | 'outside' | 'n_a';
export type PensionPref = 'none' | 'modest' | 'aggressive';
export type Region = 'eng_ni_wales' | 'scotland';
export type Persona = 'optimiser' | 'lifestyle_se' | 'pre_retiree';

export interface PseoRow {
  slug: string;
  profession: string;
  professionLabel: string;
  grossIncome: number;
  age: number;
  ageBand: AgeBand;
  structure: Structure;
  ir35Status: IR35Status;
  pensionPref: PensionPref;
  /** Other personal income that stacks below the engine's tax calc. */
  otherIncome: number;
  region: Region;
  persona: Persona;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Computed result — uniform shape across all three structures.               */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * The bare-essentials computed view rendered on every page. Engine-specific
 * payloads (full optimiser result, full IR35 comparison, etc.) are kept in
 * `engineResult` for templates that want to drill into them.
 */
export interface Computed {
  /** Headline net cash the contractor / sole trader actually receives. */
  netCash: number;
  /** Total tax + NI + corp tax + fees through the chain. */
  totalDeductions: number;
  /** Pension contribution chosen by the optimiser / requested by the user. */
  pension: number;
  /** Net wealth = netCash + pension. */
  netWealth: number;
  /** Effective overall rate (totalDeductions / grossIncome). */
  effectiveRate: number;
  /** Marginal rate on the next £1 of gross income. */
  marginalRate: number;
  /** Headline extraction breakdown (salary / dividend / pension) — Ltd Co only. */
  salary?: number;
  dividend?: number;
  /** £ delta vs the rule-of-thumb baseline (always positive for Ltd Co). */
  vsRuleOfThumb?: number;
  /** Day rate (umbrella inside-IR35 rows only). */
  dayRate?: number;
  /** Break-even outside-IR35 day rate (umbrella rows only). */
  breakevenOutsideDayRate?: number;
  /** Tag for which engine produced these numbers. */
  engine: 'ltd_co' | 'umbrella' | 'sole_trader';
  /** Source data (kept for templates that need to drill in). */
  engineResult: OptimiserResult | TakeHomeResult | SoleTraderResult;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Sole-trader engine result — defined locally so the type is available even  */
/* before the sole-trader engine is in place. The sole-trader calculator      */
/* (Deliverable E) will produce a richer object that satisfies this contract. */
/* ────────────────────────────────────────────────────────────────────────── */

export interface SoleTraderResult {
  /** Profits after the trading allowance / actual expenses choice. */
  taxableProfits: number;
  incomeTax: number;
  classFour: number;
  classTwo: number;
  netCash: number;
  effectiveRate: number;
  marginalRate: number;
  /** Trading-allowance vs actual-expenses winner. */
  tradingAllowanceUsed: boolean;
  /** Ltd-Co comparison (only populated for "should I incorporate?" rows). */
  ltdCoComparison?: {
    ltdNetCash: number;
    /** Positive = Ltd Co is better. */
    differenceVsSoleTrader: number;
    /** Profit level at which Ltd Co stops being better. Null if always or never. */
    breakevenProfits: number | null;
  };
}
