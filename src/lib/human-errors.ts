/**
 * Matter-of-fact auth/API errors (i-have-adhd rule 8).
 * Map machine codes → cause + next action. Never "uh oh".
 */

const AUTH: Record<string, string> = {
  invalid_credentials: "Wrong email or password. Check both, then sign in again.",
  invalid_email: "Email looks wrong. Fix the address, then try again.",
  email_taken: "That email already has an account. Sign in instead.",
  weak_password: "Password too short. Use at least the minimum length shown.",
  age_required: "Confirm you are 18+, then create the account.",
  underage: "You must be 18 or older to enter.",
  forbidden: "Request blocked. Reload the page, then try again.",
  rate_limited: "Too many tries. Wait about 60 seconds, then try once.",
  auth_required: "Sign in first, then retry.",
  auth_store_unavailable: "Account store offline. Wait ~1 minute, then try again.",
  network_error: "Network failed. Check connection, then retry.",
  Request_failed: "Request failed. Retry once.",
};

export function humanAuthError(code: string | undefined): string {
  const key = (code ?? "").trim();
  if (!key) return "Request failed. Retry once.";
  if (AUTH[key]) return AUTH[key];
  // Pass through short human messages; flatten snake_case codes.
  if (key.includes(" ") && key.length < 120) return key;
  const spaced = key.replace(/_/g, " ");
  return `${spaced}. Retry once.`;
}

export function humanNetworkError(): string {
  return AUTH.network_error;
}
