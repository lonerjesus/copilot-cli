import { NextResponse } from "next/server";
import { PLATFORMS } from "@/data/identity";
import { CATALOG } from "@/data/catalog";
import { fetchSubstackFeed, mergeFootprint, catalogToFootprint } from "@/lib/feed";

export const revalidate = 300;

type IngestSource = {
  id: string;
  label: string;
  url: string;
  status: "ok" | "skip" | "error";
  detail: string;
  matchedCatalogIds: string[];
};

/**
 * Content-ingest agent endpoint: audits house platform uplinks against catalog.
 * Does not invent third-party content — only exact PLATFORMS + CATALOG mappings.
 */
export async function GET() {
  const sources: IngestSource[] = [];

  for (const platform of PLATFORMS) {
    const matched = CATALOG.filter((item) => {
      if (item.platform === platform.id) return true;
      try {
        const itemUrl = item.externalUrl.replace(/\/$/, "");
        const platformUrl = platform.url.replace(/\/$/, "");
        return itemUrl === platformUrl || itemUrl.startsWith(`${platformUrl}/`);
      } catch {
        return false;
      }
    }).map((i) => i.id);
    // de-dupe while preserving order
    const matchedCatalogIds = Array.from(new Set(matched));
    let status: IngestSource["status"] = "ok";
    let detail = matchedCatalogIds.length
      ? `${matchedCatalogIds.length} catalog node(s) wired`
      : "platform registered · no catalog rows yet";

    if (platform.id === "substack") {
      try {
        const rss = await fetchSubstackFeed();
        detail = `RSS live · ${rss.length} items · ${matchedCatalogIds.length} catalog bridges`;
      } catch {
        status = "error";
        detail = "Substack RSS fetch failed";
      }
    }

    sources.push({
      id: platform.id,
      label: platform.label,
      url: platform.url,
      status,
      detail,
      matchedCatalogIds,
    });
  }

  const footprint = mergeFootprint(await fetchSubstackFeed(), catalogToFootprint());
  const uncovered = CATALOG.filter(
    (item) => !PLATFORMS.some((p) => p.id === item.platform),
  ).map((i) => i.id);

  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      agent: "content-ingest",
      policy: "exact-house-names-only",
      platformCount: PLATFORMS.length,
      catalogCount: CATALOG.length,
      footprintCount: footprint.length,
      sources,
      uncoveredPlatformIds: uncovered,
      ok: uncovered.length === 0 && sources.every((s) => s.status !== "error"),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
