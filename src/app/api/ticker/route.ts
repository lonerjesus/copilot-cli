import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { AuthStoreUnavailableError } from "@/lib/auth/store";
import { jsonError } from "@/lib/commerce/checkout";
import { getSiteTicker } from "@/lib/ticker-store";

export const dynamic = "force-dynamic";

/** Authed members — active ticker text for the top strip. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("auth_required", 401);
  try {
    const ticker = await getSiteTicker();
    return NextResponse.json(
      {
        text: ticker.enabled ? ticker.text : "",
        enabled: ticker.enabled,
      },
      { headers: { "Cache-Control": "private, max-age=30" } },
    );
  } catch (err) {
    if (err instanceof AuthStoreUnavailableError) {
      return jsonError("auth_store_unavailable", 503);
    }
    throw err;
  }
}
