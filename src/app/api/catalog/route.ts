import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/commerce/checkout";
import { houseCatalog } from "@/data/catalog";
import { getLiveCatalog } from "@/lib/live-catalog";

/** Authed members get house originals only (Netflix stream). Outside → Footprint. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("auth_required", 401);
  try {
    const items = houseCatalog(await getLiveCatalog());
    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "private, max-age=30" } },
    );
  } catch {
    return jsonError("catalog_unavailable", 503);
  }
}
