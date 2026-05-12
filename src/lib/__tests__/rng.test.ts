/**
 * Unit tests for the seedable PRNG.
 */

import { describe, it, expect } from 'vitest';
import { mulberry32, randInt, wallclockRng } from '../montecarlo/rng';

describe('mulberry32 — determinism', () => {
  it('produces the same sequence twice with the same seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('produces different sequences with different seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    let diffs = 0;
    for (let i = 0; i < 20; i++) {
      if (a.next() !== b.next()) diffs++;
    }
    expect(diffs).toBeGreaterThan(15);
  });
});

describe('mulberry32 — statistical properties', () => {
  it('returns values in [0, 1)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 1_000; i++) {
      const x = rng.next();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('empirical mean of 10,000 draws is near 0.5', () => {
    const rng = mulberry32(123);
    let s = 0;
    const n = 10_000;
    for (let i = 0; i < n; i++) s += rng.next();
    const mean = s / n;
    // SE = 1/sqrt(12n) ≈ 0.003 → 4σ band ~0.012
    expect(mean).toBeGreaterThan(0.487);
    expect(mean).toBeLessThan(0.513);
  });

  it('empirical variance of 10,000 draws is near 1/12 (≈0.0833)', () => {
    const rng = mulberry32(456);
    const xs: number[] = [];
    for (let i = 0; i < 10_000; i++) xs.push(rng.next());
    const m = xs.reduce((a, b) => a + b, 0) / xs.length;
    const v =
      xs.reduce((s, x) => s + (x - m) * (x - m), 0) / (xs.length - 1);
    expect(v).toBeGreaterThan(0.078);
    expect(v).toBeLessThan(0.089);
  });
});

describe('randInt', () => {
  it('returns values in [0, max)', () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 1_000; i++) {
      const x = randInt(rng, 124);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(124);
      expect(Number.isInteger(x)).toBe(true);
    }
  });

  it('throws on non-positive max', () => {
    const rng = mulberry32(1);
    expect(() => randInt(rng, 0)).toThrow();
    expect(() => randInt(rng, -1)).toThrow();
  });

  it('covers the full range over 1,000 draws for max=10', () => {
    const rng = mulberry32(2024);
    const seen = new Set<number>();
    for (let i = 0; i < 1_000; i++) seen.add(randInt(rng, 10));
    expect(seen.size).toBe(10);
  });
});

describe('wallclockRng', () => {
  it('produces values in [0, 1)', () => {
    for (let i = 0; i < 100; i++) {
      const x = wallclockRng.next();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});
