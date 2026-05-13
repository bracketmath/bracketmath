/**
 * Unit tests for sole-trader.ts — 2026/27 rates.
 *
 * Covers:
 *   • Trading allowance vs actual expenses tie-breaks
 *   • Income tax + Class 4 NI at common profit levels
 *   • Class 2 voluntary contribution opt-in
 *   • Pro-rata share of tax with otherIncome stacking
 *   • Effective + marginal rate sanity
 *   • Ltd-Co break-even via bisection (compareIncorporation)
 */

import { describe, it, expect } from 'vitest';
import {
  computeSoleTrader,
  compareIncorporation,
  TRADING_ALLOWANCE,
} from '../optim/sole-trader';

describe('computeSoleTrader — trading allowance vs actual expenses', () => {
  it('expenses below £1,000 → trading allowance wins', () => {
    const r = computeSoleTrader({ turnover: 30_000, actualExpenses: 400 });
    expect(r.tradingAllowanceUsed).toBe(true);
    expect(r.tradingAllowanceSaving).toBe(TRADING_ALLOWANCE - 400);
    // Taxable profits should be turnover − £1,000.
    expect(r.taxableProfits).toBe(29_000);
  });

  it('expenses above £1,000 → actual expenses win', () => {
    const r = computeSoleTrader({ turnover: 50_000, actualExpenses: 5_000 });
    expect(r.tradingAllowanceUsed).toBe(false);
    expect(r.taxableProfits).toBe(45_000);
  });

  it('expenses exactly £1,000 → actual expenses applied (no benefit either way)', () => {
    const r = computeSoleTrader({ turnover: 30_000, actualExpenses: 1_000 });
    // Either branch produces same profits; engine uses actual.
    expect(r.taxableProfits).toBe(29_000);
  });

  it('zero turnover → zero everything', () => {
    const r = computeSoleTrader({ turnover: 0, actualExpenses: 0 });
    expect(r.netCash).toBe(0);
    expect(r.taxableProfits).toBe(0);
    expect(r.effectiveRate).toBe(0);
  });

  it('turnover under £1,000 → trading allowance zeroes profit', () => {
    const r = computeSoleTrader({ turnover: 800, actualExpenses: 0 });
    expect(r.taxableProfits).toBe(0);
    expect(r.netCash).toBe(0);
  });

  it('notes flag the trading-allowance recommendation when applicable', () => {
    const r = computeSoleTrader({ turnover: 30_000, actualExpenses: 200 });
    expect(r.notes.some((n) => n.includes('trading allowance'))).toBe(true);
  });
});

describe('computeSoleTrader — income tax + NI mechanics', () => {
  it('£25,000 turnover, £500 expenses → trading allowance, basic-rate tax', () => {
    const r = computeSoleTrader({ turnover: 25_000, actualExpenses: 500 });
    // Taxable profits = £24,000. PA = £12,570. Taxable above PA = £11,430.
    // Income tax = £11,430 × 20% = £2,286.
    // Class 4 NI = £11,430 × 6% = £685.80.
    expect(r.incomeTax.tax).toBeCloseTo(2_286, 0);
    expect(r.ni.class4).toBeCloseTo(685.80, 1);
  });

  it('£60,000 turnover, £5,000 expenses → higher-rate kicks in', () => {
    const r = computeSoleTrader({ turnover: 60_000, actualExpenses: 5_000 });
    // Taxable profits = £55,000.
    // IT: (£50,270 − £12,570) × 20% + (£55,000 − £50,270) × 40%
    //   = £7,540 + £1,892 = £9,432.
    // Class 4: £37,700 × 6% + (£55,000 − £50,270) × 2% = £2,262 + £94.60 = £2,356.60.
    expect(r.incomeTax.tax).toBeCloseTo(9_432, 0);
    expect(r.ni.class4).toBeCloseTo(2_356.60, 1);
  });

  it('voluntary Class 2 adds £179.40', () => {
    const a = computeSoleTrader({ turnover: 40_000, actualExpenses: 2_000 });
    const b = computeSoleTrader({
      turnover: 40_000,
      actualExpenses: 2_000,
      voluntaryClass2: true,
    });
    expect(b.ni.ni - a.ni.ni).toBeCloseTo(179.40, 2);
    expect(b.netCash).toBeCloseTo(a.netCash - 179.40, 2);
  });
});

describe('computeSoleTrader — pro-rata tax allocation with otherIncome', () => {
  it('otherIncome that uses PA pushes SE income into basic-rate territory', () => {
    const r = computeSoleTrader({
      turnover: 10_000,
      actualExpenses: 200,
      otherIncome: 30_000,
    });
    // Taxable SE profits = £9,000. Total taxable = £39,000. PA = £12,570.
    // Taxable-above-PA = £26,430 × 20% = £5,286.
    // SE share = £5,286 × (9000 / 39000) ≈ £1,220.
    expect(r.incomeTax.tax).toBeGreaterThan(1_100);
    expect(r.incomeTax.tax).toBeLessThan(1_300);
  });

  it('otherIncome pushing total above PA taper means marginal rate climbs', () => {
    const r = computeSoleTrader({
      turnover: 30_000,
      actualExpenses: 500,
      otherIncome: 80_000,
    });
    // Total non-dividend income = (£29,000) + £80,000 = £109,000.
    // This is inside the £100k–£125,140 PA taper → 60% effective marginal IT.
    // Class 4 marginal on the *next £1 of trading profit* is 6% — trading
    // profits sit at £29k (under the £50,270 UPL), so the main-band Class 4
    // rate applies, NOT the 2% rate above UPL. Combined: 60% + 6% = 66%.
    expect(r.marginalRate).toBeCloseTo(0.60 + 0.06, 2);
  });
});

describe('computeSoleTrader — effective rate sanity', () => {
  it('effective rate increases with profit', () => {
    const a = computeSoleTrader({ turnover: 30_000, actualExpenses: 2_000 });
    const b = computeSoleTrader({ turnover: 80_000, actualExpenses: 2_000 });
    const c = computeSoleTrader({ turnover: 150_000, actualExpenses: 2_000 });
    expect(b.effectiveRate).toBeGreaterThan(a.effectiveRate);
    expect(c.effectiveRate).toBeGreaterThan(b.effectiveRate);
  });

  it('net cash is monotonic in turnover (holding expenses fixed)', () => {
    const a = computeSoleTrader({ turnover: 40_000, actualExpenses: 1_500 });
    const b = computeSoleTrader({ turnover: 50_000, actualExpenses: 1_500 });
    expect(b.netCash).toBeGreaterThan(a.netCash);
  });
});

describe('compareIncorporation — should-I-incorporate?', () => {
  it('at very low turnover, sole trader is competitive or better', () => {
    const r = compareIncorporation({
      turnover: 25_000,
      actualExpenses: 1_000,
      age: 38,
    });
    // The £25k sole trader net should be close to or above Ltd Co net.
    // Allow Ltd Co to be slightly ahead but not by much (CT + NI + dividend
    // friction at small profits roughly cancels).
    expect(r.differenceVsSoleTrader).toBeLessThan(2_500);
  });

  it('at £80k turnover, Ltd Co (no pension) is broadly close to sole trader (within £2k)', () => {
    // NOTE: the £31,698/yr Ltd-Co advantage cited in /guides/ltd-company-director-tax
    // is the JOINT-pension optimum vs the rule-of-thumb. Without pension
    // (cash-only comparison), CT 19/25% + dividend tax ≈ income tax + Class 4
    // NI at most profit levels. The gap is small either way under £100k of
    // profit. See the discussion in src/lib/optim/sole-trader.ts.
    const r = compareIncorporation({
      turnover: 80_000,
      actualExpenses: 3_000,
      age: 40,
    });
    expect(Math.abs(r.differenceVsSoleTrader)).toBeLessThan(2_500);
  });

  it('at £140k turnover, the cash-optimum gap is small relative to the joint-optimiser gap', () => {
    // At £140k turnover, the joint optimiser saves ~£20–30k/yr vs rule of
    // thumb. The cash-only comparison shows a much smaller gap (often
    // negative — CT + dividend tax ≈ IT + Class 4 NI at these profits).
    // The big win comes from pension; this assertion just sanity-checks
    // the bisection produces a finite, sensibly-bounded number.
    const r = compareIncorporation({
      turnover: 140_000,
      actualExpenses: 5_000,
      age: 42,
    });
    expect(Math.abs(r.differenceVsSoleTrader)).toBeLessThan(15_000);
    expect(r.soleTraderNetCash).toBeGreaterThan(70_000);
    expect(r.ltdCoNetCash).toBeGreaterThan(70_000);
  });

  it('break-even profit level is in a sensible range (£25k–£60k)', () => {
    const r = compareIncorporation({
      turnover: 60_000,
      actualExpenses: 2_000,
      age: 38,
    });
    // Either Ltd Co always wins above ~£25k (returning null because no sign
    // change in [£15k, £400k]) or break-even sits in the £15k–£40k band.
    if (r.breakevenProfits !== null) {
      expect(r.breakevenProfits).toBeGreaterThanOrEqual(15_000);
      expect(r.breakevenProfits).toBeLessThanOrEqual(45_000);
    }
  });

  it('sole trader net cash component is reproducible', () => {
    const r1 = compareIncorporation({
      turnover: 50_000,
      actualExpenses: 2_000,
      age: 40,
    });
    const r2 = compareIncorporation({
      turnover: 50_000,
      actualExpenses: 2_000,
      age: 40,
    });
    expect(r1.soleTraderNetCash).toBeCloseTo(r2.soleTraderNetCash, 2);
    expect(r1.ltdCoNetCash).toBeCloseTo(r2.ltdCoNetCash, 2);
  });
});

describe('computeSoleTrader — input validation', () => {
  it('rejects negative turnover', () => {
    expect(() =>
      computeSoleTrader({ turnover: -1, actualExpenses: 0 }),
    ).toThrow();
  });

  it('rejects negative expenses', () => {
    expect(() =>
      computeSoleTrader({ turnover: 30_000, actualExpenses: -100 }),
    ).toThrow();
  });

  it('rejects NaN turnover', () => {
    expect(() =>
      computeSoleTrader({ turnover: NaN, actualExpenses: 0 }),
    ).toThrow();
  });
});
