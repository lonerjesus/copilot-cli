import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { getSessionUser } from "@/lib/auth/session";
import { publicUser } from "@/lib/auth/store";
import { jsonError } from "@/lib/commerce/checkout";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("auth_required", 401);
  return NextResponse.json(
    { user: publicUser(user, { isAdmin: isAdminEmail(user.email) }) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
