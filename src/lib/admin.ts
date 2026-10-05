/**
 * Owner-only admin gate.
 * Set ADMIN_EMAIL (or comma-separated ADMIN_EMAILS) to the sole account(s)
 * allowed into /admin. Empty list → nobody is admin (fail closed).
 */

export function adminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = adminEmails();
  if (list.length === 0) return false;
  return list.includes(email.trim().toLowerCase());
}
