import { NextResponse, type NextRequest } from "next/server";
import { CATALOG } from "@/data/catalog";
import { contentPriceCents, formatUsd } from "@/data/commerce";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import { createContentCheckout, jsonError } from "@/lib/commerce/checkout";

export async function POST(request: NextRequest) {
  const user = await getSessionUserFromRequest(request);
  if (!user) return jsonError("auth_required", 401);

  let body: { catalogId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const catalogId = body.catalogId?.trim();
  if (!catalogId) return jsonError("catalogId required", 400);

  const item = CATALOG.find((c) => c.id === catalogId);
  if (!item) return jsonError("Unknown catalog item", 404);

  if (user.purchasedCatalogIds.includes(catalogId)) {
    return NextResponse.json(
      {
        alreadyOwned: true,
        catalogId,
        price: formatUsd(contentPriceCents(catalogId)),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const checkout = await createContentCheckout({
      userId: user.id,
      email: user.email,
      catalogId,
      title: item.title,
      origin: request.nextUrl.origin,
    });
    return NextResponse.json(checkout, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Purchase failed", 400);
  }
}
