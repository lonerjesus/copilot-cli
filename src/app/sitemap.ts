import type { MetadataRoute } from "next";
import { SITE } from "@/data/identity";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
