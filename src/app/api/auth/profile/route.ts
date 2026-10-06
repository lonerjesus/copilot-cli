import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import {
  AuthStoreUnavailableError,
  publicUser,
  updateUserBirthDate,
} from "@/lib/auth/store";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import { jsonError } from "@/lib/commerce/checkout";

/** Set / update birth date (authenticated, 18+). */
export async function PATCH(request: NextRequest) {
  const session = await getSessionUserFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);

  let body: { birthDate?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  if (!body.birthDate) return jsonError("birthDate required", 400);

  try {
    const user = await updateUserBirthDate(session.id, body.birthDate);
    if (!user) return jsonError("User not found", 404);
    return NextResponse.json(
      { user: publicUser(user, { isAdmin: isAdminEmail(user.email) }) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof AuthStoreUnavailableError) {
      return jsonError(err.message, 503);
    }
    const message = err instanceof Error ? err.message : "Update failed";
    return jsonError(message, 400);
  }
}
