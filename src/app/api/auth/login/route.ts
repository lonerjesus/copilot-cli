import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { normalizeEmail } from "@/lib/auth/email";
import {
  AuthStoreUnavailableError,
  authenticateUser,
  publicUser,
} from "@/lib/auth/store";
import { attachSession } from "@/lib/auth/session";
import { jsonError } from "@/lib/commerce/checkout";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string; website?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  if (body.website) return jsonError("Rejected", 400);
  if (!body.email || !body.password) {
    return jsonError("Email and password required", 400);
  }

  try {
    const user = await authenticateUser(normalizeEmail(body.email), body.password);
    if (!user) return jsonError("Invalid credentials", 401);

    const response = NextResponse.json(
      { user: publicUser(user, { isAdmin: isAdminEmail(user.email) }) },
      { headers: { "Cache-Control": "no-store" } },
    );
    return await attachSession(response, user.id);
  } catch (err) {
    if (err instanceof AuthStoreUnavailableError) {
      return jsonError(err.message, 503);
    }
    const message = err instanceof Error ? err.message : "Login failed";
    if (/is not a function|Cannot read|undefined/i.test(message)) {
      return jsonError(
        "Auth store misconfigured — bind AUTH_KV as a KV Namespace (not a Variable), then redeploy",
        503,
      );
    }
    return jsonError(message, 500);
  }
}
