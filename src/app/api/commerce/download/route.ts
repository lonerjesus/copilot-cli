import { NextResponse, type NextRequest } from "next/server";
import { CATALOG } from "@/data/catalog";
import { getMagazineByCatalogId } from "@/data/magazine";
import { contentPriceCents, formatUsd } from "@/data/commerce";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import { jsonError } from "@/lib/commerce/checkout";
import { signPayload } from "@/lib/auth/crypto";

/**
 * Paid download endpoint — only returns a saveable payload when the account
 * owns this catalog id. Stream/view remains available to signed-in members.
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUserFromRequest(request);
  if (!user) return jsonError("auth_required", 401);

  const catalogId = request.nextUrl.searchParams.get("id")?.trim();
  if (!catalogId) return jsonError("id required", 400);

  const item = CATALOG.find((c) => c.id === catalogId);
  if (!item) return jsonError("Unknown catalog item", 404);

  if (!user.purchasedCatalogIds.includes(catalogId)) {
    return NextResponse.json(
      {
        error: "purchase_required",
        catalogId,
        price: formatUsd(contentPriceCents(catalogId)),
        message: "Purchase this piece to download or save it.",
      },
      { status: 402, headers: { "Cache-Control": "no-store" } },
    );
  }

  const magazine = getMagazineByCatalogId(catalogId);
  const issuedAt = new Date().toISOString();
  const license = signPayload(`${user.id}:${catalogId}:${issuedAt}`);

  const payload = {
    license,
    issuedAt,
    licensee: user.email,
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
    },
    magazine: magazine
      ? {
          masthead: magazine.masthead,
          issueLabel: magazine.issueLabel,
          spreads: magazine.spreads,
        }
      : null,
    notice:
      "Personal download license for the purchasing account only. Redistribution prohibited.",
  };

  const body = JSON.stringify(payload, null, 2);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${catalogId}.kn.json"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Download-Options": "noopen",
    },
  });
}
