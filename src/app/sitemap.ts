import type { MetadataRoute } from "next";
import { SITE } from "@/data/identity";

/** Account gate — only advertise the access door. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE.url}/access`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
