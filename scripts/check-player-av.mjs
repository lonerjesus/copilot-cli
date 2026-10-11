#!/usr/bin/env node
/**
 * Guard: media player only accepts audio / video (vlog + live → video).
 */
import { pathToFileURL } from "node:url";

const modUrl = pathToFileURL(
  new URL("../src/data/catalog.ts", import.meta.url).pathname,
).href;

const { isPlayableMedia, playerAvKind, playableCatalog } = await import(modUrl);

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL ", msg);
    process.exitCode = 1;
  } else {
    console.log("PASS ", msg);
  }
}

assert(playerAvKind("audio") === "audio", "audio → audio");
assert(playerAvKind("video") === "video", "video → video");
assert(playerAvKind("vlog") === "video", "vlog → video");
assert(playerAvKind("live") === "video", "live → video");
assert(playerAvKind("writing") === null, "writing blocked");
assert(playerAvKind("essay") === null, "legacy essay blocked");
assert(playerAvKind("still") === null, "still blocked");
assert(playerAvKind("") === null, "empty blocked");

assert(isPlayableMedia({ kind: "audio" }), "playable audio");
assert(isPlayableMedia({ kind: "video" }), "playable video");
assert(isPlayableMedia({ kind: "vlog" }), "playable vlog");
assert(isPlayableMedia({ kind: "live" }), "playable live");
assert(!isPlayableMedia({ kind: "writing" }), "not playable writing");
assert(!isPlayableMedia({ kind: "still" }), "not playable still");
assert(!isPlayableMedia({ kind: "essay" }), "not playable essay");

const mixed = playableCatalog([
  { kind: "audio" },
  { kind: "writing" },
  { kind: "still" },
  { kind: "video" },
  { kind: "essay" },
]);
assert(
  mixed.length === 2 && mixed.every((i) => isPlayableMedia(i)),
  "playableCatalog strips non-AV",
);

if (process.exitCode) {
  console.error("== player AV guard failed ==");
  process.exit(1);
}
console.log("== player AV guard ok ==");
