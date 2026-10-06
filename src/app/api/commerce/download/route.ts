import { NextResponse, type NextRequest } from "next/server";
import { isPaywalled } from "@/data/catalog";
import { getMagazineByCatalogId } from "@/data/magazine";
import { contentPriceCents, formatUsd } from "@/data/commerce";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import { jsonError } from "@/lib/commerce/checkout";
import { signPayload } from "@/lib/auth/crypto";
import { getLiveItem } from "@/lib/live-catalog";

/**
 * Download / save:
 * - fetched/scraped media → free for signed-in members
 * - uploaded house media → requires purchase (402)
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUserFromRequest(request);
  if (!user) return jsonError("auth_required", 401);

  const catalogId = request.nextUrl.searchParams.get("id")?.trim();
  if (!catalogId) return jsonError("id required", 400);

  const item = await getLiveItem(catalogId);
  if (!item) return jsonError("Unknown catalog item", 404);

  const gated = isPaywalled(item);
  if (gated && !user.purchasedCatalogIds.includes(catalogId)) {
    return NextResponse.json(
      {
        error: "purchase_required",
        catalogId,
        price: formatUsd(contentPriceCents(catalogId)),
        message: "Purchase this uploaded piece to download or save it.",
      },
      { status: 402, headers: { "Cache-Control": "no-store" } },
    );
  }

  const magazine = getMagazineByCatalogId(catalogId);
  const issuedAt = new Date().toISOString();
  const license = signPayload(`${user.id}:${catalogId}:${issuedAt}:${gated ? "paid" : "fetched"}`);

  const payload = {
    license,
    issuedAt,
    licensee: user.email,
    access: gated ? "purchased-upload" : "fetched-open",
    item: {
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      brand: item.brand,
      kind: item.kind,
      blurb: item.blurb,
      publishedAt: item.publishedAt,
      tags: item.tags,
      externalUrl: item.externalUrl,
      src: item.src ?? null,
      poster: item.poster ?? null,
      source: item.source ?? (gated ? "uploaded" : "fetched"),
    },
    magazine: magazine
      ? {
          masthead: magazine.masthead,
          issueLabel: magazine.issueLabel,
          spreads: magazine.spreads,
        }
      : null,
    notice: gated
      ? "Personal download license for the purchasing account only. Redistribution prohibited."
      : "Fetched/scraped source reference for members. Prefer the original platform for full media files.",
  };

  const body = JSON.stringify(payload, null, 2);
  const safeName = catalogId.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 80) || "item";
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}.kn.json"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Download-Options": "noopen",
    },
  });
}
