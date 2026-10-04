import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import { assertDonationAmount, createDonationCheckout, jsonError } from "@/lib/commerce/checkout";

export async function POST(request: NextRequest) {
  const user = await getSessionUserFromRequest(request);
  if (!user) return jsonError("auth_required", 401);

  let body: { cents?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  try {
    const cents = Math.round(Number(body.cents));
    assertDonationAmount(cents);
    const checkout = await createDonationCheckout({
      userId: user.id,
      email: user.email,
      cents,
      origin: request.nextUrl.origin,
    });
    return NextResponse.json(checkout, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError("Donation failed", 400);
  }
}
