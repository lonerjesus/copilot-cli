import { NextResponse, type NextRequest } from "next/server";
import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import { jsonError } from "@/lib/commerce/checkout";

/**
 * Forgot-password stub — Auth pack will send real reset mail.
 * Always returns a generic OK so callers cannot probe which emails exist.
 * Does not send email and does not mutate the auth store.
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; website?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  if (body.website) return jsonError("Rejected", 400);

  const email = normalizeEmail(body.email ?? "");
  if (!isValidEmail(email)) {
    return jsonError("Valid email required", 400);
  }

  return NextResponse.json(
    {
      ok: true,
      stub: true,
      message:
        "If an account exists for that email, a reset link will be sent when email reset is enabled.",
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
