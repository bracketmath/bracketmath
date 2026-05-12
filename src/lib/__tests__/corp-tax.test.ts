/**
 * Unit tests for corp-tax.ts — FY2026.
 *
 *  Small profits rate (≤£50,000)         : 19%
 *  Main rate (≥£250,000)                  : 25%
 *  Marginal-relief band (£50k–£250k)     : effective 26.5%
 *  Marginal relief = (250,000 - P) × 3/200
 */

import { describe, it, expect } from 'vitest';
import { corporationTax } from '../tax/corp-tax';

describe('corporationTax — boundary cases', () => {
  it('zero profits → zero tax', () => {
    expect(corporationTax(0).tax).toBe(0);
    expect(corporationTax(0).regime).toBe('zero');
  });

  it('£1,000 profits → small profits rate', () => {
    const r = corporationTax(1_000);
    expect(r.tax).toBeCloseTo(190, 2);
    expect(r.regime).toBe('small');
  });

  it('exactly £50,000 → still small profits rate', () => {
    const r = corporationTax(50_000);
    expect(r.tax).toBeCloseTo(9_500, 2);
    expect(r.regime).toBe('small');
    expect(r.marginalRelief).toBe(0);
  });
});

describe('corporationTax — marginal relief band', () => {
  it('£50,001 profits → enters marginal band (CT effectively still ~19%)', () => {
    const r = corporationTax(50_001);
    expect(r.regime).toBe('marginal');
    // 50,001 × 25% - (250,000 - 50,001) × 3/200
    // = 12,500.25 - 2,999.985 = 9,500.265
    expect(r.tax).toBeCloseTo(9_500.265, 2);
    expect(r.marginalRate).toBeCloseTo(0.265, 4);
  });

  it('£140,000 profits → £33,350 tax', () => {
    const r = corporationTax(140_000);
    // 140,000 × 25% = 35,000
    // MR = (250,000 - 140,000) × 0.015 = 1,650
    // CT = 33,350
    expect(r.tax).toBeCloseTo(33_350, 2);
    expect(r.regime).toBe('marginal');
  });

  it('£200,000 profits → £49,250 tax', () => {
    const r = corporationTax(200_000);
    expect(r.tax).toBeCloseTo(49_250, 2);
  });

  it('marginal relief is non-negative across the whole band', () => {
    for (const p of [60_000, 100_000, 150_000, 200_000, 249_000]) {
      expect(corporationTax(p).marginalRelief).toBeGreaterThan(0);
    }
  });
});

describe('corporationTax — main rate band', () => {
  it('exactly £250,000 → 25% flat', () => {
    const r = corporationTax(250_000);
    expect(r.tax).toBeCloseTo(62_500, 2);
    expect(r.regime).toBe('main');
  });

  it('£500,000 → £125,000', () => {
    const r = corporationTax(500_000);
    expect(r.tax).toBeCloseTo(125_000, 2);
  });

  it('£1,000,000 → £250,000', () => {
    const r = corporationTax(1_000_000);
    expect(r.tax).toBeCloseTo(250_000, 2);
  });
});

describe('corporationTax — associated companies & short periods', () => {
  it('2 associated companies divides thresholds by 3', () => {
    const r = corporationTax(20_000, { associatedCompanies: 2 });
    // Adjusted small-profits limit = 50,000 / 3 ≈ 16,667. So £20,000 is in marginal band.
    expect(r.regime).toBe('marginal');
    expect(r.adjustedSmallProfitsLimit).toBeCloseTo(50_000 / 3, 2);
    expect(r.adjustedMainRateThreshold).toBeCloseTo(250_000 / 3, 2);
  });

  it('6-month accounting period halves the thresholds', () => {
    const r = corporationTax(20_000, { monthsInPeriod: 6 });
    expect(r.adjustedSmallProfitsLimit).toBeCloseTo(25_000, 2);
    expect(r.adjustedMainRateThreshold).toBeCloseTo(125_000, 2);
  });

  it('combined: 1 associated company + 6 months', () => {
    const r = corporationTax(10_000, {
      associatedCompanies: 1,
      monthsInPeriod: 6,
    });
    expect(r.adjustedSmallProfitsLimit).toBeCloseTo(12_500, 2);
  });
});

describe('corporationTax — continuity', () => {
  it('CT is continuous across the £50k boundary', () => {
    const below = corporationTax(49_999);
    const above = corporationTax(50_001);
    expect(Math.abs(above.tax - below.tax)).toBeLessThan(5); // pennies apart
  });

  it('CT is continuous across the £250k boundary', () => {
    const below = corporationTax(249_999);
    const above = corporationTax(250_001);
    expect(Math.abs(above.tax - below.tax)).toBeLessThan(5);
  });
});
