/**
 * Format a bounty number for display.
 * No ₿ suffix — callers add it contextually.
 */
export function formatBounty(n: number): string {
  if (n >= 1_000_000_000) {
    return `${(n / 1e9).toFixed(1)}B`;
  }
  if (n >= 1_000_000) {
    return `${Math.round(n / 1e6)}M`;
  }
  return n.toLocaleString();
}
