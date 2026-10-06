import { NextResponse } from "next/server";
import { endSession, getSessionUser } from "@/lib/auth/session";

export async function POST() {
  const user = await getSessionUser();
  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
  return endSession(response, user?.id);
}
