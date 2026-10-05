import { NextResponse } from "next/server";
import {
  contentPriceCents,
  MIN_DONATION_CENTS,
  MAX_DONATION_CENTS,
} from "@/data/commerce";
import { SITE } from "@/data/identity";
import { grantPurchase, recordDonation } from "@/lib/auth/store";
import { randomToken } from "@/lib/auth/crypto";

export type PaymentsMode = "demo" | "stripe";

/**
 * Prefer configured site origin for Stripe return URLs.
 * Localhost / preview origins stay as-is for demo flows.
 */
export function checkoutOrigin(requestOrigin: string): string {
  const raw = (process.env.SITE_URL || process.env.SITE_DOMAIN || SITE.url).trim();
  const configured = raw.startsWith("http")
    ? raw.replace(/\/$/, "")
    : `https://${raw.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  try {
    const req = new URL(requestOrigin);
    const host = req.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".workers.dev")) {
      return requestOrigin.replace(/\/$/, "");
    }
  } catch {
    /* use configured */
  }
  return configured;
}

/** Demo grants only when explicitly allowed (local/staging). Production never free-grants. */
export function paymentsMode(): PaymentsMode {
  const mode = process.env.PAYMENTS_MODE?.trim().toLowerCase();
  const allowDemo =
    process.env.ALLOW_DEMO_PAYMENTS === "1" || process.env.NODE_ENV !== "production";

  if (mode === "demo") {
    if (!allowDemo) {
      throw new Error("Demo payments are disabled in production");
    }
    return "demo";
  }
  if (mode === "stripe") return "stripe";
  if (process.env.STRIPE_SECRET_KEY?.startsWith("sk_")) return "stripe";
  if (allowDemo) return "demo";
  return "stripe";
}

export function assertDonationAmount(cents: number) {
  if (!Number.isFinite(cents) || cents < MIN_DONATION_CENTS) {
    throw new Error(`Minimum donation is $${(MIN_DONATION_CENTS / 100).toFixed(2)}`);
  }
  if (cents > MAX_DONATION_CENTS) {
    throw new Error(`Maximum donation is $${(MAX_DONATION_CENTS / 100).toFixed(2)}`);
  }
}

async function stripeRequest(
  path: string,
  body: URLSearchParams,
): Promise<{ ok: boolean; data: Record<string, unknown>; error?: string }> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { ok: false, data: {}, error: "STRIPE_SECRET_KEY missing" };
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    return {
      ok: false,
      data,
      error: typeof data.error === "object" && data.error && "message" in data.error
        ? String((data.error as { message?: string }).message)
        : "Stripe error",
    };
  }
  return { ok: true, data };
}

export async function createDonationCheckout(input: {
  userId: string;
  email: string;
  cents: number;
  origin: string;
}): Promise<{ url: string; mode: PaymentsMode; sessionId: string }> {
  assertDonationAmount(input.cents);

  const origin = checkoutOrigin(input.origin);
  const mode = paymentsMode();
  if (mode === "demo") {
    await recordDonation(input.userId, input.cents, "demo");
    return {
      url: `${origin}/?donated=1&amount=${input.cents}`,
      mode,
      sessionId: `demo_don_${randomToken(10)}`,
    };
  }

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${origin}/?donated=1&session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${origin}/?donate=cancel`);
  params.set("customer_email", input.email);
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(input.cents));
  params.set("line_items[0][price_data][product_data][name]", "Support kamaunegasi.net");
  params.set(
    "line_items[0][price_data][product_data][description]",
    "Donation to keep the autonomous portfolio signal online",
  );
  params.set("line_items[0][quantity]", "1");
  params.set("metadata[kind]", "donation");
  params.set("metadata[userId]", input.userId);

  const result = await stripeRequest("checkout/sessions", params);
  if (!result.ok || typeof result.data.url !== "string") {
    throw new Error(result.error ?? "Checkout failed");
  }
  return {
    url: result.data.url,
    mode,
    sessionId: String(result.data.id ?? ""),
  };
}

export async function createContentCheckout(input: {
  userId: string;
  email: string;
  catalogId: string;
  title: string;
  origin: string;
  priceOverride?: number;
}): Promise<{ url: string; mode: PaymentsMode; sessionId: string }> {
  const cents = contentPriceCents(input.catalogId, input.priceOverride);
  const origin = checkoutOrigin(input.origin);
  if (cents <= 0) {
    await grantPurchase(input.userId, input.catalogId);
    return {
      url: `${origin}/?purchased=${encodeURIComponent(input.catalogId)}`,
      mode: "demo",
      sessionId: `free_${input.catalogId}`,
    };
  }

  const mode = paymentsMode();
  if (mode === "demo") {
    await grantPurchase(input.userId, input.catalogId);
    return {
      url: `${origin}/?purchased=${encodeURIComponent(input.catalogId)}`,
      mode,
      sessionId: `demo_buy_${randomToken(10)}`,
    };
  }

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set(
    "success_url",
    `${origin}/?purchased=${encodeURIComponent(input.catalogId)}&session_id={CHECKOUT_SESSION_ID}`,
  );
  params.set("cancel_url", `${origin}/?buy=cancel`);
  params.set("customer_email", input.email);
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(cents));
  params.set("line_items[0][price_data][product_data][name]", input.title);
  params.set(
    "line_items[0][price_data][product_data][description]",
    `Paid download license · ${input.catalogId}`,
  );
  params.set("line_items[0][quantity]", "1");
  params.set("metadata[kind]", "content");
  params.set("metadata[userId]", input.userId);
  params.set("metadata[catalogId]", input.catalogId);

  const result = await stripeRequest("checkout/sessions", params);
  if (!result.ok || typeof result.data.url !== "string") {
    throw new Error(result.error ?? "Checkout failed");
  }
  return {
    url: result.data.url,
    mode,
    sessionId: String(result.data.id ?? ""),
  };
}

export function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
