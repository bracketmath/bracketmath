/**
 * Unit tests for dividend.ts — 2026/27 dividend tax.
 *
 *  Dividend allowance: £500 at 0% (consumes basic-rate band space)
 *  Basic 8.75% : £12,570 → £50,270
 *  Higher 33.75%: £50,270 → £125,140
 *  Additional 39.35%: £125,140+
 *
 *  Dividends always stack on top of non-dividend income.
 */

import { describe, it, expect } from 'vitest';
import { dividendTax } from '../tax/dividend';

describe('dividendTax — boundary cases', () => {
  it('zero dividend → zero tax', () => {
    expect(dividendTax(0, 0).tax).toBe(0);
    expect(dividendTax(0, 50_000).tax).toBe(0);
  });

  it('£500 dividend, no other income → £0 (covered by PA)', () => {
    // Whole £500 sits in PA (0% covered by Personal Allowance).
    const r = dividendTax(500, 0);
    expect(r.tax).toBe(0);
  });

  it('£10,000 dividend, no other income → £0 (still inside PA)', () => {
    // Total income £10,000 < £12,570, all covered by PA.
    expect(dividendTax(10_000, 0).tax).toBe(0);
  });
});

describe('dividendTax — basic rate band', () => {
  it('£10,000 dividend, £12,570 salary → (10k - 500) × 8.75% = £831.25', () => {
    const r = dividendTax(10_000, 12_570);
    expect(r.tax).toBeCloseTo(831.25, 2);
    expect(r.marginalRate).toBeCloseTo(0.0875, 4);
  });

  it('£5,000 dividend, £12,570 salary, allowance only → £393.75', () => {
    // £500 allowance + £4,500 × 8.75% = £393.75
    const r = dividendTax(5_000, 12_570);
    expect(r.tax).toBeCloseTo(393.75, 2);
  });
});

describe('dividendTax — higher rate band stack', () => {
  it('£40,000 dividend, £12,570 salary → straddles basic & higher', () => {
    // 12,570 cursor. Basic band space = 37,700.
    // First £500 at 0% (allowance), £37,200 at 8.75% = £3,255.
    // Remaining £2,300 at 33.75% = £776.25.
    // Total: £4,031.25
    const r = dividendTax(40_000, 12_570);
    expect(r.tax).toBeCloseTo(4_031.25, 2);
    expect(r.marginalRate).toBeCloseTo(0.3375, 4);
  });

  it('£100,000 dividend, no salary → tax stacks correctly', () => {
    // Total income £100,000, PA = £12,570 (just at threshold).
    // Slice 1: 0-12,570 inside PA → £0 tax.
    // Slice 2: 12,570-50,270 = £37,700; allowance £500 → £37,200 × 8.75% = £3,255.
    // Slice 3: 50,270-100,000 = £49,730 × 33.75% = £16,783.875.
    // Total: £20,038.875
    const r = dividendTax(100_000, 0);
    expect(r.tax).toBeCloseTo(20_038.875, 1);
  });
});

describe('dividendTax — additional rate band', () => {
  it('£200,000 dividend, no salary → PA fully eroded', () => {
    // Total = 200k, PA = 0.
    // 0-50,270: allowance £500 + £49,770 × 8.75% = £4,354.875
    // 50,270-125,140: £74,870 × 33.75% = £25,268.625
    // 125,140-200,000: £74,860 × 39.35% = £29,457.41
    // Total: £59,080.91
    const r = dividendTax(200_000, 0);
    expect(r.tax).toBeCloseTo(59_080.91, 0);
    expect(r.marginalRate).toBeCloseTo(0.3935, 4);
  });
});

describe('dividendTax — breakdown & rates', () => {
  it('returns slice breakdown summing to total tax', () => {
    const r = dividendTax(60_000, 20_000);
    const summed = r.breakdown.reduce((s, b) => s + b.tax, 0);
    expect(summed).toBeCloseTo(r.tax, 2);
  });

  it('effective rate is tax / dividend', () => {
    const r = dividendTax(40_000, 12_570);
    expect(r.effectiveRate).toBeCloseTo(r.tax / 40_000, 6);
  });

  it('allowance shifts to the highest taxed band when dividend straddles PA', () => {
    // £20,000 dividend, no other income: first £12,570 in PA, then £7,430 in basic.
    // Allowance of £500 should only apply to the basic-rate slice.
    const r = dividendTax(20_000, 0);
    // 7,430 - 500 = 6,930 × 8.75% = £606.375
    expect(r.tax).toBeCloseTo(606.375, 2);
  });
});
