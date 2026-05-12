/**
 * Unit tests for income-tax.ts — 2026/27 rUK bands.
 *
 * Expected values computed by hand from HMRC published rates:
 *   PA           £12,570 (tapered above £100,000)
 *   Basic 20%    £12,570 → £50,270
 *   Higher 40%   £50,270 → £125,140
 *   Additional 45% £125,140 → ∞
 */

import { describe, it, expect } from 'vitest';
import { incomeTax, effectivePersonalAllowance } from '../tax/income-tax';

describe('effectivePersonalAllowance', () => {
  it('returns full £12,570 below the £100k taper threshold', () => {
    expect(effectivePersonalAllowance(0)).toBe(12_570);
    expect(effectivePersonalAllowance(50_000)).toBe(12_570);
    expect(effectivePersonalAllowance(100_000)).toBe(12_570);
  });

  it('tapers £1 of PA for every £2 over £100k', () => {
    expect(effectivePersonalAllowance(100_100)).toBe(12_520); // -£50
    expect(effectivePersonalAllowance(110_000)).toBe(7_570);  // -£5,000
    expect(effectivePersonalAllowance(120_000)).toBe(2_570);  // -£10,000
  });

  it('hits exactly zero at £125,140', () => {
    expect(effectivePersonalAllowance(125_140)).toBe(0);
  });

  it('stays at zero above £125,140', () => {
    expect(effectivePersonalAllowance(150_000)).toBe(0);
    expect(effectivePersonalAllowance(1_000_000)).toBe(0);
  });
});

describe('incomeTax — boundary cases', () => {
  it('zero income → zero tax', () => {
    const r = incomeTax(0);
    expect(r.tax).toBe(0);
    expect(r.taxableAfterPA).toBe(0);
  });

  it('income below PA → zero tax', () => {
    const r = incomeTax(10_000);
    expect(r.tax).toBe(0);
    expect(r.effectivePA).toBe(12_570);
  });

  it('income exactly at PA → zero tax', () => {
    const r = incomeTax(12_570);
    expect(r.tax).toBe(0);
  });

  it('opts.exempt → zero tax regardless of income', () => {
    const r = incomeTax(50_000, { exempt: true });
    expect(r.tax).toBe(0);
  });
});

describe('incomeTax — basic rate band', () => {
  it('£20,000 → (20,000 - 12,570) × 20% = £1,486', () => {
    const r = incomeTax(20_000);
    expect(r.tax).toBeCloseTo(1_486, 2);
    expect(r.marginalRate).toBe(0.20);
  });

  it('£50,270 → full basic band used → £7,540', () => {
    const r = incomeTax(50_270);
    expect(r.tax).toBeCloseTo(7_540, 2);
  });
});

describe('incomeTax — higher rate band', () => {
  it('£60,000 → £7,540 + £3,892 = £11,432', () => {
    const r = incomeTax(60_000);
    expect(r.tax).toBeCloseTo(11_432, 2);
    expect(r.marginalRate).toBe(0.40);
  });

  it('£100,000 → £27,432 (just below taper)', () => {
    const r = incomeTax(100_000);
    expect(r.tax).toBeCloseTo(27_432, 2);
    expect(r.effectivePA).toBe(12_570);
  });
});

describe('incomeTax — PA taper window (£100k – £125,140)', () => {
  it('£110,000 → PA tapers to £7,570, tax = £32,432', () => {
    const r = incomeTax(110_000);
    expect(r.effectivePA).toBe(7_570);
    // basic: (50,270 - 7,570) × 0.20 = £8,540
    // higher: (110,000 - 50,270) × 0.40 = £23,892
    // total = £32,432
    expect(r.tax).toBeCloseTo(32_432, 2);
    // 60% marginal rate in this band — that's the headline cliff
    expect(r.marginalRate).toBe(0.60);
  });

  it('£125,140 → PA fully eroded, tax = £40,002', () => {
    const r = incomeTax(125_140);
    expect(r.effectivePA).toBe(0);
    expect(r.tax).toBeCloseTo(40_002, 2);
  });
});

describe('incomeTax — additional rate band', () => {
  it('£150,000 → £51,189', () => {
    const r = incomeTax(150_000);
    // PA = 0. Basic 50,270 × 20% = 10,054. Higher (125,140-50,270) × 40% = 29,948.
    // Additional (150,000-125,140) × 45% = 11,187. Total 51,189.
    expect(r.tax).toBeCloseTo(51_189, 2);
    expect(r.marginalRate).toBe(0.45);
  });

  it('£1,000,000 → £433,689', () => {
    const r = incomeTax(1_000_000);
    expect(r.tax).toBeCloseTo(433_689, 2);
  });
});

describe('incomeTax — additionalIncomeForPA (joint PA taper)', () => {
  it('small salary + big dividend correctly tapers PA on the salary', () => {
    // Salary £12,570, dividend £96,576 → total £109,146.
    // Excess over £100k = £9,146. PA reduction = £9,146 / 2 = £4,573.
    // Effective PA = £12,570 - £4,573 = £7,997.
    // Salary tax: (£12,570 - £7,997) × 20% = £914.60.
    const r = incomeTax(12_570, { additionalIncomeForPA: 96_576 });
    expect(r.effectivePA).toBeCloseTo(7_997, 0);
    expect(r.tax).toBeCloseTo(914.60, 1);
  });

  it('no additional income → identical to bare call', () => {
    const a = incomeTax(50_000);
    const b = incomeTax(50_000, { additionalIncomeForPA: 0 });
    expect(a.tax).toBe(b.tax);
  });

  it('dividend pushes total over £125,140 → PA = 0 for salary', () => {
    const r = incomeTax(50_270, { additionalIncomeForPA: 100_000 });
    expect(r.effectivePA).toBe(0);
    // 50,270 at 20% = £10,054
    expect(r.tax).toBeCloseTo(10_054, 2);
  });
});

describe('incomeTax — breakdown structure', () => {
  it('returns one slice per band actually used', () => {
    const r = incomeTax(60_000);
    // PA slice (0%), basic (20%), higher (40%)
    expect(r.breakdown.length).toBe(3);
    expect(r.breakdown[0]!.rate).toBe(0);
    expect(r.breakdown[1]!.rate).toBe(0.20);
    expect(r.breakdown[2]!.rate).toBe(0.40);
  });

  it('breakdown amounts sum to taxableIncome', () => {
    const r = incomeTax(75_000);
    const summed = r.breakdown.reduce((s, b) => s + b.amount, 0);
    expect(summed).toBeCloseTo(75_000, 2);
  });

  it('breakdown tax values sum to total tax', () => {
    const r = incomeTax(75_000);
    const summed = r.breakdown.reduce((s, b) => s + b.tax, 0);
    expect(summed).toBeCloseTo(r.tax, 2);
  });
});

describe('incomeTax — averageRate & marginalRate', () => {
  it('average rate is total tax / income', () => {
    const r = incomeTax(50_000);
    expect(r.averageRate).toBeCloseTo(r.tax / 50_000, 6);
  });

  it('marginal rate matches the top band used', () => {
    expect(incomeTax(30_000).marginalRate).toBe(0.20);
    expect(incomeTax(80_000).marginalRate).toBe(0.40);
    expect(incomeTax(200_000).marginalRate).toBe(0.45);
  });
});
