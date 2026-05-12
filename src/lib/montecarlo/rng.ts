/**
 * Seedable pseudo-random number generator — mulberry32.
 *
 * Used by the Monte Carlo simulator so that:
 *   • Two runs with the same seed produce identical results (determinism for tests).
 *   • The simulator does NOT depend on `Math.random()`, which is non-seedable and
 *     varies across browsers / Node versions.
 *
 * mulberry32 is a small, fast PRNG with a period of 2³² and excellent
 * statistical properties for Monte Carlo work. It is NOT cryptographically
 * secure — do not use for security-sensitive applications.
 *
 * Reference: Tommy Ettinger, public domain.
 */

export interface Rng {
  /** Returns a uniform random number in [0, 1). */
  next(): number;
}

/**
 * Create a mulberry32 PRNG from a 32-bit seed.
 *
 * @param seed — any 32-bit integer. Default 1 (arbitrary, fine for ad-hoc use).
 */
export function mulberry32(seed: number = 1): Rng {
  let a = seed >>> 0;
  return {
    next(): number {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
    },
  };
}

/** Convenience: a non-seeded RNG that wraps Math.random (for UI runs where determinism doesn't matter). */
export const wallclockRng: Rng = {
  next: () => Math.random(),
};

/**
 * Draw an integer uniformly from [0, max) using a given RNG.
 *
 * Uses rejection sampling for unbiased draws when `max` does not divide 2³² evenly.
 * (For our use case — `max` ≤ 124 — the bias of naïve `floor(rng() * max)` is
 * negligible, but we do it properly anyway.)
 */
export function randInt(rng: Rng, max: number): number {
  if (max <= 0 || !Number.isFinite(max)) {
    throw new Error('randInt: max must be a positive finite integer');
  }
  return Math.floor(rng.next() * max);
}
