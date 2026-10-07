import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { getSessionUser } from "@/lib/auth/session";
import { AuthStoreUnavailableError } from "@/lib/auth/store";
import { jsonError } from "@/lib/commerce/checkout";
import { getSiteTicker, MAX_TICKER_CHARS, setSiteTicker } from "@/lib/ticker-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("auth_required", 401);
  if (!isAdminEmail(user.email)) return jsonError("forbidden", 403);
  try {
    const ticker = await getSiteTicker();
    return NextResponse.json(
      { ticker, maxChars: MAX_TICKER_CHARS },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof AuthStoreUnavailableError) {
      return jsonError("auth_store_unavailable", 503);
    }
    throw err;
  }
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("auth_required", 401);
  if (!isAdminEmail(user.email)) return jsonError("forbidden", 403);

  let body: { text?: string; enabled?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", 400);
  }

  try {
    const ticker = await setSiteTicker({
      text: String(body.text ?? ""),
      enabled: body.enabled !== false,
      updatedBy: user.email,
    });
    return NextResponse.json(
      { ticker },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof AuthStoreUnavailableError) {
      return jsonError("auth_store_unavailable", 503);
    }
    const message = err instanceof Error ? err.message : "save_failed";
    return jsonError(message, 400);
  }
}
