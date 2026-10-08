import type { MetadataRoute } from "next";
import { SITE } from "@/data/identity";

/**
 * Index the signup / trust doors. Keep the gated stream out of Search.
 * Preview bots soft-land on /access via middleware for share cards.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/access", "/privacy", "/terms", "/og.png", "/favicon.svg"],
        disallow: ["/"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
