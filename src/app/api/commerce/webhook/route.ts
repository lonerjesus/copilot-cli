import { NextResponse, type NextRequest } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import { grantPurchase, recordDonation, publicUser } from "@/lib/auth/store";
import { jsonError } from "@/lib/commerce/checkout";
import { safeEqual } from "@/lib/auth/crypto";

/**
 * Stripe entitlement webhook — fail closed.
 * Requires STRIPE_WEBHOOK_SECRET via x-kn-webhook-secret (shared secret).
 * Demo entitlements are granted only at authenticated checkout-create in non-prod.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret || secret.length < 16) {
    return jsonError("webhook_disabled", 503);
  }

  const provided = request.headers.get("x-kn-webhook-secret") ?? "";
  if (!provided || !safeEqual(provided, secret)) {
    return jsonError("invalid_signature", 401);
  }

  let body: {
    type?: string;
    data?: {
      object?: {
        metadata?: { kind?: string; userId?: string; catalogId?: string };
        amount_total?: number;
      };
    };
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  if (body.type === "checkout.session.completed") {
    const meta = body.data?.object?.metadata ?? {};
    if (meta.kind === "content" && meta.userId && meta.catalogId) {
      await grantPurchase(meta.userId, meta.catalogId);
    }
    if (meta.kind === "donation" && meta.userId) {
      const cents = Number(body.data?.object?.amount_total ?? 0);
      if (cents > 0) await recordDonation(meta.userId, cents, "stripe");
    }
  }

  const sessionUser = await getSessionUserFromRequest(request);
  return NextResponse.json(
    {
      received: true,
      user: sessionUser ? publicUser(sessionUser) : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
