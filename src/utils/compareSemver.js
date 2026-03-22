/**
 * Vergleicht Semver-Strings a und b (Major.Minor.Patch).
 * @returns {-1|0|1}  -1 wenn a < b, 0 wenn gleich, 1 wenn a > b
 */
export function compareSemver(a, b) {
  const pa = String(a || "0.0.0")
    .split(".")
    .map((x) => parseInt(x, 10) || 0);
  const pb = String(b || "0.0.0")
    .split(".")
    .map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da < db) {
      return -1;
    }
    if (da > db) {
      return 1;
    }
  }
  return 0;
}
