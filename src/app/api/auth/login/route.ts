import { NextResponse, type NextRequest } from "next/server";
import { authenticateUser, publicUser } from "@/lib/auth/store";
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

  const user = await authenticateUser(body.email, body.password);
  if (!user) return jsonError("Invalid credentials", 401);

  const response = NextResponse.json(
    { user: publicUser(user) },
    { headers: { "Cache-Control": "no-store" } },
  );
  return await attachSession(response, user.id);
}
