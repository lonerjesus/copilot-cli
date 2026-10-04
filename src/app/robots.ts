import type { MetadataRoute } from "next";
import { SITE } from "@/data/identity";

/** Disallow crawlers/scrapers — site is account-gated. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
    host: SITE.url,
  };
}
