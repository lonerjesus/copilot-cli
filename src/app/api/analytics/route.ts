import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { AuthStoreUnavailableError } from "@/lib/auth/store";
import { recordAnalyticsEvent } from "@/lib/analytics-store";
import { jsonError } from "@/lib/commerce/checkout";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("auth_required", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_json", 400);
  }

  if (!body || typeof body !== "object") return jsonError("invalid_body", 400);
  const o = body as Record<string, unknown>;
  const signal = String(o.signal ?? "").trim();
  if (!signal) return jsonError("missing_signal", 400);

  let meta: Record<string, string | number | boolean> | undefined;
  if (o.meta && typeof o.meta === "object") {
    meta = {};
    for (const [k, v] of Object.entries(o.meta as Record<string, unknown>)) {
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        meta[k] = v;
      }
    }
  }

  try {
    await recordAnalyticsEvent({
      signal,
      meta,
      userId: user.id,
    });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof AuthStoreUnavailableError) {
      return jsonError("auth_store_unavailable", 503);
    }
    throw err;
  }
}
