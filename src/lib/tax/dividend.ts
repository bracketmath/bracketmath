/**
 * UK Dividend Tax — 2026/27
 *
 * Dividends are taxed at three rates that *stack on top of* non-dividend income:
 *   • Basic       8.75%   — slice that falls in basic rate band
 *   • Higher     33.75%   — slice in higher rate band
 *   • Additional 39.35%   — slice in additional rate band
 *
 * Plus:
 *   • £500 Dividend Allowance — first £500 of dividend income is at 0% (but it
 *     still uses up basic-rate band, which matters for stacking).
 *   • Personal Allowance — if non-dividend income hasn't used the full PA,
 *     the remainder applies to dividends.
 *
 * Stacking order
 * ──────────────
 * HMRC stacks income in this order: non-savings → savings → dividends.
 * So dividends are always the *top slice* of total income.
 *
 * That means the bands available to dividends are whatever's left of
 * (PA, basic, higher, additional) after non-dividend income has filled them.
 *
 * Sources: ITTOIA 2005 s.13, HMRC CG/IT manuals.
 */

import { DIVIDEND_TAX, INCOME_TAX } from './constants';
import { effectivePersonalAllowance } from './income-tax';

export interface DividendTaxResult {
  /** Total dividend tax due. */
  tax: number;
  /** Effective rate of tax on the gross dividend. */
  effectiveRate: number;
  /** Marginal dividend tax rate on the *next* £1 of dividend. */
  marginalRate: number;
  /** Slice-by-slice breakdown for visualisation. */
  breakdown: Array<{
    label: string;
    rate: number;
    amount: number;
    tax: number;
  }>;
}

/**
 * Compute tax on dividend income that stacks on top of non-dividend income.
 *
 * @param dividend     — gross dividend income (£).
 * @param otherIncome  — all *non-dividend* taxable income (salary, rental, pension,
 *                       savings interest, etc) for the same tax year.
 */
export function dividendTax(
  dividend: number,
  otherIncome: number,
): DividendTaxResult {
  if (dividend <= 0) {
    return { tax: 0, effectiveRate: 0, marginalRate: 0, breakdown: [] };
  }

  // Total taxable income drives PA tapering.
  const totalIncome = otherIncome + dividend;
  const pa = effectivePersonalAllowance(totalIncome);

  // Walk the bands measuring on the income axis.
  // Income stacks: other income occupies the bottom, dividends sit on top.
  const bandEdges = [
    { to: pa,         rate: 0 },
    { to: 50_270,     rate: DIVIDEND_TAX.rates.basic },
    { to: 125_140,    rate: DIVIDEND_TAX.rates.higher },
    { to: Infinity,   rate: DIVIDEND_TAX.rates.additional },
  ];

  // Apply the £500 dividend allowance. Per HMRC, the allowance is given at the
  // dividend slice's *marginal* band (it doesn't reduce the amount that uses up
  // the band — it's a notional 0% rate over the first £500 of dividends that
  // would otherwise be taxable). For modelling, we treat it as: the first £500
  // of dividends above PA is taxed at 0% but *still consumes band space*.
  // (This is the same behaviour as Personal Savings Allowance.)
  const allowance = DIVIDEND_TAX.allowance;

  // Compute slices.
  let cursor = Math.min(otherIncome, /* don't run off the bottom */ Infinity);
  let dividendRemaining = dividend;
  let allowanceRemaining = allowance;
  let totalTax = 0;
  const breakdown: DividendTaxResult['breakdown'] = [];
  let lastRate = 0;

  for (const edge of bandEdges) {
    if (dividendRemaining <= 0) break;
    if (cursor >= edge.to) continue;
    const spaceInBand = edge.to - cursor;
    const sliceForDividend = Math.min(spaceInBand, dividendRemaining);
    if (sliceForDividend <= 0) {
      cursor = edge.to;
      continue;
    }

    // Apply £500 allowance — but only against the band that's actually taxed.
    // (At PA-rate=0 there's nothing to apply to.)
    let amountAtRate = sliceForDividend;
    let amountAtAllowance = 0;
    if (edge.rate > 0 && allowanceRemaining > 0) {
      amountAtAllowance = Math.min(allowanceRemaining, sliceForDividend);
      amountAtRate = sliceForDividend - amountAtAllowance;
      allowanceRemaining -= amountAtAllowance;
    }

    if (amountAtAllowance > 0) {
      breakdown.push({
        label: 'Dividend Allowance (£500 @ 0%)',
        rate: 0,
        amount: amountAtAllowance,
        tax: 0,
      });
    }
    if (edge.rate === 0 && sliceForDividend > 0) {
      // Inside PA — dividend covered by Personal Allowance, not taxed.
      breakdown.push({
        label: 'Covered by Personal Allowance',
        rate: 0,
        amount: sliceForDividend,
        tax: 0,
      });
    }
    if (amountAtRate > 0 && edge.rate > 0) {
      const tax = amountAtRate * edge.rate;
      breakdown.push({
        label: rateLabel(edge.rate),
        rate: edge.rate,
        amount: amountAtRate,
        tax,
      });
      totalTax += tax;
    }

    lastRate = edge.rate;
    cursor += sliceForDividend;
    dividendRemaining -= sliceForDividend;
  }

  return {
    tax: totalTax,
    effectiveRate: dividend > 0 ? totalTax / dividend : 0,
    marginalRate: lastRate,
    breakdown,
  };
}

function rateLabel(rate: number): string {
  if (rate === DIVIDEND_TAX.rates.basic) return 'Dividends — Basic (8.75%)';
  if (rate === DIVIDEND_TAX.rates.higher) return 'Dividends — Higher (33.75%)';
  if (rate === DIVIDEND_TAX.rates.additional) return 'Dividends — Additional (39.35%)';
  if (rate === 0) return 'Dividends — 0%';
  return `Dividends — ${(rate * 100).toFixed(2)}%`;
}

// Silence unused-import warning for INCOME_TAX (kept for potential extension):
void INCOME_TAX;
