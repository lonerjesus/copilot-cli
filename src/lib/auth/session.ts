import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import {
  encodeSession,
  MAX_AGE_SEC,
  parseSessionToken,
  SESSION_COOKIE,
} from "@/lib/auth/token";
import { findUserById, type StoredUser } from "@/lib/auth/store";

export { SESSION_COOKIE } from "@/lib/auth/token";

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SEC,
  };
}

export async function attachSession(response: NextResponse, userId: string): Promise<NextResponse> {
  const token = await encodeSession(userId);
  response.cookies.set(sessionCookieOptions(token));
  return response;
}

export function clearSession(response: NextResponse): NextResponse {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function getSessionUserFromRequest(
  request: NextRequest,
): Promise<StoredUser | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = await parseSessionToken(token);
  if (!payload) return null;
  return findUserById(payload.uid);
}

export async function getSessionUser(): Promise<StoredUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const payload = await parseSessionToken(token);
  if (!payload) return null;
  return findUserById(payload.uid);
}
