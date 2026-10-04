import { NextResponse, type NextRequest } from "next/server";
import {
  AuthStoreUnavailableError,
  createUser,
  publicUser,
} from "@/lib/auth/store";
import { attachSession } from "@/lib/auth/session";
import { jsonError } from "@/lib/commerce/checkout";

export async function POST(request: NextRequest) {
  let body: {
    email?: string;
    password?: string;
    displayName?: string;
    ageConfirmed?: boolean;
    website?: string; // honeypot
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  // Honeypot — bots fill hidden fields
  if (body.website) {
    return jsonError("Rejected", 400);
  }
  if (!body.ageConfirmed) {
    return jsonError("You must confirm you are 18 or older", 400);
  }
  if (!body.email || !body.password) {
    return jsonError("Email and password required", 400);
  }

  try {
    const user = await createUser({
      email: body.email,
      password: body.password,
      displayName: body.displayName ?? "",
    });
    const response = NextResponse.json(
      { user: publicUser(user) },
      { headers: { "Cache-Control": "no-store" } },
    );
    return await attachSession(response, user.id);
  } catch (err) {
    if (err instanceof AuthStoreUnavailableError) {
      return jsonError(err.message, 503);
    }
    const message = err instanceof Error ? err.message : "Registration failed";
    if (message.includes("already exists")) return jsonError(message, 409);
    // Hide minified runtime noise (e.g. "e2.get is not a function") from clients.
    if (/is not a function|Cannot read|undefined/i.test(message)) {
      return jsonError(
        "Auth store misconfigured — bind AUTH_KV as a KV Namespace (not a Variable), then redeploy",
        503,
      );
    }
    return jsonError(message, 400);
  }
}
