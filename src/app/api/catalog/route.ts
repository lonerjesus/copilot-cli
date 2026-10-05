import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/commerce/checkout";
import { getLiveCatalog } from "@/lib/live-catalog";

/** Authed members get seed catalog + admin uploads. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("auth_required", 401);
  try {
    const items = await getLiveCatalog();
    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "private, max-age=30" } },
    );
  } catch {
    return jsonError("catalog_unavailable", 503);
  }
}
