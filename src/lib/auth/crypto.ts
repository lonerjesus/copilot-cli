import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEYLEN = 64;

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV !== "production") {
    return "kn-dev-auth-secret-change-me";
  }
  throw new Error("AUTH_SECRET must be set (≥16 chars) in production");
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const useSalt = salt ?? randomBytes(16).toString("hex");
  const hash = scryptSync(password, useSalt, SCRYPT_KEYLEN).toString("hex");
  return { hash, salt: useSalt };
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const { hash } = hashPassword(password, salt);
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"));
  } catch {
    return false;
  }
}

export function signPayload(payload: string, secret = getAuthSecret()): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
