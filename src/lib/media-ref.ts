/** Extensions accepted for bare house-key repair (keep in sync with media-store). */
const HOUSE_FILE_EXT =
  "jpe?g|png|webp|gif|mp3|mpga|m4a|aac|wav|wave|flac|ogg|oga|opus|weba|mp4|m4v|mov|qt|webm|ogv|3gp|3g2";

const BARE_HOUSE_FILE = new RegExp(
  `^[A-Za-z0-9._-]+\\.(?:${HOUSE_FILE_EXT})$`,
  "i",
);

/**
 * House uploads use same-origin paths (`/api/media/house/…`).
 * Browsers reject those on `<input type="url">` — keep text inputs and
 * normalize bare house keys before PATCH/POST.
 */
export function normalizeMediaRef(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (v.includes("..") || v.includes("\\")) return v;
  if (v.startsWith("/api/media/house/")) return v;
  if (v.startsWith("house/")) return `/api/media/${v}`;
  // Filename-only remnant from a house key (uuid-or-prefix + sanitized name).
  if (BARE_HOUSE_FILE.test(v)) {
    return `/api/media/house/${v}`;
  }
  return v;
}
