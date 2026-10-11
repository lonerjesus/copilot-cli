/**
 * Browser-only ZIP unpack for admin album/series batch drops.
 * Supports store (0) + deflate (8) via native DecompressionStream — no npm deps.
 * Never run this on the Worker (OOM risk).
 */

const LOCAL_SIG = 0x04034b50;
const CENTRAL_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;

const DEFAULT_MAX_FILES = 48;
/**
 * Cap archive + uncompressed payload in the admin tab.
 * Browser holds the ZIP + inflated entries in RAM — keep well under the 1.5 GiB
 * per-file house ceiling so a series ZIP cannot OOM the station.
 */
const DEFAULT_MAX_TOTAL = 512 * 1024 * 1024;

export type ZipUnpackOptions = {
  maxFiles?: number;
  maxTotalBytes?: number;
};

function u16(view: DataView, at: number): number {
  return view.getUint16(at, true);
}

function u32(view: DataView, at: number): number {
  return view.getUint32(at, true);
}

function findEocd(buf: ArrayBuffer): number {
  const u = new Uint8Array(buf);
  const view = new DataView(buf);
  // EOCD is at the end; comment ≤ 64 KiB.
  const min = Math.max(0, u.length - 22 - 0xffff);
  for (let i = u.length - 22; i >= min; i--) {
    if (u32(view, i) === EOCD_SIG) return i;
  }
  throw new Error("zip_invalid");
}

type CentralEntry = {
  name: string;
  method: number;
  compSize: number;
  uncompSize: number;
  localOffset: number;
};

function parseCentral(buf: ArrayBuffer): CentralEntry[] {
  const view = new DataView(buf);
  const eocd = findEocd(buf);
  const total = u16(view, eocd + 10);
  let offset = u32(view, eocd + 16);
  const entries: CentralEntry[] = [];
  for (let n = 0; n < total; n++) {
    if (offset + 46 > buf.byteLength) throw new Error("zip_corrupt");
    if (u32(view, offset) !== CENTRAL_SIG) throw new Error("zip_corrupt");
    const method = u16(view, offset + 10);
    const compSize = u32(view, offset + 20);
    const uncompSize = u32(view, offset + 24);
    const nameLen = u16(view, offset + 28);
    const extraLen = u16(view, offset + 30);
    const commentLen = u16(view, offset + 32);
    const localOffset = u32(view, offset + 42);
    const nameStart = offset + 46;
    const nameBytes = new Uint8Array(buf, nameStart, nameLen);
    const name = new TextDecoder("utf-8").decode(nameBytes);
    entries.push({ name, method, compSize, uncompSize, localOffset });
    offset = nameStart + nameLen + extraLen + commentLen;
  }
  return entries;
}

function shouldSkipEntry(name: string): boolean {
  const n = name.replace(/\\/g, "/");
  if (!n || n.endsWith("/")) return true;
  if (n.startsWith("__MACOSX/") || n.includes("/__MACOSX/")) return true;
  const base = n.split("/").pop() ?? n;
  if (base === ".DS_Store" || base.startsWith("._")) return true;
  return false;
}

function basename(path: string): string {
  const n = path.replace(/\\/g, "/");
  return n.split("/").pop() || n;
}

function asBlobPart(data: Uint8Array): BlobPart {
  // Copy into a concrete ArrayBuffer so TS BlobPart accepts the view.
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return copy;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("zip_deflate_unsupported");
  }
  const ds = new DecompressionStream("deflate-raw");
  const stream = new Blob([asBlobPart(data)]).stream().pipeThrough(ds);
  const ab = await new Response(stream).arrayBuffer();
  return new Uint8Array(ab);
}

function guessMime(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".mp3") || lower.endsWith(".mpga")) return "audio/mpeg";
  if (lower.endsWith(".m4a")) return "audio/mp4";
  if (lower.endsWith(".aac")) return "audio/aac";
  if (lower.endsWith(".wav") || lower.endsWith(".wave")) return "audio/wav";
  if (lower.endsWith(".flac")) return "audio/flac";
  if (lower.endsWith(".ogg") || lower.endsWith(".oga")) return "audio/ogg";
  if (lower.endsWith(".opus")) return "audio/opus";
  if (lower.endsWith(".mp4") || lower.endsWith(".m4v")) return "video/mp4";
  if (lower.endsWith(".mov") || lower.endsWith(".qt")) return "video/quicktime";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

export function isZipFile(file: File): boolean {
  const type = (file.type || "").toLowerCase();
  if (type === "application/zip" || type === "application/x-zip-compressed") return true;
  return /\.zip$/i.test(file.name || "");
}

/**
 * Expand a ZIP into File objects (media payloads only after caller filters).
 * Rejects unsupported compression and oversized archives.
 */
export async function unpackZip(
  file: File,
  opts: ZipUnpackOptions = {},
): Promise<File[]> {
  const maxFiles = opts.maxFiles ?? DEFAULT_MAX_FILES;
  const maxTotal = opts.maxTotalBytes ?? DEFAULT_MAX_TOTAL;
  if (file.size > maxTotal) throw new Error("zip_too_large");

  const buf = await file.arrayBuffer();
  if (buf.byteLength < 22) throw new Error("zip_invalid");
  const view = new DataView(buf);
  const entries = parseCentral(buf);

  const out: File[] = [];
  /** Budget on actual inflated bytes — never trust central-directory sizes alone. */
  let actualTotal = 0;

  for (const entry of entries) {
    if (shouldSkipEntry(entry.name)) continue;
    if (entry.method !== 0 && entry.method !== 8) throw new Error("zip_unsupported_method");
    if (entry.uncompSize > maxTotal) throw new Error("zip_entry_too_large");
    if (out.length >= maxFiles) throw new Error("zip_too_many_files");

    const local = entry.localOffset;
    if (local + 30 > buf.byteLength) throw new Error("zip_corrupt");
    if (u32(view, local) !== LOCAL_SIG) throw new Error("zip_corrupt");
    const nameLen = u16(view, local + 26);
    const extraLen = u16(view, local + 28);
    const dataStart = local + 30 + nameLen + extraLen;
    const dataEnd = dataStart + entry.compSize;
    if (dataEnd > buf.byteLength) throw new Error("zip_corrupt");
    const compressed = new Uint8Array(buf, dataStart, entry.compSize);

    let raw: Uint8Array;
    if (entry.method === 0) {
      raw = compressed;
      if (entry.uncompSize > 0 && raw.byteLength !== entry.uncompSize) {
        throw new Error("zip_corrupt");
      }
    } else {
      raw = await inflateRaw(compressed);
    }
    // Cap on real output (ZIP-bomb / lied uncompSize).
    if (raw.byteLength > maxTotal) throw new Error("zip_entry_too_large");
    actualTotal += raw.byteLength;
    if (actualTotal > maxTotal) throw new Error("zip_too_large");

    const name = basename(entry.name);
    out.push(
      new File([asBlobPart(raw)], name, {
        type: guessMime(name),
        lastModified: Date.now(),
      }),
    );
  }

  if (!out.length) throw new Error("zip_empty");
  return out;
}

export function zipErrorMessage(code: string): string {
  switch (code) {
    case "zip_invalid":
    case "zip_corrupt":
      return "ZIP is invalid or corrupt";
    case "zip_unsupported_method":
      return "ZIP uses unsupported compression (need store or deflate)";
    case "zip_deflate_unsupported":
      return "This browser cannot inflate ZIP entries";
    case "zip_too_large":
      return "ZIP is too large for batch upload";
    case "zip_entry_too_large":
      return "A file inside the ZIP is too large";
    case "zip_too_many_files":
      return "ZIP has too many files (max 48)";
    case "zip_empty":
      return "ZIP has no usable files";
    default:
      return code.replace(/_/g, " ");
  }
}
