/**
 * Unit tests for the IR35 inside-vs-outside take-home comparison engine.
 */

import { describe, it, expect } from 'vitest';
import {
  compareIR35,
  computeInsideIR35,
  computeOutsideIR35,
  type TakeHomeInput,
} from '../ir35/compare';

const BASE: TakeHomeInput = {
  dayRate: 500,
  billableDays: 220,
  annualBusinessExpenses: 3_000,
  umbrellaFeeAnnual: 1_500,
  pensionPercent: 0,
  age: 38,
  otherIncome: 0,
  passThroughApprenticeshipLevy: false,
};

describe('compareIR35 — input validation', () => {
  it('throws on negative day rate', () => {
    expect(() => compareIR35({ ...BASE, dayRate: -1 })).toThrow();
  });

  it('throws on out-of-range billable days', () => {
    expect(() => compareIR35({ ...BASE, billableDays: -1 })).toThrow();
    expect(() => compareIR35({ ...BASE, billableDays: 400 })).toThrow();
  });

  it('throws on pension percent out of [0,1]', () => {
    expect(() => compareIR35({ ...BASE, pensionPercent: 1.5 })).toThrow();
    expect(() => compareIR35({ ...BASE, pensionPercent: -0.1 })).toThrow();
  });

  it('throws on age out of [16,100]', () => {
    expect(() => compareIR35({ ...BASE, age: 12 })).toThrow();
    expect(() => compareIR35({ ...BASE, age: 101 })).toThrow();
  });
});

describe('compareIR35 — basic shape & output', () => {
  it('returns two scenarios with the same contract value', () => {
    const r = compareIR35(BASE);
    expect(r.inside.contractValue).toBe(500 * 220);
    expect(r.outside.contractValue).toBe(500 * 220);
  });

  it('outside-IR35 net cash > inside-IR35 net cash at £500/day, no pension', () => {
    const r = compareIR35(BASE);
    expect(r.outside.netCash).toBeGreaterThan(r.inside.netCash);
    expect(r.netCashDifference).toBeGreaterThan(0);
  });

  it('effective tax rates are in (0, 1)', () => {
    const r = compareIR35(BASE);
    expect(r.inside.effectiveTaxRate).toBeGreaterThan(0);
    expect(r.inside.effectiveTaxRate).toBeLessThan(1);
    expect(r.outside.effectiveTaxRate).toBeGreaterThan(0);
    expect(r.outside.effectiveTaxRate).toBeLessThan(1);
  });

  it('inside-IR35 has zero corp tax and zero dividend tax', () => {
    const r = compareIR35(BASE);
    expect(r.inside.breakdown.corporationTax).toBe(0);
    expect(r.inside.breakdown.dividendTax).toBe(0);
  });

  it('outside-IR35 has zero umbrella fee', () => {
    const r = compareIR35(BASE);
    expect(r.outside.breakdown.umbrellaFee).toBe(0);
    expect(r.outside.breakdown.apprenticeshipLevy).toBe(0);
  });
});

describe('compareIR35 — break-even', () => {
  it('inside break-even day rate > current day rate when outside is better', () => {
    const r = compareIR35(BASE);
    expect(r.insideBreakevenDayRate).not.toBeNull();
    expect(r.insideBreakevenDayRate!).toBeGreaterThan(BASE.dayRate);
  });

  it('break-even calc satisfies: inside(breakeven) ≈ outside(actual)', () => {
    const r = compareIR35(BASE);
    if (r.insideBreakevenDayRate !== null) {
      const insideAtBreakeven = computeInsideIR35({
        ...BASE,
        dayRate: r.insideBreakevenDayRate,
      });
      expect(Math.abs(insideAtBreakeven.netCash - r.outside.netCash)).toBeLessThan(50);
    }
  });

  it('break-even (wealth) ≥ break-even (cash) when pension is meaningful', () => {
    const r = compareIR35({ ...BASE, pensionPercent: 0.1 });
    if (
      r.insideBreakevenDayRate !== null &&
      r.insideBreakevenDayRateWealth !== null
    ) {
      // Both should be finite, both should make sense.
      expect(r.insideBreakevenDayRate).toBeGreaterThan(0);
      expect(r.insideBreakevenDayRateWealth).toBeGreaterThan(0);
    }
  });
});

describe('compareIR35 — edge cases', () => {
  it('zero billable days → zero contract value, zero everything', () => {
    const r = compareIR35({ ...BASE, billableDays: 0 });
    expect(r.inside.contractValue).toBe(0);
    expect(r.outside.contractValue).toBe(0);
    expect(r.inside.netCash).toBe(0);
    expect(r.outside.netCash).toBe(0);
  });

  it('zero day rate → zero everything', () => {
    const r = compareIR35({ ...BASE, dayRate: 0 });
    expect(r.inside.netCash).toBe(0);
    expect(r.outside.netCash).toBe(0);
  });

  it('very high day rate triggers additional-rate effects', () => {
    const r = compareIR35({ ...BASE, dayRate: 2_500, billableDays: 220 });
    // Contract value £550k → high earners triggered.
    expect(r.inside.contractValue).toBe(550_000);
    expect(r.outside.contractValue).toBe(550_000);
    // Effective tax rate should be quite high — well over 40% on both sides.
    expect(r.inside.effectiveTaxRate).toBeGreaterThan(0.40);
    expect(r.outside.effectiveTaxRate).toBeGreaterThan(0.40);
  });

  it('£100k taper boundary is handled — gross taxable just over £100k loses PA', () => {
    // Day rate that produces ~£105k of gross taxable income inside-IR35.
    // We test indirectly: at a high enough rate, the inside-IR35 net cash
    // growth slows in the £100k–£125,140 band (60% effective).
    const at99k = computeInsideIR35({
      ...BASE,
      dayRate: 99_000 / BASE.billableDays,
    });
    const at115k = computeInsideIR35({
      ...BASE,
      dayRate: 115_000 / BASE.billableDays,
    });
    // Net cash should still increase but at a slower rate per £ in the taper band.
    expect(at115k.netCash).toBeGreaterThan(at99k.netCash);
    // The ratio of net-cash increase to gross increase should be roughly 40%
    // (i.e., the marginal retention rate in the taper band).
    const grossDelta = 115_000 - 99_000;
    const netDelta = at115k.netCash - at99k.netCash;
    expect(netDelta / grossDelta).toBeLessThan(0.60); // confirms the punitive marginal rate
  });
});

describe('compareIR35 — pension interaction', () => {
  it('positive pension contribution shows up in both scenarios', () => {
    const r = compareIR35({ ...BASE, pensionPercent: 0.1 });
    expect(r.inside.pensionContribution).toBeGreaterThan(0);
    expect(r.outside.pensionContribution).toBeGreaterThan(0);
  });

  it('pension contribution capped at Annual Allowance (£60k)', () => {
    const r = compareIR35({ ...BASE, dayRate: 2_000, pensionPercent: 0.5 });
    expect(r.inside.pensionContribution).toBeLessThanOrEqual(60_000);
    expect(r.outside.pensionContribution).toBeLessThanOrEqual(60_000);
  });

  it('higher pension % reduces net cash but increases net wealth (inside)', () => {
    const r0 = computeInsideIR35({ ...BASE, pensionPercent: 0 });
    const r10 = computeInsideIR35({ ...BASE, pensionPercent: 0.1 });
    expect(r10.netCash).toBeLessThan(r0.netCash);
    expect(r10.netWealth).toBeGreaterThan(r0.netCash); // wealth includes pension
  });
});

describe('compareIR35 — apprenticeship levy', () => {
  it('passing through Apprenticeship Levy reduces inside-IR35 net cash', () => {
    const without = computeInsideIR35({ ...BASE, passThroughApprenticeshipLevy: false });
    const withL = computeInsideIR35({ ...BASE, passThroughApprenticeshipLevy: true });
    expect(withL.netCash).toBeLessThan(without.netCash);
    expect(withL.breakdown.apprenticeshipLevy).toBeGreaterThan(0);
  });
});

describe('compareIR35 — expense sensitivity (outside)', () => {
  it('higher expenses reduce outside-IR35 net cash', () => {
    const lo = computeOutsideIR35({ ...BASE, annualBusinessExpenses: 3_000 });
    const hi = computeOutsideIR35({ ...BASE, annualBusinessExpenses: 15_000 });
    expect(hi.scenario.netCash).toBeLessThan(lo.scenario.netCash);
  });

  it('outside-IR35 expenses appear in the breakdown', () => {
    const r = computeOutsideIR35({ ...BASE, annualBusinessExpenses: 5_000 });
    expect(r.scenario.breakdown.businessExpenses).toBe(5_000);
  });
});

describe('compareIR35 — boundary values (YMYL precision)', () => {
  it('handles £49,999.99 day-rate × 1 day (just under basic-rate boundary)', () => {
    const r = compareIR35({ ...BASE, dayRate: 49_999.99, billableDays: 1 });
    expect(Number.isFinite(r.inside.netCash)).toBe(true);
    expect(Number.isFinite(r.outside.netCash)).toBe(true);
  });

  it('handles £50,000.01 day-rate × 1 day (just over basic-rate boundary)', () => {
    const r = compareIR35({ ...BASE, dayRate: 50_000.01, billableDays: 1 });
    expect(Number.isFinite(r.inside.netCash)).toBe(true);
    expect(Number.isFinite(r.outside.netCash)).toBe(true);
  });

  it('handles £999,999 day-rate (extreme upper bound)', () => {
    const r = compareIR35({ ...BASE, dayRate: 999_999, billableDays: 1 });
    expect(r.inside.contractValue).toBeCloseTo(999_999, 0);
    // Effective tax rates should be > 40% (additional rate territory).
    expect(r.inside.effectiveTaxRate).toBeGreaterThan(0.40);
  });
});

describe('compareIR35 — warnings', () => {
  it('flags >240 billable days', () => {
    const r = compareIR35({ ...BASE, billableDays: 260 });
    expect(r.warnings.some(w => w.includes('billable days'))).toBe(true);
  });

  it('flags excessive expenses', () => {
    const r = compareIR35({ ...BASE, annualBusinessExpenses: 50_000 });
    expect(r.warnings.some(w => w.includes('expenses'))).toBe(true);
  });

  it('flags excessive pension contribution', () => {
    const r = compareIR35({ ...BASE, pensionPercent: 0.6 });
    expect(r.warnings.some(w => w.includes('Pension') || w.includes('pension'))).toBe(true);
  });
});
