/**
 * UK National Insurance — 2026/27
 *
 * Three regimes:
 *   1. Class 1 Employee NI (`niEmployee`)         — paid by employees on salary
 *   2. Class 1 Employer NI (`niEmployer`)         — paid by employer on staff wages
 *   3. Class 2/4 Self-employed NI (`niSelfEmployed`) — paid by sole traders on profits
 *
 * 2026/27 figures:
 *   Employee  : 0% up to £12,570, 8% £12,570–£50,270, 2% above £50,270
 *   Employer  : 0% up to £5,000, 15% above (Autumn 2024 budget hike)
 *   Class 2   : voluntarily £3.45 × 52 (£179.40/yr) — no longer compulsory
 *   Class 4   : 0% up to £12,570, 6% £12,570–£50,270, 2% above £50,270
 *
 * Employment Allowance
 * ─────────────────────
 * £10,500 reduction in the employer NI bill — but a single-director Ltd Co
 * with one employee (the director) is NOT eligible. The flag `claimEA`
 * defaults to false. Set it true only for genuinely multi-employee companies
 * where at least one non-director earns above the secondary threshold.
 */

import { NI_EMPLOYEE, NI_EMPLOYER, NI_SELF_EMPLOYED } from './constants';

export interface NIResult {
  /** Total NI due. */
  ni: number;
  /** £ on which NI was actually charged (across all positive-rate bands). */
  earningsCharged: number;
  /** Breakdown by band, for visualisation/explanation. */
  breakdown: Array<{
    label: string;
    rate: number;
    from: number;
    to: number;
    amount: number;
    ni: number;
  }>;
  /** Effective rate of NI on gross input. */
  averageRate: number;
  /** Marginal rate on the *next* £1. */
  marginalRate: number;
}

/** Class 1 employee NI on annual salary. */
export function niEmployee(salary: number): NIResult {
  if (salary <= 0) {
    return { ni: 0, earningsCharged: 0, breakdown: [], averageRate: 0, marginalRate: 0 };
  }
  const { primaryThreshold, upperEarningsLimit, mainRate, additionalRate } = NI_EMPLOYEE;
  const edges = [
    { to: primaryThreshold,    rate: 0,             label: 'Below Primary Threshold' },
    { to: upperEarningsLimit,  rate: mainRate,      label: 'Main NI band' },
    { to: Infinity,            rate: additionalRate, label: 'Upper earnings (additional)' },
  ];
  return walkBands(salary, edges);
}

export interface NIEmployerOptions {
  /**
   * Claim the £10,500 Employment Allowance against employer NI.
   * Defaults to false — single-director Ltd Cos are not eligible.
   */
  claimEA?: boolean;
  /**
   * If you're computing per-director NI and want the EA shared across multiple
   * employees, this lets the caller pre-allocate.  Most callers ignore this.
   */
  remainingEA?: number;
}

/** Class 1 employer NI on annual salary paid to one employee. */
export function niEmployer(salary: number, opts: NIEmployerOptions = {}): NIResult {
  if (salary <= 0) {
    return { ni: 0, earningsCharged: 0, breakdown: [], averageRate: 0, marginalRate: 0 };
  }
  const { secondaryThreshold, rate, employmentAllowance } = NI_EMPLOYER;
  const edges = [
    { to: secondaryThreshold, rate: 0,    label: 'Below Secondary Threshold' },
    { to: Infinity,           rate,       label: 'Employer NI' },
  ];
  const base = walkBands(salary, edges);

  if (!opts.claimEA) return base;

  // Apply EA reduction — capped at the actual NI bill and at the EA cap (£10,500).
  const eaAvailable = opts.remainingEA ?? employmentAllowance;
  const reduction = Math.min(base.ni, eaAvailable);
  const ni = base.ni - reduction;

  return {
    ...base,
    ni,
    averageRate: salary > 0 ? ni / salary : 0,
    // Marginal rate unchanged: EA is a fixed reduction, not a rate change.
  };
}

export interface NISelfEmployedResult extends NIResult {
  /** Class 4 NI on profits. */
  class4: number;
  /** Voluntary Class 2 if elected. */
  class2: number;
}

export interface NISelfEmployedOptions {
  /** Pay voluntary Class 2 to preserve state-pension qualifying year? */
  voluntaryClass2?: boolean;
}

/** Class 4 (+ optional Class 2) on self-employed profits. */
export function niSelfEmployed(
  profits: number,
  opts: NISelfEmployedOptions = {},
): NISelfEmployedResult {
  const { class4: c4, class2Voluntary } = NI_SELF_EMPLOYED;
  if (profits <= 0) {
    const class2 = opts.voluntaryClass2 ? class2Voluntary : 0;
    return {
      ni: class2,
      class2,
      class4: 0,
      earningsCharged: 0,
      breakdown: [],
      averageRate: 0,
      marginalRate: 0,
    };
  }

  const edges = [
    { to: c4.lowerProfitsLimit, rate: 0,                 label: 'Below LPL' },
    { to: c4.upperProfitsLimit, rate: c4.mainRate,       label: 'Class 4 main band' },
    { to: Infinity,             rate: c4.additionalRate, label: 'Class 4 upper band' },
  ];
  const base = walkBands(profits, edges);
  const class2 = opts.voluntaryClass2 ? class2Voluntary : 0;
  return {
    ...base,
    ni: base.ni + class2,
    class4: base.ni,
    class2,
    averageRate: profits > 0 ? (base.ni + class2) / profits : 0,
  };
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                  */
/* ──────────────────────────────────────────────────────────────────────── */

function walkBands(
  amount: number,
  edges: Array<{ to: number; rate: number; label: string }>,
): NIResult {
  const breakdown: NIResult['breakdown'] = [];
  let cursor = 0;
  let totalNI = 0;
  let earningsCharged = 0;
  let lastRate = 0;

  for (const edge of edges) {
    if (cursor >= amount) break;
    const top = Math.min(edge.to, amount);
    if (top <= cursor) continue;
    const slice = top - cursor;
    const ni = slice * edge.rate;
    breakdown.push({
      label: edge.label,
      rate: edge.rate,
      from: cursor,
      to: top,
      amount: slice,
      ni,
    });
    totalNI += ni;
    if (edge.rate > 0) earningsCharged += slice;
    if (top >= amount) lastRate = edge.rate;
    cursor = top;
  }
  return {
    ni: totalNI,
    earningsCharged,
    breakdown,
    averageRate: amount > 0 ? totalNI / amount : 0,
    marginalRate: lastRate,
  };
}
