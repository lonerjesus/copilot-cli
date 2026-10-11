/**
 * Unit checks for collection helpers + ZIP unpack (store method).
 * Usage: node --experimental-strip-types scripts/check-collection-zip.mjs
 */
import assert from "node:assert/strict";
import { deflateRawSync } from "node:zlib";

const {
  slugifyCollection,
  validateCollection,
  mergeCollectionTags,
  groupByCollection,
  sortMediaFiles,
  trackIndexFromName,
} = await import("../src/lib/collection.ts");

assert.equal(slugifyCollection("Telling Songs As Content"), "telling-songs-as-content");
assert.equal(trackIndexFromName("03_intro.mp3", 9), 3);
assert.equal(trackIndexFromName("bridge.mp3", 4), 4);

const col = validateCollection({
  type: "album",
  title: "Good;Sloppy.",
  index: 2,
});
assert.equal(col?.id, "good-sloppy");
assert.deepEqual(
  mergeCollectionTags(["music"], col),
  ["album:good-sloppy", "album", "track:02", "music"],
);

const groups = groupByCollection([
  {
    id: "a",
    title: "Two",
    brand: "KAMAU NEGASI",
    kind: "audio",
    category: "audio",
    subcategory: "music",
    publishedAt: "2026-01-02",
    platform: "house",
    externalUrl: "https://www.kamaunegasi.net/",
    tags: [],
    blurb: "x",
    collection: { type: "album", id: "demo", title: "Demo", index: 2 },
  },
  {
    id: "b",
    title: "One",
    brand: "KAMAU NEGASI",
    kind: "audio",
    category: "audio",
    subcategory: "music",
    publishedAt: "2026-01-01",
    platform: "house",
    externalUrl: "https://www.kamaunegasi.net/",
    tags: [],
    blurb: "x",
    collection: { type: "album", id: "demo", title: "Demo", index: 1 },
  },
]);
assert.equal(groups.length, 1);
assert.equal(groups[0].items[0].title, "One");

const sorted = sortMediaFiles([
  new File([""], "10-z.mp3"),
  new File([""], "2-a.mp3"),
]);
assert.equal(sorted[0].name, "2-a.mp3");

// —— ZIP store + deflate ——
const { unpackZip, isZipFile } = await import("../src/lib/zip-unpack.ts");

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function buildZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, "utf8");
    const data = Buffer.from(e.data);
    const method = e.method ?? 0;
    const payload = method === 8 ? deflateRawSync(data) : data;
    const crc = crc32(data);
    const local = Buffer.alloc(30 + name.length + payload.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(payload.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    payload.copy(local, 30 + name.length);
    locals.push(local);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(payload.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centrals.push(central);
    offset += local.length;
  }
  const centralStart = offset;
  const centralBuf = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(centralStart, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, centralBuf, eocd]);
}

// Polyfill DecompressionStream for Node if missing (Node 22+ has it).
if (typeof globalThis.DecompressionStream === "undefined") {
  const { DecompressionStream } = await import("node:stream/web");
  globalThis.DecompressionStream = DecompressionStream;
}

const storeZip = buildZip([
  { name: "01-alpha.mp3", data: "ALPHA" },
  { name: "__MACOSX/._skip", data: "nope" },
  { name: "folder/", data: "" },
  { name: "02-beta.mp3", data: "BETA", method: 8 },
]);
const zipFile = new File([storeZip], "album.zip", { type: "application/zip" });
assert.equal(isZipFile(zipFile), true);
const unpacked = await unpackZip(zipFile);
assert.equal(unpacked.length, 2);
assert.equal(unpacked[0].name, "01-alpha.mp3");
assert.equal(await unpacked[0].text(), "ALPHA");
assert.equal(unpacked[1].name, "02-beta.mp3");
assert.equal(await unpacked[1].text(), "BETA");

console.log("PASS  collection + zip checks");
