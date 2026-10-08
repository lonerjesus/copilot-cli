/**
 * Unit checks for media-meta helpers (ID3 + duration format).
 * Usage: node --experimental-strip-types scripts/check-media-meta.mjs
 */
import { formatDuration, readId3Tags } from "../src/lib/media-meta.ts";

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

ok("dur-0", formatDuration(0) === "");
ok("dur-mmss", formatDuration(201) === "3:21");
ok("dur-hms", formatDuration(3723) === "1:02:03");

// Minimal ID3v2.3 with TIT2 "House Track" and TPE1 "Kamau"
function id3Frame(id, text) {
  const body = Buffer.from([0x03, ...Buffer.from(text, "utf8")]); // UTF-8 encoding byte
  const size = Buffer.alloc(4);
  size.writeUInt32BE(body.length, 0);
  return Buffer.concat([Buffer.from(id, "ascii"), size, Buffer.from([0, 0]), body]);
}
const frames = Buffer.concat([
  id3Frame("TIT2", "House Track"),
  id3Frame("TPE1", "Kamau"),
]);
const sizeSynch = Buffer.alloc(4);
// synchsafe size of frames
const fs = frames.length;
sizeSynch[0] = (fs >> 21) & 0x7f;
sizeSynch[1] = (fs >> 14) & 0x7f;
sizeSynch[2] = (fs >> 7) & 0x7f;
sizeSynch[3] = fs & 0x7f;
const id3 = Buffer.concat([
  Buffer.from("ID3"),
  Buffer.from([3, 0, 0]),
  sizeSynch,
  frames,
]);

const tags = readId3Tags(id3.buffer.slice(id3.byteOffset, id3.byteOffset + id3.byteLength));
ok("id3-title", tags.title === "House Track", String(tags.title));
ok("id3-artist", tags.artist === "Kamau", String(tags.artist));
ok("id3-empty", Object.keys(readId3Tags(new ArrayBuffer(4))).length === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
