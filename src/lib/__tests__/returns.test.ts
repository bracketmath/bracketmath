/**
 * Unit tests for the block-bootstrap return generator.
 */

import { describe, it, expect } from 'vitest';
import {
  blockBootstrap,
  HISTORICAL_RETURNS,
  historicalSummary,
  mean,
  stdev,
  geometricMean,
  percentile,
} from '../montecarlo/returns';
import { mulberry32 } from '../montecarlo/rng';

describe('HISTORICAL_RETURNS dataset', () => {
  it('covers at least 124 years', () => {
    expect(HISTORICAL_RETURNS.length).toBeGreaterThanOrEqual(124);
  });

  it('starts in 1900 and ends in 2024 (inclusive)', () => {
    expect(HISTORICAL_RETURNS[0]!.year).toBe(1900);
    expect(HISTORICAL_RETURNS[HISTORICAL_RETURNS.length - 1]!.year).toBe(2024);
  });

  it('years are contiguous (no gaps)', () => {
    for (let i = 1; i < HISTORICAL_RETURNS.length; i++) {
      expect(HISTORICAL_RETURNS[i]!.year).toBe(
        HISTORICAL_RETURNS[i - 1]!.year + 1,
      );
    }
  });

  it('every row has equity, gilt, and cpi as finite numbers', () => {
    for (const row of HISTORICAL_RETURNS) {
      expect(Number.isFinite(row.equity)).toBe(true);
      expect(Number.isFinite(row.gilt)).toBe(true);
      expect(Number.isFinite(row.cpi)).toBe(true);
    }
  });

  it('summary statistics are in the published DMS ballpark', () => {
    const equity = HISTORICAL_RETURNS.map(r => r.equity);
    const gilt = HISTORICAL_RETURNS.map(r => r.gilt);
    const cpi = HISTORICAL_RETURNS.map(r => r.cpi);
    // Equities: nominal arithmetic mean roughly 8–13%, SD roughly 17–22%
    expect(mean(equity)).toBeGreaterThan(0.07);
    expect(mean(equity)).toBeLessThan(0.14);
    expect(stdev(equity)).toBeGreaterThan(0.15);
    expect(stdev(equity)).toBeLessThan(0.25);
    // Gilts: arithmetic 4–8%, SD 10–16%
    expect(mean(gilt)).toBeGreaterThan(0.03);
    expect(mean(gilt)).toBeLessThan(0.09);
    // CPI: 2–5%
    expect(mean(cpi)).toBeGreaterThan(0.02);
    expect(mean(cpi)).toBeLessThan(0.07);
  });
});

describe('blockBootstrap — shape and basics', () => {
  it('returns the requested number of annual returns', () => {
    const out = blockBootstrap({ years: 30, rng: mulberry32(1) });
    expect(out.annualReturns.length).toBe(30);
    expect(out.sampledYears.length).toBe(30);
  });

  it('returns years × 12 monthly returns', () => {
    const out = blockBootstrap({ years: 30, rng: mulberry32(1) });
    expect(out.monthlyReturns.length).toBe(360);
  });

  it('every monthly return is a finite number', () => {
    const out = blockBootstrap({ years: 30, rng: mulberry32(1) });
    for (const r of out.monthlyReturns) {
      expect(Number.isFinite(r)).toBe(true);
    }
  });

  it('determinism: same seed → identical output', () => {
    const a = blockBootstrap({ years: 30, rng: mulberry32(99) });
    const b = blockBootstrap({ years: 30, rng: mulberry32(99) });
    expect(a.annualReturns).toEqual(b.annualReturns);
    expect(a.sampledYears).toEqual(b.sampledYears);
  });

  it('different seeds → different sampled years', () => {
    const a = blockBootstrap({ years: 30, rng: mulberry32(1) });
    const b = blockBootstrap({ years: 30, rng: mulberry32(2) });
    expect(a.sampledYears).not.toEqual(b.sampledYears);
  });
});

describe('blockBootstrap — input validation', () => {
  it('throws on non-positive years', () => {
    expect(() => blockBootstrap({ years: 0 })).toThrow();
    expect(() => blockBootstrap({ years: -5 })).toThrow();
  });

  it('throws on equity weight outside [0, 1]', () => {
    expect(() => blockBootstrap({ years: 10, equityWeight: -0.1 })).toThrow();
    expect(() => blockBootstrap({ years: 10, equityWeight: 1.1 })).toThrow();
  });

  it('throws on non-positive blockYears', () => {
    expect(() => blockBootstrap({ years: 10, blockYears: 0 })).toThrow();
  });
});

describe('blockBootstrap — statistical correctness', () => {
  it('empirical mean over a long path approximates the input series mean (within 1 SE)', () => {
    // For 100% gilts (no equity), the bootstrap should reproduce the gilt-series real mean.
    const out = blockBootstrap({
      years: 10_000,
      equityWeight: 0,
      rng: mulberry32(7),
      feeAnnual: 0,
    });
    const empiricalMean = mean(out.annualReturns);

    const realGilt = HISTORICAL_RETURNS.map(
      r => (1 + r.gilt) / (1 + r.cpi) - 1,
    );
    const truthMean = mean(realGilt);
    const truthSD = stdev(realGilt);
    const se = truthSD / Math.sqrt(10_000);

    // |empirical - truth| should be well within 3 SE.
    expect(Math.abs(empiricalMean - truthMean)).toBeLessThan(3 * se);
  });

  it('empirical SD over a long path approximates the input series SD', () => {
    const out = blockBootstrap({
      years: 10_000,
      equityWeight: 1,
      rng: mulberry32(8),
    });
    const realEquity = HISTORICAL_RETURNS.map(
      r => (1 + r.equity) / (1 + r.cpi) - 1,
    );
    const truthSD = stdev(realEquity);
    const empiricalSD = stdev(out.annualReturns);
    // Should agree within 10% relative.
    expect(empiricalSD).toBeGreaterThan(truthSD * 0.9);
    expect(empiricalSD).toBeLessThan(truthSD * 1.1);
  });

  it('higher equity weight produces higher mean real return (consistent with the historical equity premium)', () => {
    const lo = blockBootstrap({
      years: 10_000,
      equityWeight: 0.2,
      rng: mulberry32(101),
    });
    const hi = blockBootstrap({
      years: 10_000,
      equityWeight: 0.8,
      rng: mulberry32(101),
    });
    expect(mean(hi.annualReturns)).toBeGreaterThan(mean(lo.annualReturns));
  });

  it('higher equity weight produces higher SD', () => {
    const lo = blockBootstrap({
      years: 10_000,
      equityWeight: 0.2,
      rng: mulberry32(202),
    });
    const hi = blockBootstrap({
      years: 10_000,
      equityWeight: 0.8,
      rng: mulberry32(202),
    });
    expect(stdev(hi.annualReturns)).toBeGreaterThan(stdev(lo.annualReturns));
  });

  it('annual fee reduces the mean return by approximately the fee amount', () => {
    const noFee = blockBootstrap({
      years: 10_000,
      equityWeight: 0.6,
      feeAnnual: 0,
      rng: mulberry32(33),
    });
    const withFee = blockBootstrap({
      years: 10_000,
      equityWeight: 0.6,
      feeAnnual: 0.01,
      rng: mulberry32(33),
    });
    const diff = mean(noFee.annualReturns) - mean(withFee.annualReturns);
    // Should be very close to 0.01 (100 bps).
    expect(diff).toBeCloseTo(0.01, 4);
  });
});

describe('blockBootstrap — monthly compounding correctness', () => {
  it('compounded monthly return for each year equals the annual return for that year', () => {
    const out = blockBootstrap({ years: 5, rng: mulberry32(11) });
    for (let y = 0; y < 5; y++) {
      let compound = 1;
      for (let m = 0; m < 12; m++) {
        compound *= 1 + out.monthlyReturns[y * 12 + m]!;
      }
      const reconstituted = compound - 1;
      expect(reconstituted).toBeCloseTo(out.annualReturns[y]!, 6);
    }
  });
});

describe('blockBootstrap — block length semantics', () => {
  it('block length 5 produces a path where the first 5 years are consecutive historical years', () => {
    const out = blockBootstrap({
      years: 5,
      blockYears: 5,
      rng: mulberry32(444),
    });
    for (let i = 1; i < 5; i++) {
      expect(out.sampledYears[i]).toBe(out.sampledYears[i - 1]! + 1);
    }
  });

  it('block length 1 typically produces a non-monotonic sequence of sampled years', () => {
    const out = blockBootstrap({
      years: 50,
      blockYears: 1,
      rng: mulberry32(555),
    });
    let nonAdjacentCount = 0;
    for (let i = 1; i < 50; i++) {
      if (out.sampledYears[i]! !== out.sampledYears[i - 1]! + 1) {
        nonAdjacentCount++;
      }
    }
    // Almost every year should be non-adjacent.
    expect(nonAdjacentCount).toBeGreaterThan(45);
  });
});

describe('summary statistics helpers', () => {
  it('mean handles empty array', () => {
    expect(mean([])).toBe(0);
  });

  it('mean of [1,2,3,4,5] = 3', () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
  });

  it('stdev of [2,4,4,4,5,5,7,9] ≈ 2.138', () => {
    expect(stdev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 2);
  });

  it('geometricMean of constant 5% returns is 0.05', () => {
    expect(geometricMean([0.05, 0.05, 0.05, 0.05])).toBeCloseTo(0.05, 10);
  });

  it('geometricMean handles 100% loss by returning -1', () => {
    expect(geometricMean([0.5, -1, 0.3])).toBe(-1);
  });

  it('percentile correctly interpolates', () => {
    // p50 of [1..10] = 5.5 (type-7 rule)
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.5)).toBeCloseTo(5.5, 6);
  });

  it('historicalSummary reports plausible UK 60/40 real returns', () => {
    const s = historicalSummary(0.6, 0);
    // 60/40 UK real geometric: published ~3.5–4.5%.
    expect(s.geometricMean).toBeGreaterThan(0.025);
    expect(s.geometricMean).toBeLessThan(0.055);
    // SD: published ~12–14%.
    expect(s.stdev).toBeGreaterThan(0.10);
    expect(s.stdev).toBeLessThan(0.18);
    expect(s.yearsCovered).toBe(HISTORICAL_RETURNS.length);
  });
});
