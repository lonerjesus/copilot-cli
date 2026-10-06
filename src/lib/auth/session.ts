import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import {
  encodeSession,
  MAX_AGE_SEC,
  newSessionId,
  parseSessionToken,
  SESSION_COOKIE,
} from "@/lib/auth/token";
import {
  clearActiveSession,
  findUserById,
  setActiveSession,
  type StoredUser,
} from "@/lib/auth/store";

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

/** Issue a fresh session — replaces any prior login for this account. */
export async function attachSession(response: NextResponse, userId: string): Promise<NextResponse> {
  const sid = newSessionId();
  await setActiveSession(userId, sid);
  const token = await encodeSession(userId, sid);
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

async function userFromPayload(
  payload: { uid: string; sid: string } | null,
): Promise<StoredUser | null> {
  if (!payload) return null;
  const user = await findUserById(payload.uid);
  if (!user) return null;
  // One login at a time — cookie sid must match the stored active session.
  if (!user.activeSessionId || user.activeSessionId !== payload.sid) return null;
  return user;
}

export async function getSessionUserFromRequest(
  request: NextRequest,
): Promise<StoredUser | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = await parseSessionToken(token);
  return userFromPayload(payload);
}

export async function getSessionUser(): Promise<StoredUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const payload = await parseSessionToken(token);
  return userFromPayload(payload);
}

/** Clear cookie + revoke active session id (logout). */
export async function endSession(response: NextResponse, userId?: string | null): Promise<NextResponse> {
  if (userId) {
    try {
      await clearActiveSession(userId);
    } catch {
      /* still clear cookie */
    }
  }
  return clearSession(response);
}
