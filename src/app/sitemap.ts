import type { MetadataRoute } from "next";
import { SITE } from "@/data/identity";

/**
 * Stable lastmod dates from real content revisions — never stamp request time
 * (that made every crawl look like a fresh rewrite).
 */
const LASTMOD = {
  access: new Date("2026-10-08T22:50:45.000Z"),
  privacy: new Date("2026-10-08T22:50:45.000Z"),
  terms: new Date("2026-10-08T22:50:45.000Z"),
} as const;

/** Advertise the account door + legal trust pages — never the gated stream. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE.url}/access`,
      lastModified: LASTMOD.access,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE.url}/privacy`,
      lastModified: LASTMOD.privacy,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE.url}/terms`,
      lastModified: LASTMOD.terms,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];
}
