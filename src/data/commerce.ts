/** Commerce + access policy for www.kamaunegasi.net */

export const DONATION_PRESETS_CENTS = [500, 1000, 2500, 5000, 10000] as const;

export const DEFAULT_CONTENT_PRICE_CENTS = 399;

/** Minimum / maximum cents for a custom donation */
export const MIN_DONATION_CENTS = 100;
export const MAX_DONATION_CENTS = 100_000; // $1,000

export const MAX_PASSWORD_LENGTH = 128;
export const MIN_PASSWORD_LENGTH = 10;

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function contentPriceCents(catalogId: string, override?: number): number {
  if (typeof override === "number" && override >= 0) return override;
  // MagCloud chapbooks slightly higher
  if (catalogId.startsWith("qtoss-")) return 699;
  if (catalogId.startsWith("bandcamp-") || catalogId.startsWith("bc-")) return 299;
  return DEFAULT_CONTENT_PRICE_CENTS;
}
