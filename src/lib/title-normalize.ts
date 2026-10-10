/**
 * Display / compose title fixes — known typos + one separator style.
 * Does not invent new wording.
 */

const TYPO_FIXES: Array<[RegExp, string]> = [
  [/\bALphabet Boy\b/g, "Alphabet Boy"],
  [/Telling Show Of Love\s+™/g, "Telling Show Of Love™"],
];

/** Collapse mixed title separators to house middle-dot. */
function unifySeparators(value: string): string {
  return value
    .replace(/\s*[—–]\s*/g, " · ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function normalizeTitle(raw: string): string {
  let next = raw.trim();
  for (const [re, replacement] of TYPO_FIXES) {
    next = next.replace(re, replacement);
  }
  return unifySeparators(next);
}
