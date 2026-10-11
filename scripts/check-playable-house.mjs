/**
 * Landing queue: newest publishedAt first so ▶ starts latest AV.
 */
import assert from "node:assert/strict";
import { sortNewestFirst } from "../src/lib/playable-house.ts";

const rows = [
  {
    id: "up-old",
    title: "Old",
    kind: "audio",
    category: "audio",
    subcategory: "music",
    platform: "house",
    publishedAt: "2024-01-01",
    tags: [],
    blurb: "",
    paywalled: false,
  },
  {
    id: "up-new",
    title: "Latest",
    kind: "audio",
    category: "audio",
    subcategory: "music",
    platform: "house",
    publishedAt: "2026-10-11",
    tags: [],
    blurb: "",
    paywalled: false,
  },
  {
    id: "up-mid",
    title: "Mid",
    kind: "video",
    category: "video",
    subcategory: "vlog",
    platform: "house",
    publishedAt: "2025-06-01",
    tags: [],
    blurb: "",
    paywalled: false,
  },
];

const sorted = sortNewestFirst(rows);
assert.equal(sorted[0]?.id, "up-new", "latest first");
assert.equal(sorted[1]?.id, "up-mid", "mid second");
assert.equal(sorted[2]?.id, "up-old", "oldest last");
assert.equal(sorted[0]?.title, "Latest");

console.log("PASS  newest-first landing queue");
console.log("== playable-house order ok ==");
