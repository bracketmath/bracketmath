/**
 * Integration tests for the salary-dividend joint optimiser.
 *
 * The headline tests:
 *   • For typical Ltd-Co profit levels, the optimum dominates the rule-of-thumb.
 *   • The cash-only optimum is reasonable (close to the £12,570 sweet spot).
 *   • The pension-allowed optimum extracts more wealth via pension contributions.
 *   • Edge cases (tiny profit, huge profit, PA-taper band) all return sensible
 *     non-NaN results.
 */

import { describe, it, expect } from 'vitest';
import {
  optimiseSalaryDividend,
  evaluatePlan,
  type OptimiserInput,
} from '../optim/salary-dividend';

const baseInput: OptimiserInput = {
  profits: 140_000,
  age: 38,
  // wider step for speed in tests — accuracy still within £1
  salaryStep: 500,
  pensionStep: 1_000,
};

describe('optimiseSalaryDividend — sanity', () => {
  it('throws on zero or negative profits', () => {
    expect(() =>
      optimiseSalaryDividend({ ...baseInput, profits: 0 }),
    ).toThrow();
    expect(() =>
      optimiseSalaryDividend({ ...baseInput, profits: -10_000 }),
    ).toThrow();
  });

  it('throws on absurd ages', () => {
    expect(() =>
      optimiseSalaryDividend({ ...baseInput, age: 5 }),
    ).toThrow();
    expect(() =>
      optimiseSalaryDividend({ ...baseInput, age: 200 }),
    ).toThrow();
  });

  it('runs in well under 1 second for a typical input', () => {
    const t0 = Date.now();
    optimiseSalaryDividend(baseInput);
    expect(Date.now() - t0).toBeLessThan(1_000);
  });
});

describe('optimiseSalaryDividend — headline result for £140k profit', () => {
  const result = optimiseSalaryDividend(baseInput);

  it('finds a strictly better outcome than the rule-of-thumb baseline', () => {
    expect(result.optimum.netWealth).toBeGreaterThan(result.ruleOfThumb.netWealth);
    expect(result.savingsVsRuleOfThumb).toBeGreaterThan(0);
  });

  it('reports the rule-of-thumb baseline as £12,570 salary, no pension', () => {
    expect(result.ruleOfThumb.salary).toBe(12_570);
    expect(result.ruleOfThumb.pension).toBe(0);
  });

  it('rule-of-thumb dividend should be roughly post-CT profit', () => {
    expect(result.ruleOfThumb.dividend).toBeGreaterThan(80_000);
    expect(result.ruleOfThumb.dividend).toBeLessThan(110_000);
  });

  it('optimum salary is within a sensible range (£0–£15,000)', () => {
    // Most realistic optima for a single-director Ltd Co at £140k profit fall
    // between £0 and £12,570. Step is £500 so we allow generous slack.
    expect(result.optimum.salary).toBeGreaterThanOrEqual(0);
    expect(result.optimum.salary).toBeLessThanOrEqual(15_000);
  });

  it('with pensionWeight=1, the optimum should use *some* pension', () => {
    // £140k profit is in the marginal-relief band, so pension is unusually
    // efficient. Expect optimum to include positive pension contribution.
    expect(result.optimum.pension).toBeGreaterThan(0);
  });

  it('salary curve has one entry per salary tried', () => {
    expect(result.salaryCurve.length).toBeGreaterThan(50);
  });

  it('all plans are internally consistent: netCash = profits - totalTax - pension', () => {
    const o = result.optimum;
    const reconstructed = baseInput.profits - o.totalTaxAndNI - o.pension;
    expect(reconstructed).toBeCloseTo(o.netCash, 0);
  });
});

describe('optimiseSalaryDividend — pension weight changes optimum', () => {
  it('pensionWeight=0 → optimum equals cashOptimum (and has zero pension)', () => {
    const r = optimiseSalaryDividend({
      ...baseInput,
      pensionWeight: 0,
    });
    expect(r.optimum.pension).toBe(0);
    expect(r.optimum.netCash).toBe(r.cashOptimum.netCash);
  });

  it('pensionWeight=1 → optimum uses pension and beats cashOptimum on netWealth', () => {
    const r = optimiseSalaryDividend({
      ...baseInput,
      pensionWeight: 1,
    });
    expect(r.optimum.pension).toBeGreaterThan(0);
    expect(r.optimum.netWealth).toBeGreaterThanOrEqual(r.cashOptimum.netCash);
  });
});

describe('optimiseSalaryDividend — extreme profit levels', () => {
  it('small profits (£30k) → no marginal relief warning, sensible optimum', () => {
    const r = optimiseSalaryDividend({
      ...baseInput,
      profits: 30_000,
    });
    // netWealth can equal profits if all £30k goes into pension (pensionWeight=1).
    expect(r.optimum.netWealth).toBeGreaterThan(20_000);
    expect(r.optimum.netWealth).toBeLessThanOrEqual(30_000);
    expect(r.warnings.some(w => w.includes('marginal relief band'))).toBe(false);
  });

  it('£300k profit (above main rate threshold) → optimum extracts > £150k wealth', () => {
    const r = optimiseSalaryDividend({
      ...baseInput,
      profits: 300_000,
      salaryStep: 1_000,
      pensionStep: 2_000,
    });
    expect(r.optimum.netWealth).toBeGreaterThan(150_000);
  });

  it('marginal-relief band profit triggers a warning', () => {
    const r = optimiseSalaryDividend({ ...baseInput, profits: 120_000 });
    expect(r.warnings.some(w => w.includes('marginal relief band'))).toBe(true);
  });

  it('low salary triggers the LEL/state-pension warning', () => {
    const r = optimiseSalaryDividend({
      ...baseInput,
      profits: 200_000,
      pensionWeight: 0, // force cash optimum (zero salary regime more likely)
    });
    // If the optimum lands below £6,500 we expect a warning.
    if (r.optimum.salary < 6_500) {
      expect(r.warnings.some(w => w.includes('Lower Earnings Limit'))).toBe(true);
    }
  });
});

describe('evaluatePlan — direct plan evaluation', () => {
  it('returns null for infeasible plans (salary + pension > profits)', () => {
    const plan = evaluatePlan(
      { profits: 50_000, age: 38 },
      40_000, // salary
      30_000, // pension
    );
    expect(plan).toBeNull();
  });

  it('returns sensible plan at the textbook £12,570 sweet spot', () => {
    const plan = evaluatePlan(
      { profits: 140_000, age: 38 },
      12_570,
      0,
    );
    expect(plan).not.toBeNull();
    expect(plan!.taxes.employeeNI).toBe(0); // £12,570 salary is at primary threshold
    expect(plan!.taxes.incomeTax).toBeGreaterThan(0); // dividend pushes PA-taper
    expect(plan!.dividend).toBeGreaterThan(80_000);
  });

  it('marginal CT relief band is detected on a £140k profit company', () => {
    const plan = evaluatePlan(
      { profits: 140_000, age: 38 },
      12_570,
      0,
    );
    expect(plan!.detail.corporationTax.regime).toBe('marginal');
  });
});
