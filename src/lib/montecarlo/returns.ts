/**
 * Block-bootstrap return generator — UK long-run real returns.
 *
 * Inputs: a historical series of annual {equity, gilt, cpi} observations
 * (see src/data/historical-returns.json for provenance).
 *
 * Output: a stream of simulated **real** monthly returns for a user-selected
 * portfolio mix (equity/gilt). The path can be of any horizon.
 *
 * Method — block bootstrap
 * ────────────────────────
 * Naive Monte Carlo draws each year's return independently from a fitted
 * distribution. This destroys the autocorrelation (volatility clustering,
 * post-crash recovery dynamics) that drives **sequence-of-returns risk** —
 * the dominant factor in retirement outcomes.
 *
 * Block bootstrap (Künsch 1989) addresses this by sampling **contiguous
 * blocks** of length L from the historical record, with replacement, and
 * concatenating them. A path of N years is built from ⌈N / L⌉ blocks.
 * Within each block, the original correlation structure is preserved.
 *
 * We use **annual blocks of length L = 1 year** by default, drawing from the
 * 124-year historical series. Because portfolio rebalancing is typically
 * annual, this is the natural block size. (Some practitioners use L = 5
 * years; we expose the parameter.) Each sampled year carries its three
 * observations (equity TR, gilt TR, CPI) together — preserving the
 * cross-sectional dependence that matters most: equities-vs-inflation in
 * inflationary years (1974, 2022), gilts-vs-equities in deflationary years
 * (1932), etc.
 *
 * Returns are converted to **real** terms via `(1 + nominal) / (1 + cpi) − 1`
 * before being mixed by the asset-allocation weight.
 *
 * Note on monthly resolution
 * ──────────────────────────
 * The historical series is annual. We *uniformly distribute* each annual real
 * return across 12 months ((1 + r_annual)^(1/12) - 1), which loses the
 * within-year volatility but preserves the year-on-year sequence — which is
 * what drives the sequence-of-returns metric. The simulator can then apply
 * monthly contributions/withdrawals against these returns. Practitioners
 * with strong views on within-year volatility can replace this with a
 * stochastic-volatility overlay; for first-order retirement modelling, the
 * annual approach is the standard (it is what the FCA's pension projection
 * methodology uses).
 */

import historicalReturnsJson from '../../data/historical-returns.json' with { type: 'json' };
import { mulberry32, randInt, type Rng } from './rng';

export interface HistoricalRow {
  year: number;
  equity: number;
  gilt: number;
  cpi: number;
}

export const HISTORICAL_RETURNS: HistoricalRow[] =
  historicalReturnsJson as HistoricalRow[];

export interface BlockBootstrapOptions {
  /** Number of *years* of monthly returns to generate. */
  years: number;
  /**
   * Equity weight in the portfolio, 0..1. Gilt weight is `1 - equityWeight`.
   * Defaults to 0.6 (a classic 60/40).
   */
  equityWeight?: number;
  /**
   * Block length in **years**. Defaults to 1. Set higher to preserve longer
   * autocorrelation horizons.
   */
  blockYears?: number;
  /**
   * Annual portfolio fee / OCF as a decimal (e.g. 0.0025 = 25 bps). Subtracted
   * from every year's real return before monthly conversion. Defaults to 0.
   */
  feeAnnual?: number;
  /**
   * Random number generator. If omitted, uses `mulberry32(1)` (deterministic
   * default — pass a seed to get reproducible runs).
   */
  rng?: Rng;
  /**
   * Historical data to bootstrap from. Defaults to the bundled UK series.
   * Override for testing or non-UK simulations.
   */
  history?: HistoricalRow[];
}

export interface BlockBootstrapResult {
  /** Real annual returns, one per simulated year (length = `years`). */
  annualReturns: number[];
  /** Real monthly returns, length = `years × 12`. */
  monthlyReturns: number[];
  /** The actual historical years that were sampled (in order, with repeats). */
  sampledYears: number[];
}

/**
 * Generate one bootstrapped path of real returns.
 */
export function blockBootstrap(opts: BlockBootstrapOptions): BlockBootstrapResult {
  const years = opts.years;
  if (!Number.isInteger(years) || years <= 0) {
    throw new Error('blockBootstrap: `years` must be a positive integer');
  }
  const equityWeight = opts.equityWeight ?? 0.6;
  if (equityWeight < 0 || equityWeight > 1) {
    throw new Error('blockBootstrap: `equityWeight` must be in [0,1]');
  }
  const blockYears = opts.blockYears ?? 1;
  if (!Number.isInteger(blockYears) || blockYears <= 0) {
    throw new Error('blockBootstrap: `blockYears` must be a positive integer');
  }
  const feeAnnual = opts.feeAnnual ?? 0;
  const rng = opts.rng ?? mulberry32(1);
  const history = opts.history ?? HISTORICAL_RETURNS;
  if (history.length < blockYears) {
    throw new Error('blockBootstrap: `history` shorter than `blockYears`');
  }

  // Number of independent block draws needed (last block may be truncated).
  const numBlocks = Math.ceil(years / blockYears);
  const annualReturns: number[] = [];
  const sampledYears: number[] = [];

  // Maximum starting index so that an entire block of `blockYears` fits.
  const maxStart = history.length - blockYears;
  // If `maxStart === 0`, we have exactly `blockYears` of history — every block
  // is the same, but the path still has the correct length.

  for (let b = 0; b < numBlocks; b++) {
    const start = randInt(rng, maxStart + 1);
    for (let i = 0; i < blockYears && annualReturns.length < years; i++) {
      const row = history[start + i]!;
      const realEquity = (1 + row.equity) / (1 + row.cpi) - 1;
      const realGilt = (1 + row.gilt) / (1 + row.cpi) - 1;
      const realPortfolio =
        equityWeight * realEquity + (1 - equityWeight) * realGilt - feeAnnual;
      annualReturns.push(realPortfolio);
      sampledYears.push(row.year);
    }
  }

  // Convert to monthly returns assuming uniform compounding within the year.
  const monthlyReturns: number[] = new Array(years * 12);
  for (let y = 0; y < years; y++) {
    const r = annualReturns[y]!;
    // Real monthly return r_m solves (1+r_m)^12 = 1+r_annual (allow r_annual<-1).
    const m = Math.pow(1 + r, 1 / 12) - 1;
    for (let i = 0; i < 12; i++) {
      monthlyReturns[y * 12 + i] = m;
    }
  }

  return { annualReturns, monthlyReturns, sampledYears };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers — summary statistics                                              */
/* ────────────────────────────────────────────────────────────────────────── */

/** Arithmetic mean of a numeric array. */
export function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

/** Sample standard deviation (n-1 denominator). */
export function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  let s = 0;
  for (const x of xs) s += (x - m) * (x - m);
  return Math.sqrt(s / (xs.length - 1));
}

/**
 * Geometric mean of a series of (1+r) returns, returned in r form.
 * Avoids underflow by summing logs.
 */
export function geometricMean(xs: number[]): number {
  if (xs.length === 0) return 0;
  let logSum = 0;
  for (const x of xs) {
    if (1 + x <= 0) {
      // A -100% return crushes the geometric mean — return -1.
      return -1;
    }
    logSum += Math.log(1 + x);
  }
  return Math.exp(logSum / xs.length) - 1;
}

/**
 * Sort-based percentile (linear-interpolation, type-7 in R nomenclature).
 * @param p — percentile in [0, 1].
 */
export function percentile(xs: number[], p: number): number {
  if (xs.length === 0) return 0;
  if (p <= 0) return Math.min(...xs);
  if (p >= 1) return Math.max(...xs);
  const sorted = [...xs].sort((a, b) => a - b);
  const idx = p * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo);
}

/**
 * Summary statistics for the historical series itself (in **real** terms for
 * a chosen mix). Useful for the page's "What this dataset looks like" panel.
 */
export function historicalSummary(
  equityWeight: number = 0.6,
  feeAnnual: number = 0,
  history: HistoricalRow[] = HISTORICAL_RETURNS,
): {
  arithmeticMean: number;
  geometricMean: number;
  stdev: number;
  minReturn: number;
  maxReturn: number;
  yearsCovered: number;
} {
  const realReturns = history.map(row => {
    const re = (1 + row.equity) / (1 + row.cpi) - 1;
    const rg = (1 + row.gilt) / (1 + row.cpi) - 1;
    return equityWeight * re + (1 - equityWeight) * rg - feeAnnual;
  });
  return {
    arithmeticMean: mean(realReturns),
    geometricMean: geometricMean(realReturns),
    stdev: stdev(realReturns),
    minReturn: Math.min(...realReturns),
    maxReturn: Math.max(...realReturns),
    yearsCovered: history.length,
  };
}
