export type MagazineSpread = {
  id: string;
  kicker: string;
  headline: string;
  dek?: string;
  body: string[];
  pullQuote?: string;
  folio: string;
};

export type MagazineIssue = {
  id: string;
  catalogId: string;
  masthead: string;
  issueLabel: string;
  brand: string;
  publishedAt: string;
  externalUrl: string;
  mode: "chapbook" | "dispatch" | "libellus";
  spreads: MagazineSpread[];
};

/** Seed empty — magazine issues attach to admin-published house catalog ids. */
export const MAGAZINE_ISSUES: MagazineIssue[] = [];

export function getMagazineByCatalogId(catalogId: string): MagazineIssue | undefined {
  return MAGAZINE_ISSUES.find((issue) => issue.catalogId === catalogId);
}

export function getMagazineIssue(id: string): MagazineIssue | undefined {
  return MAGAZINE_ISSUES.find((issue) => issue.id === id);
}

export const MAGAZINE_CATALOG_IDS = new Set(MAGAZINE_ISSUES.map((i) => i.catalogId));
