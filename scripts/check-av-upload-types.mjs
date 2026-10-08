#!/usr/bin/env node
/**
 * Guard: MP3 + common AV variants validate for house media upload.
 * Runs against TypeScript source via Node strip-types.
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// Prefer compiled-free import of the TS module (Node 22+).
const modUrl = pathToFileURL(
  new URL("../src/lib/media-store.ts", import.meta.url).pathname,
).href;

const {
  validateUploadFile,
  sniffMediaContentType,
  ALLOWED_MEDIA_TYPES,
  mediaAcceptAttribute,
  audioAcceptAttribute,
} = await import(modUrl);

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL ", msg);
    process.exitCode = 1;
  } else {
    console.log("PASS ", msg);
  }
}

// Minimal ID3 + frame sync stub
const mp3 = new Uint8Array(128);
mp3[0] = 0x49; // I
mp3[1] = 0x44; // D
mp3[2] = 0x33; // 3
mp3[3] = 0x03;
mp3[10] = 0xff;
mp3[11] = 0xfb;

// WAV: RIFF....WAVE
const wav = new Uint8Array(44);
wav.set([0x52, 0x49, 0x46, 0x46], 0);
wav.set([0x57, 0x41, 0x56, 0x45], 8);

// FLAC
const flac = new Uint8Array([0x66, 0x4c, 0x61, 0x43, 0x00, 0x00, 0x00, 0x22]);

// ftyp M4A
const m4a = new Uint8Array(32);
m4a[4] = 0x66; // f
m4a[5] = 0x74; // t
m4a[6] = 0x79; // y
m4a[7] = 0x70; // p
m4a.set([0x4d, 0x34, 0x41, 0x20], 8); // "M4A "

assert(sniffMediaContentType(mp3.buffer) === "audio/mpeg", "sniff mp3/ID3");
assert(sniffMediaContentType(wav.buffer) === "audio/wav", "sniff wav");
assert(sniffMediaContentType(flac.buffer) === "audio/flac", "sniff flac");
assert(sniffMediaContentType(m4a.buffer) === "audio/mp4", "sniff m4a");

const cases = [
  [{ type: "audio/mpeg", size: 2048, name: "track.mp3" }, mp3.buffer, "audio/mpeg"],
  [{ type: "", size: 2048, name: "track.mp3" }, mp3.buffer, "audio/mpeg"],
  [{ type: "application/octet-stream", size: 2048, name: "drop.bin" }, mp3.buffer, "audio/mpeg"],
  [{ type: "audio/mp3", size: 2048, name: "a.mp3" }, undefined, "audio/mpeg"],
  [{ type: "audio/x-m4a", size: 2048, name: "a.m4a" }, m4a.buffer, "audio/mp4"],
  [{ type: "", size: 2048, name: "voice.m4a" }, undefined, "audio/mp4"],
  [{ type: "audio/wav", size: 2048, name: "hit.wav" }, wav.buffer, "audio/wav"],
  [{ type: "", size: 2048, name: "stem.flac" }, flac.buffer, "audio/flac"],
  [{ type: "video/mp4", size: 4096, name: "clip.mp4" }, undefined, "video/mp4"],
  [{ type: "video/quicktime", size: 4096, name: "clip.mov" }, undefined, "video/quicktime"],
];

for (const [file, data, expect] of cases) {
  try {
    const { contentType } = validateUploadFile(file, "media", data);
    assert(contentType === expect, `validate ${file.name || file.type} → ${contentType}`);
  } catch (err) {
    assert(false, `validate ${file.name}: ${err.message}`);
  }
}

assert(ALLOWED_MEDIA_TYPES.media.includes("audio/mpeg"), "allow audio/mpeg");
assert(ALLOWED_MEDIA_TYPES.media.includes("audio/mp4"), "allow audio/mp4");
assert(ALLOWED_MEDIA_TYPES.media.includes("audio/flac"), "allow audio/flac");
assert(mediaAcceptAttribute().includes(".mp3"), "accept lists .mp3");
assert(audioAcceptAttribute().includes(".m4a"), "audio accept lists .m4a");

// Reject nonsense
try {
  validateUploadFile({ type: "application/pdf", size: 100, name: "x.pdf" }, "media");
  assert(false, "pdf should reject");
} catch (err) {
  assert(err.message === "invalid_type", "pdf → invalid_type");
}

if (process.exitCode) {
  console.error("AV upload type checks failed");
  process.exit(1);
}
console.log("== av upload types ok ==");
