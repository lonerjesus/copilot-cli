import { NextResponse, type NextRequest } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import { grantPurchase, recordDonation, publicUser } from "@/lib/auth/store";
import { jsonError } from "@/lib/commerce/checkout";

/**
 * Stripe webhook stub — verifies shared secret header when configured.
 * Demo mode does not need this; entitlements are granted at checkout create.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (secret) {
    const header = request.headers.get("stripe-signature") ?? "";
    if (!header.includes(secret) && header !== secret) {
      // Full Stripe signature verification requires raw body + stripe lib;
      // require exact shared secret header for this lightweight adapter.
      const auth = request.headers.get("x-kn-webhook-secret");
      if (auth !== secret) return jsonError("invalid_signature", 401);
    }
  } else if (process.env.PAYMENTS_MODE === "stripe") {
    return jsonError("STRIPE_WEBHOOK_SECRET not configured", 503);
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

  // Optional: return refreshed user when caller is session-authenticated (admin tools)
  const sessionUser = await getSessionUserFromRequest(request);
  return NextResponse.json(
    {
      received: true,
      user: sessionUser ? publicUser(sessionUser) : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
