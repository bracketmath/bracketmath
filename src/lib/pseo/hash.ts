/**
 * Deterministic 32-bit FNV-1a hash for slug → template/FAQ rotation.
 *
 * Why FNV-1a:
 *   - Zero dependencies.
 *   - Stable across runs (so the same slug always picks the same template).
 *   - Reasonable distribution on short alphanumeric strings.
 *
 * This is *not* a cryptographic hash. We use it only to map slugs to
 * template/FAQ indices in a way that's even across the 200 rows.
 */

export function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    // Multiply by FNV prime (16777619) with truncation to 32 bits.
    h = Math.imul(h, 0x01000193);
  }
  // Convert to unsigned 32-bit.
  return h >>> 0;
}

/** Map a slug to an index in [0, n). */
export function indexFor(slug: string, n: number, salt = ''): number {
  if (n <= 0) return 0;
  return fnv1a(slug + '|' + salt) % n;
}
