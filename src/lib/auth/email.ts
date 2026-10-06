/** Lightweight email shape check — not full RFC 5322. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(raw: string): boolean {
  const email = raw.trim().toLowerCase();
  if (!email || email.length > 254) return false;
  if (email.includes("..")) return false;
  return EMAIL_RE.test(email);
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}
