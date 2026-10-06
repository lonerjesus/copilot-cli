import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { clearSession, getSessionUser, SESSION_COOKIE } from "@/lib/auth/session";
import { publicUser } from "@/lib/auth/store";
import { jsonError } from "@/lib/commerce/checkout";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    const response = jsonError("auth_required", 401);
    // Drop stale HMAC cookies (superseded single-session or missing store row).
    const jar = await cookies();
    if (jar.get(SESSION_COOKIE)?.value) {
      return clearSession(response);
    }
    return response;
  }
  return NextResponse.json(
    { user: publicUser(user, { isAdmin: isAdminEmail(user.email) }) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
