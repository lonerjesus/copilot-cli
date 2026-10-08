/**
 * Unit checks for normalizeMediaRef — no network.
 * Usage: node --experimental-strip-types scripts/check-media-ref.mjs
 */
import { normalizeMediaRef } from "../src/lib/media-ref.ts";

let pass = 0;
let fail = 0;
function ok(name, cond, detail = "") {
  if (cond) {
    console.log(`PASS  ${name}`);
    pass++;
  } else {
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
    fail++;
  }
}

ok("empty", normalizeMediaRef("  ") === "");
ok(
  "house path",
  normalizeMediaRef("/api/media/house/abc-track.mp3") ===
    "/api/media/house/abc-track.mp3",
);
ok(
  "house prefix",
  normalizeMediaRef("house/abc-track.mp3") === "/api/media/house/abc-track.mp3",
);
ok(
  "bare mp3",
  normalizeMediaRef("uuid-track.mp3") === "/api/media/house/uuid-track.mp3",
);
ok(
  "bare aac",
  normalizeMediaRef("clip.aac") === "/api/media/house/clip.aac",
);
ok(
  "bare mov",
  normalizeMediaRef("take.mov") === "/api/media/house/take.mov",
);
ok(
  "bare webm",
  normalizeMediaRef("v.webm") === "/api/media/house/v.webm",
);
ok(
  "https untouched",
  normalizeMediaRef("https://cdn.example.com/a.mp3") ===
    "https://cdn.example.com/a.mp3",
);
ok("reject traversal", normalizeMediaRef("../evil.mp3") === "../evil.mp3");
ok(
  "reject slash escape",
  normalizeMediaRef("house/../x.mp3") === "house/../x.mp3",
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
