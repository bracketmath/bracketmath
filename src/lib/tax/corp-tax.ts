/**
 * UK Corporation Tax — FY2026 (the rate structure introduced in April 2023
 * and unchanged for FY2024, FY2025, FY2026 per Autumn 2025 budget).
 *
 * Two rates with a marginal-relief band:
 *   • Small Profits Rate  : 19% on taxable profits ≤ £50,000
 *   • Main Rate           : 25% on taxable profits ≥ £250,000
 *   • Marginal Relief     : in between, effective marginal rate is 26.5%
 *
 * The HMRC marginal relief formula is:
 *   MR = (U − A) × N/A × 3/200
 *   where:
 *     A = augmented profits (profits + exempt distributions; for a vanilla
 *         single-company case A = taxable profits)
 *     N = taxable total profits
 *     U = upper limit (£250,000)
 *
 * If A == N (no exempt distributions), this collapses to:
 *   MR = (250,000 − P) × 3/200
 *   CT  = P × 25% − MR
 *
 * Associated companies and short accounting periods scale the £50k/£250k
 * limits down proportionally:
 *   adjusted_limit = limit × (months / 12) / (1 + associatedCompanies)
 *
 * Sources: HMRC CTM03900, Finance Act 2021 s.7, FY2023+ rate schedule.
 */

import { CORPORATION_TAX } from './constants';

export interface CorporationTaxResult {
  /** Total CT due. */
  tax: number;
  /** Effective overall rate (tax / profits). */
  effectiveRate: number;
  /** Marginal rate on the *next* £1 of profit. */
  marginalRate: number;
  /** Which regime the profit sat in. */
  regime: 'small' | 'marginal' | 'main' | 'zero';
  /** Marginal relief amount (if applicable). */
  marginalRelief: number;
  /** Adjusted thresholds after associated-company / short-period scaling. */
  adjustedSmallProfitsLimit: number;
  adjustedMainRateThreshold: number;
}

export interface CorporationTaxOptions {
  /**
   * Number of *additional* associated companies (i.e. other companies under
   * common control). The CT thresholds are divided by (1 + associatedCompanies).
   * Defaults to 0.
   */
  associatedCompanies?: number;
  /**
   * Length of the accounting period in months (used for short / long periods).
   * Defaults to 12.
   */
  monthsInPeriod?: number;
}

/**
 * Compute UK Corporation Tax for a single accounting period.
 *
 * @param profits — taxable total profits (£).
 */
export function corporationTax(
  profits: number,
  opts: CorporationTaxOptions = {},
): CorporationTaxResult {
  const {
    smallProfitsRate,
    smallProfitsLimit,
    mainRate,
    mainRateThreshold,
    marginalReliefFraction,
    effectiveMarginalRate,
  } = CORPORATION_TAX;

  const associatedCompanies = opts.associatedCompanies ?? 0;
  const monthsInPeriod = opts.monthsInPeriod ?? 12;

  const scale = (monthsInPeriod / 12) / (1 + associatedCompanies);
  const adjustedSmallProfitsLimit = smallProfitsLimit * scale;
  const adjustedMainRateThreshold = mainRateThreshold * scale;

  if (profits <= 0) {
    return {
      tax: 0,
      effectiveRate: 0,
      marginalRate: smallProfitsRate,
      regime: 'zero',
      marginalRelief: 0,
      adjustedSmallProfitsLimit,
      adjustedMainRateThreshold,
    };
  }

  if (profits <= adjustedSmallProfitsLimit) {
    const tax = profits * smallProfitsRate;
    return {
      tax,
      effectiveRate: tax / profits,
      marginalRate: smallProfitsRate,
      regime: 'small',
      marginalRelief: 0,
      adjustedSmallProfitsLimit,
      adjustedMainRateThreshold,
    };
  }

  if (profits >= adjustedMainRateThreshold) {
    // Compute as main rate, but HMRC's worked path applies MR formula too.
    // At exactly the upper limit the relief is zero, so it's consistent.
    const tax = profits * mainRate;
    return {
      tax,
      effectiveRate: tax / profits,
      marginalRate: mainRate,
      regime: 'main',
      marginalRelief: 0,
      adjustedSmallProfitsLimit,
      adjustedMainRateThreshold,
    };
  }

  // Marginal relief band.
  // For a vanilla single company (A = N), MR = (U − P) × 3/200.
  const grossAtMainRate = profits * mainRate;
  const marginalRelief = (adjustedMainRateThreshold - profits) * marginalReliefFraction;
  const tax = grossAtMainRate - marginalRelief;

  return {
    tax,
    effectiveRate: tax / profits,
    marginalRate: effectiveMarginalRate,
    regime: 'marginal',
    marginalRelief,
    adjustedSmallProfitsLimit,
    adjustedMainRateThreshold,
  };
}
