/**
 * Unit checks for resume / CONTINUE memory (no browser).
 * Usage: node --experimental-strip-types scripts/check-playback-memory.mjs
 */
import assert from "node:assert/strict";

// Minimal localStorage stub for Node.
const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
  dispatchEvent: () => true,
};
globalThis.Event = class Event {
  constructor(type) {
    this.type = type;
  }
};

const {
  rememberProgress,
  resumeSeekPercent,
  listContinues,
  clearResume,
  getResume,
} = await import("../src/lib/playback-memory.ts");

rememberProgress({
  id: "av-1",
  progress: 1,
  title: "Too early",
  kind: "audio",
  force: true,
});
assert.equal(getResume("av-1"), null, "ignore <3%");

rememberProgress({
  id: "av-1",
  progress: 42,
  title: "Streetpolitik cut",
  kind: "audio",
  force: true,
});
assert.equal(resumeSeekPercent("av-1"), 42);
assert.equal(listContinues()[0]?.id, "av-1");

rememberProgress({
  id: "av-1",
  progress: 97,
  title: "Streetpolitik cut",
  kind: "audio",
  force: true,
});
assert.equal(getResume("av-1"), null, "clear near end");

rememberProgress({
  id: "v-2",
  progress: 18,
  title: "Vlog",
  kind: "video",
  force: true,
});
rememberProgress({
  id: "a-3",
  progress: 55,
  title: "Track",
  kind: "audio",
  force: true,
});
const list = listContinues();
assert.equal(list.length, 2);
assert.equal(list[0].id, "a-3", "newest first");
clearResume("a-3");
assert.equal(listContinues().length, 1);

console.log("PASS  playback-memory checks");
