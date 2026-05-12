/**
 * Unit tests for ni.ts — 2026/27 rates.
 *
 *   Employee (Class 1 primary):
 *     0–£12,570    : 0%
 *     £12,570–£50,270 : 8%
 *     £50,270+     : 2%
 *
 *   Employer (Class 1 secondary):
 *     0–£5,000     : 0%
 *     £5,000+      : 15%
 *     EA: up to £10,500 reduction (multi-employee Ltd Co only)
 *
 *   Self-employed:
 *     Class 4: 0/6%/2% on £12,570 / £50,270
 *     Class 2 voluntary: £3.45 × 52 = £179.40
 */

import { describe, it, expect } from 'vitest';
import { niEmployee, niEmployer, niSelfEmployed } from '../tax/ni';

describe('niEmployee', () => {
  it('zero salary → zero NI', () => {
    expect(niEmployee(0).ni).toBe(0);
  });

  it('salary at primary threshold → zero NI', () => {
    expect(niEmployee(12_570).ni).toBe(0);
  });

  it('£20,000 → (20,000 - 12,570) × 8% = £594.40', () => {
    expect(niEmployee(20_000).ni).toBeCloseTo(594.40, 2);
  });

  it('£50,270 → full main band = £3,016.00', () => {
    expect(niEmployee(50_270).ni).toBeCloseTo(3_016, 2);
  });

  it('£60,000 → £3,016 + (60,000 - 50,270) × 2% = £3,210.60', () => {
    expect(niEmployee(60_000).ni).toBeCloseTo(3_210.60, 2);
  });

  it('marginal rate transitions correctly at thresholds', () => {
    expect(niEmployee(10_000).marginalRate).toBe(0);
    expect(niEmployee(30_000).marginalRate).toBe(0.08);
    expect(niEmployee(100_000).marginalRate).toBe(0.02);
  });
});

describe('niEmployer (no EA)', () => {
  it('zero salary → zero NI', () => {
    expect(niEmployer(0).ni).toBe(0);
  });

  it('salary at £5,000 ST → zero NI', () => {
    expect(niEmployer(5_000).ni).toBe(0);
  });

  it('£12,570 salary → (12,570 - 5,000) × 15% = £1,135.50', () => {
    expect(niEmployer(12_570).ni).toBeCloseTo(1_135.50, 2);
  });

  it('£50,000 salary → £6,750', () => {
    expect(niEmployer(50_000).ni).toBeCloseTo(6_750, 2);
  });
});

describe('niEmployer (with EA)', () => {
  it('£12,570 salary with EA → bill (£1,135.50) eaten by £10,500 allowance', () => {
    const r = niEmployer(12_570, { claimEA: true });
    expect(r.ni).toBe(0);
  });

  it('£100,000 salary with EA → £14,250 - £10,500 = £3,750', () => {
    const r = niEmployer(100_000, { claimEA: true });
    expect(r.ni).toBeCloseTo(3_750, 2);
  });

  it('opting out of EA gives the full bill', () => {
    const withEA = niEmployer(100_000, { claimEA: true });
    const without = niEmployer(100_000);
    expect(without.ni - withEA.ni).toBeCloseTo(10_500, 2);
  });
});

describe('niSelfEmployed', () => {
  it('zero profits → zero Class 4, optional Class 2', () => {
    expect(niSelfEmployed(0).ni).toBe(0);
    expect(niSelfEmployed(0, { voluntaryClass2: true }).ni).toBeCloseTo(179.40, 2);
  });

  it('profits at LPL → zero Class 4', () => {
    expect(niSelfEmployed(12_570).class4).toBe(0);
  });

  it('£20,000 profits → (20,000 - 12,570) × 6% = £445.80', () => {
    expect(niSelfEmployed(20_000).class4).toBeCloseTo(445.80, 2);
  });

  it('£50,270 profits → full main band = £2,262', () => {
    expect(niSelfEmployed(50_270).class4).toBeCloseTo(2_262, 2);
  });

  it('£60,000 profits → £2,262 + 2% above UPL', () => {
    const r = niSelfEmployed(60_000);
    expect(r.class4).toBeCloseTo(2_262 + 194.60, 2);
  });

  it('voluntary Class 2 adds £179.40 on top', () => {
    const without = niSelfEmployed(40_000);
    const withClass2 = niSelfEmployed(40_000, { voluntaryClass2: true });
    expect(withClass2.ni - without.ni).toBeCloseTo(179.40, 2);
    expect(withClass2.class2).toBeCloseTo(179.40, 2);
  });
});
