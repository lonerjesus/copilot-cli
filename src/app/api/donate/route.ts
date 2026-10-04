import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import { createDonationCheckout, jsonError } from "@/lib/commerce/checkout";
import { MIN_DONATION_CENTS } from "@/data/commerce";

export async function POST(request: NextRequest) {
  const user = await getSessionUserFromRequest(request);
  if (!user) return jsonError("auth_required", 401);

  let body: { cents?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const cents = Number(body.cents);
  if (!Number.isFinite(cents) || cents < MIN_DONATION_CENTS) {
    return jsonError(`Minimum donation is $${(MIN_DONATION_CENTS / 100).toFixed(2)}`, 400);
  }

  try {
    const origin = request.nextUrl.origin;
    const checkout = await createDonationCheckout({
      userId: user.id,
      email: user.email,
      cents: Math.round(cents),
      origin,
    });
    return NextResponse.json(checkout, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Donation failed", 400);
  }
}
