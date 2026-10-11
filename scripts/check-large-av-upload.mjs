/**
 * Large AV upload guards — ceiling, aligned chunks, HEVC sniff.
 */
import assert from "node:assert/strict";
import {
  COMPLETE_PROMOTE_BATCH,
  MAX_MEDIA_BYTES,
  UPLOAD_CHUNK_BYTES,
  sniffMediaContentType,
  validateUploadFile,
} from "../src/lib/media-store.ts";

assert.ok(MAX_MEDIA_BYTES >= 1536 * 1024 * 1024, "ceiling ≥ 1.5 GiB for ~15 min");
assert.equal(UPLOAD_CHUNK_BYTES, 3 * 1024 * 1024, "upload parts align with KV 3 MiB");
assert.ok(COMPLETE_PROMOTE_BATCH >= 16, "complete batches enough parts per request");

// 124.5 MB sample (screenshot) must be under ceiling
const sample = 124.5 * 1024 * 1024;
assert.ok(sample < MAX_MEDIA_BYTES, "124.5 MB phone clip accepted");

// ~15 min @ 8 Mbps ≈ 900 MB
const fifteenMin = (8_000_000 / 8) * 60 * 15;
assert.ok(fifteenMin < MAX_MEDIA_BYTES, "15 min @ 8 Mbps under ceiling");

// ISO-BMFF with hev1 brand → video (not HEIC reject)
const hevc = new Uint8Array(32);
hevc[0] = 0;
hevc[1] = 0;
hevc[2] = 0;
hevc[3] = 0x18;
hevc.set([0x66, 0x74, 0x79, 0x70], 4); // ftyp
hevc.set([0x68, 0x65, 0x76, 0x31], 8); // hev1
assert.equal(sniffMediaContentType(hevc.buffer), "video/mp4");

const { contentType } = validateUploadFile(
  { type: "video/hevc", size: sample, name: "clip.mov" },
  "media",
);
assert.equal(contentType, "video/mp4");

assert.throws(
  () => validateUploadFile({ type: "video/mp4", size: MAX_MEDIA_BYTES + 1 }, "media"),
  /file_too_large/,
);

console.log("PASS  large AV upload guards");
console.log("== large-av-upload ok ==");
