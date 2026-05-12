/**
 * UK Income Tax — 2026/27 (rUK: England, Wales, NI)
 *
 * Computes income tax on a single year of taxable income, correctly
 * handling the £100k Personal Allowance taper (loses £1 of PA for every
 * £2 above £100,000, fully eroded at £125,140) and the four bands.
 *
 * Scotland has different bands; that is a separate function added later.
 *
 * Returns a structured breakdown so the UI can render the "money on each band"
 * waterfall visualisation without re-doing the maths.
 *
 * Maths intuition
 * ───────────────
 * Effective PA at income I:
 *   if I ≤ 100,000:               PA = 12,570
 *   if 100,000 < I < 125,140:     PA = 12,570 − (I − 100,000) / 2
 *   if I ≥ 125,140:               PA = 0
 *
 * This produces an effective 60% marginal rate in the £100k–£125,140 band
 * (40% income tax on the £1 earned + 40% × £0.50 of PA reclaim).
 *
 * Sources: HMRC rates & allowances 2026/27.
 */

import { INCOME_TAX } from './constants';

export interface IncomeTaxBandSlice {
  /** Band label, e.g. "Basic Rate". */
  label: string;
  /** Marginal rate applied to this slice (e.g. 0.20). */
  rate: number;
  /** Lower bound of the slice on the income axis (post-PA). */
  from: number;
  /** Upper bound of the slice on the income axis (post-PA). */
  to: number;
  /** £ amount of taxable income that fell into this slice. */
  amount: number;
  /** £ tax paid on this slice = amount × rate. */
  tax: number;
}

export interface IncomeTaxResult {
  /** Total income tax due. */
  tax: number;
  /** Effective Personal Allowance after the £100k taper. */
  effectivePA: number;
  /** Taxable income after PA (the amount that actually hits the bands). */
  taxableAfterPA: number;
  /** Per-band breakdown — useful for charts & explainers. */
  breakdown: IncomeTaxBandSlice[];
  /** Overall average rate vs gross income (0 if income is 0). */
  averageRate: number;
  /** Marginal rate that applies to the *next* £1 of income. */
  marginalRate: number;
}

export interface IncomeTaxOptions {
  /**
   * If true, return zero tax (used when caller wants to model "no income tax"
   * cases like ISA withdrawals while keeping a uniform call shape).
   */
  exempt?: boolean;
  /**
   * Extra income that should be counted toward the Personal Allowance taper
   * but is NOT being taxed by this call (e.g. dividend income, which is taxed
   * separately by dividend.ts). Defaults to 0.
   *
   * Why this matters
   * ────────────────
   * The PA taper is based on *adjusted net income*, which includes dividends.
   * If you call incomeTax(£12,570 salary) in isolation, you'd get PA = £12,570
   * and zero tax. But if the user also has £90k of dividend income, their
   * total income is £102.5k → PA actually tapers to ~£11,250 → there IS
   * income tax on part of the salary. Pass `additionalIncomeForPA: 90_000`
   * to compute that correctly.
   */
  additionalIncomeForPA?: number;
}


/**
 * Compute the effective Personal Allowance for a given total taxable income
 * after applying the £100k taper.
 */
export function effectivePersonalAllowance(taxableIncome: number): number {
  const { personalAllowance, paTaperThreshold, paFullyTaperedAt } = INCOME_TAX;
  if (taxableIncome <= paTaperThreshold) return personalAllowance;
  if (taxableIncome >= paFullyTaperedAt) return 0;
  const reduction = (taxableIncome - paTaperThreshold) / 2;
  return Math.max(0, personalAllowance - reduction);
}

/**
 * Compute UK income tax (rUK) on a given taxable income.
 *
 * @param taxableIncome — gross taxable income for the year (£).
 *   This should be income that is in scope for income tax: salary, pension drawdown,
 *   rental profit, interest, *non-dividend* income. Dividends are handled separately
 *   by dividend.ts (which stacks on top of this).
 */
export function incomeTax(
  taxableIncome: number,
  opts: IncomeTaxOptions = {},
): IncomeTaxResult {
  const additionalForPA = opts.additionalIncomeForPA ?? 0;

  if (opts.exempt || taxableIncome <= 0) {
    return {
      tax: 0,
      effectivePA: effectivePersonalAllowance(additionalForPA),
      taxableAfterPA: 0,
      breakdown: [],
      averageRate: 0,
      marginalRate: 0,
    };
  }

  const pa = effectivePersonalAllowance(taxableIncome + additionalForPA);

  // Build effective bands by shifting the basic-rate floor by (PA - 12570).
  // Equivalent representation: subtract `pa` from the income to get a
  // "taxable above PA" amount, then walk the standard bands above 12,570.
  // We do it band-by-band so the breakdown is rich for visualisation.

  // Standard rUK band edges *measured on the income axis* are:
  //   0 — pa                      → 0%   (the PA itself)
  //   pa — 50,270                 → 20%
  //   50,270 — 125,140            → 40%
  //   125,140 — ∞                 → 45%
  //
  // When PA is tapered below £12,570, the basic-rate band starts earlier
  // (at the new, smaller PA) but its *top* stays at £50,270.
  // (This is HMRC's behaviour: the basic-rate band is measured upward from
  // PA, and its upper edge is fixed. See HMRC's worked examples for £100k+ earners.)
  const edges: Array<{ to: number; rate: number; label: string }> = [
    { to: pa,                  rate: 0,    label: 'Personal Allowance' },
    { to: 50_270,              rate: 0.20, label: 'Basic Rate' },
    { to: 125_140,             rate: 0.40, label: 'Higher Rate' },
    { to: Infinity,            rate: 0.45, label: 'Additional Rate' },
  ];

  const breakdown: IncomeTaxBandSlice[] = [];
  let cursor = 0;
  let totalTax = 0;

  for (const edge of edges) {
    if (cursor >= taxableIncome) break;
    const top = Math.min(edge.to, taxableIncome);
    if (top <= cursor) continue;
    const amount = top - cursor;
    const tax = amount * edge.rate;
    breakdown.push({
      label: edge.label,
      rate: edge.rate,
      from: cursor,
      to: top,
      amount,
      tax,
    });
    totalTax += tax;
    cursor = top;
  }

  // The marginal rate at this income is the rate of the last band the income falls into,
  // BUT in the £100,000–£125,140 PA taper window the effective marginal rate is 60%
  // (40% tax + 40% on £0.50 lost PA per £1 earned).
  const lastRate = breakdown.length > 0 ? breakdown[breakdown.length - 1]!.rate : 0;
  let marginalRate = lastRate;
  if (
    taxableIncome > INCOME_TAX.paTaperThreshold &&
    taxableIncome < INCOME_TAX.paFullyTaperedAt
  ) {
    marginalRate = 0.60; // 40% + 20% from the lost PA × 40% / 2 (per £1)
  }

  return {
    tax: totalTax,
    effectivePA: pa,
    taxableAfterPA: Math.max(0, taxableIncome - pa),
    breakdown,
    averageRate: taxableIncome > 0 ? totalTax / taxableIncome : 0,
    marginalRate,
  };
}
