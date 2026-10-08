/**
 * House media binaries (video / audio / stills).
 * Prefer MEDIA_R2 when bound; otherwise AUTH_KV chunks; local `.data/media/` in dev.
 */

export class MediaStoreUnavailableError extends Error {
  constructor(message = "Media store unavailable — bind AUTH_KV (or MEDIA_R2) for Workers") {
    super(message);
    this.name = "MediaStoreUnavailableError";
  }
}

type R2Bucket = {
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | string,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  get(
    key: string,
    options?: { range?: { offset: number; length: number } },
  ): Promise<R2Object | null>;
  head?(key: string): Promise<R2ObjectHead | null>;
  delete(key: string): Promise<void>;
};

type R2ObjectHead = {
  httpMetadata?: { contentType?: string };
  size?: number;
};

type R2Object = {
  body: ReadableStream | null;
  httpMetadata?: { contentType?: string };
  size?: number;
};

/** Credentialed full-file blob play ceiling — above this, progressive Range streams. */
export const HOUSE_AV_BLOB_MAX_BYTES = 48 * 1024 * 1024;

type AuthKv = {
  get(key: string, type?: "text" | "arrayBuffer"): Promise<string | ArrayBuffer | null>;
  put(key: string, value: string | ArrayBuffer): Promise<void>;
  delete(key: string): Promise<void>;
};

const HOUSE_PREFIX = "house/";
const KV_PREFIX = "media-bin:";
const KV_CHUNK = 3 * 1024 * 1024;

/** Browser-playable house AV + stills. MagCloud/docs stay out of this path. */
export const ALLOWED_MEDIA_TYPES: Record<"media" | "poster", string[]> = {
  media: [
    // video
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-m4v",
    "video/ogg",
    "video/3gpp",
    "video/3gpp2",
    // audio — mp3 + common variants phones / DAWs emit
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/x-m4a",
    "audio/m4a",
    "audio/aac",
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/ogg",
    "audio/opus",
    "audio/webm",
    "audio/flac",
    "audio/x-flac",
    "audio/x-mpeg",
    "audio/mpeg3",
    "application/ogg",
    // stills (photo preset + writing attachments)
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ],
  poster: ["image/jpeg", "image/png", "image/webp", "image/gif"],
};

/** Explicit extensions for `<input accept>` (Windows + Safari wildcards are flaky). */
export const MEDIA_FILE_EXTENSIONS = [
  ".mp3",
  ".m4a",
  ".aac",
  ".wav",
  ".flac",
  ".ogg",
  ".opus",
  ".oga",
  ".mp4",
  ".m4v",
  ".mov",
  ".webm",
  ".ogv",
  ".3gp",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
] as const;

export function mediaAcceptAttribute(): string {
  return [
    "audio/*",
    "video/*",
    "image/*",
    ...MEDIA_FILE_EXTENSIONS,
    ...ALLOWED_MEDIA_TYPES.media,
  ].join(",");
}

export function audioAcceptAttribute(): string {
  return [
    "audio/*",
    ".mp3",
    ".m4a",
    ".aac",
    ".wav",
    ".flac",
    ".ogg",
    ".opus",
    ".oga",
    "audio/mpeg",
    "audio/mp4",
    "audio/aac",
    "audio/wav",
    "audio/ogg",
    "audio/flac",
    "audio/webm",
  ].join(",");
}

export function videoAcceptAttribute(): string {
  return [
    "video/*",
    ".mp4",
    ".m4v",
    ".mov",
    ".webm",
    ".ogv",
    ".3gp",
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/ogg",
  ].join(",");
}

/**
 * Max finished object size (chunked upload path).
 * Single Worker requests stay under ~100 MiB — use chunked upload above that.
 */
export const MAX_MEDIA_BYTES = 512 * 1024 * 1024;

/** Safe single-request ceiling (form overhead + Worker body cap). */
export const SINGLE_SHOT_MAX_BYTES = 85 * 1024 * 1024;

/** Chunk size for multi-part admin uploads. */
export const UPLOAD_CHUNK_BYTES = 8 * 1024 * 1024;

export function buildMediaUrl(key: string): string {
  const encoded = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  // Same-origin path so local + production players hit this Worker.
  return `/api/media/${encoded}`;
}

export function mediaKeyFromUrl(url: string): string | null {
  try {
    const path = url.startsWith("/")
      ? url
      : new URL(url).pathname;
    const prefix = "/api/media/";
    if (!path.startsWith(prefix)) return null;
    const rest = path.slice(prefix.length);
    const key = decodeURIComponent(rest);
    if (!key.startsWith(HOUSE_PREFIX) || key.includes("..")) return null;
    return key;
  } catch {
    return null;
  }
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return (base || "file").slice(0, 80);
}

export function newHouseObjectKey(filename: string): string {
  const stamp = crypto.randomUUID();
  return `${HOUSE_PREFIX}${stamp}-${sanitizeFilename(filename)}`;
}

function isR2Bucket(value: unknown): value is R2Bucket {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as R2Bucket).put === "function" &&
    typeof (value as R2Bucket).get === "function"
  );
}

function isAuthKv(value: unknown): value is AuthKv {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as AuthKv).get === "function" &&
    typeof (value as AuthKv).put === "function"
  );
}

async function getMediaR2(): Promise<R2Bucket | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const raw = (ctx.env as { MEDIA_R2?: unknown }).MEDIA_R2;
    if (raw != null && !isR2Bucket(raw)) {
      throw new MediaStoreUnavailableError("MEDIA_R2 is not an R2 bucket binding");
    }
    return raw ?? null;
  } catch (err) {
    if (err instanceof MediaStoreUnavailableError) throw err;
    return null;
  }
}

async function getAuthKv(): Promise<AuthKv | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const raw = (ctx.env as { AUTH_KV?: unknown }).AUTH_KV;
    if (raw != null && !isAuthKv(raw)) return null;
    return (raw as AuthKv) ?? null;
  } catch {
    return null;
  }
}

type Backend = "r2" | "kv" | "fs";
let backend: Backend | null = null;

async function resolveBackend(): Promise<Backend> {
  if (backend) return backend;
  const r2 = await getMediaR2();
  if (r2) {
    backend = "r2";
    return backend;
  }
  const kv = await getAuthKv();
  if (kv) {
    backend = "kv";
    return backend;
  }
  if (process.env.NODE_ENV === "production") {
    throw new MediaStoreUnavailableError();
  }
  try {
    const { mkdir, writeFile, access } = await import("node:fs/promises");
    const path = await import("node:path");
    const dataDir = path.join(process.cwd(), ".data", "media");
    await mkdir(dataDir, { recursive: true });
    const probe = path.join(dataDir, ".write-test");
    await writeFile(probe, "ok", "utf8");
    await access(probe);
    backend = "fs";
    return backend;
  } catch {
    throw new MediaStoreUnavailableError();
  }
}

function localPathForKey(key: string): string {
  if (!key.startsWith(HOUSE_PREFIX) || key.includes("..")) {
    throw new Error("invalid_key");
  }
  return key;
}

const MIME_ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-png": "image/png",
  "audio/mp3": "audio/mpeg",
  "audio/mpeg3": "audio/mpeg",
  "audio/x-mpeg": "audio/mpeg",
  "audio/x-mp3": "audio/mpeg",
  "audio/m4a": "audio/mp4",
  "audio/x-m4a": "audio/mp4",
  "audio/aac": "audio/mp4",
  "audio/x-aac": "audio/mp4",
  "audio/wave": "audio/wav",
  "audio/x-wav": "audio/wav",
  "audio/x-flac": "audio/flac",
  "application/ogg": "audio/ogg",
  "video/x-m4v": "video/mp4",
  "video/3gpp": "video/mp4",
  "video/3gpp2": "video/mp4",
};

/** Extension → canonical MIME when browsers send empty/`octet-stream`. */
const EXT_TO_MIME: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".mpga": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/mp4",
  ".wav": "audio/wav",
  ".wave": "audio/wav",
  ".flac": "audio/flac",
  ".ogg": "audio/ogg",
  ".oga": "audio/ogg",
  ".opus": "audio/ogg",
  ".weba": "audio/webm",
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
  ".qt": "video/quicktime",
  ".webm": "video/webm",
  ".ogv": "video/ogg",
  ".3gp": "video/mp4",
  ".3g2": "video/mp4",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/** True for same-origin house binary URLs (`/api/media/house/…`). */
export function isHouseMediaUrl(url: string): boolean {
  return mediaKeyFromUrl(url) != null;
}

function asciiAt(u: Uint8Array, start: number, len: number): string {
  let out = "";
  for (let i = 0; i < len; i++) out += String.fromCharCode(u[start + i] ?? 0);
  return out;
}

function looksLikeMp3Frame(u: Uint8Array, i: number): boolean {
  if (i + 1 >= u.length) return false;
  const b0 = u[i]!;
  const b1 = u[i + 1]!;
  if (b0 !== 0xff) return false;
  // MPEG audio frame sync: 1111 1111 111x xxxx with layer bits not 00
  return (b1 & 0xe0) === 0xe0 && (b1 & 0x18) !== 0x08 && (b1 & 0x06) !== 0x00;
}

/** Sniff image / AV payloads — phones often omit or mangle MIME. */
export function sniffMediaContentType(data: ArrayBuffer): string | null {
  const u = new Uint8Array(data);
  if (u.length < 4) return null;

  // JPEG
  if (u[0] === 0xff && u[1] === 0xd8 && u[2] === 0xff) return "image/jpeg";

  // PNG
  if (
    u.length >= 8 &&
    u[0] === 0x89 &&
    u[1] === 0x50 &&
    u[2] === 0x4e &&
    u[3] === 0x47 &&
    u[4] === 0x0d &&
    u[5] === 0x0a &&
    u[6] === 0x1a &&
    u[7] === 0x0a
  ) {
    return "image/png";
  }

  // GIF
  if (
    u.length >= 6 &&
    u[0] === 0x47 &&
    u[1] === 0x49 &&
    u[2] === 0x46 &&
    u[3] === 0x38 &&
    (u[4] === 0x37 || u[4] === 0x39) &&
    u[5] === 0x61
  ) {
    return "image/gif";
  }

  // RIFF container — WAVE / WEBP / AVI
  if (
    u.length >= 12 &&
    u[0] === 0x52 &&
    u[1] === 0x49 &&
    u[2] === 0x46 &&
    u[3] === 0x46
  ) {
    const form = asciiAt(u, 8, 4);
    if (form === "WAVE") return "audio/wav";
    if (form === "WEBP") return "image/webp";
  }

  // FLAC
  if (u.length >= 4 && asciiAt(u, 0, 4) === "fLaC") return "audio/flac";

  // Ogg
  if (u.length >= 4 && asciiAt(u, 0, 4) === "OggS") {
    const head = asciiAt(u, 0, Math.min(u.length, 96));
    if (head.includes("theora") || head.includes("video")) return "video/ogg";
    return "audio/ogg";
  }

  // WebM / Matroska EBML
  if (
    u.length >= 4 &&
    u[0] === 0x1a &&
    u[1] === 0x45 &&
    u[2] === 0xdf &&
    u[3] === 0xa3
  ) {
    return "video/webm";
  }

  // ID3-tagged MP3
  if (u.length >= 3 && asciiAt(u, 0, 3) === "ID3") return "audio/mpeg";

  // Raw MPEG audio frame (no ID3)
  if (looksLikeMp3Frame(u, 0)) return "audio/mpeg";
  for (let i = 1; i < Math.min(u.length - 1, 4096); i++) {
    if (looksLikeMp3Frame(u, i)) return "audio/mpeg";
  }

  // ISO-BMFF (mp4 / m4a / mov / heic)
  if (u.length >= 12 && asciiAt(u, 4, 4) === "ftyp") {
    const brands: string[] = [];
    brands.push(asciiAt(u, 8, 4).toLowerCase().trim());
    for (let off = 16; off + 4 <= Math.min(u.length, 64); off += 4) {
      brands.push(asciiAt(u, off, 4).toLowerCase().trim());
    }
    if (brands.some((b) => b === "heic" || b === "heif" || b === "mif1" || b === "msf1")) {
      return "image/heic";
    }
    const audioBrands = new Set(["m4a", "m4b", "m4p", "mp4a"]);
    if (brands.some((b) => audioBrands.has(b))) return "audio/mp4";
    if (brands.some((b) => b === "qt")) return "video/quicktime";
    return "video/mp4";
  }

  return null;
}

/** @deprecated use sniffMediaContentType — kept for call-site clarity in image paths */
export function sniffImageContentType(data: ArrayBuffer): string | null {
  const sniffed = sniffMediaContentType(data);
  if (!sniffed) return null;
  if (sniffed.startsWith("image/")) return sniffed;
  return null;
}

function normalizeDeclaredType(raw: string): string {
  const type = (raw || "").toLowerCase().trim().split(";")[0]?.trim() ?? "";
  if (!type) return "";
  return MIME_ALIASES[type] || type;
}

function mimeFromFilename(name?: string): string {
  if (!name) return "";
  const lower = name.toLowerCase();
  const dot = lower.lastIndexOf(".");
  if (dot < 0) return "";
  return EXT_TO_MIME[lower.slice(dot)] ?? "";
}

/**
 * Validate upload MIME/size. Pass `data` when available so empty/`image/jpg`
 * / missing audio MIME from phones can be recovered via magic-byte sniffing
 * and filename extension.
 */
export function validateUploadFile(
  file: { type: string; size: number; name?: string },
  role: "media" | "poster",
  data?: ArrayBuffer,
): { contentType: string } {
  if (file.size <= 0) throw new Error("empty_file");
  if (file.size > MAX_MEDIA_BYTES) throw new Error("file_too_large");

  const allowed = ALLOWED_MEDIA_TYPES[role];
  let type = normalizeDeclaredType(file.type);

  if (type === "image/heic" || type === "image/heif") {
    throw new Error("heic_unsupported");
  }

  const needsSniff =
    Boolean(data) &&
    (!type ||
      type === "application/octet-stream" ||
      type === "binary/octet-stream" ||
      !allowed.includes(type));

  if (needsSniff && data) {
    const sniffed = sniffMediaContentType(data);
    if (sniffed === "image/heic") throw new Error("heic_unsupported");
    if (sniffed) type = normalizeDeclaredType(sniffed);
  }

  if (!type || type === "application/octet-stream" || !allowed.includes(type)) {
    const fromName = mimeFromFilename(file.name);
    if (fromName) type = fromName;
  }

  // Canonicalize aliases after recovery
  type = normalizeDeclaredType(type);

  if (!type) type = "application/octet-stream";
  if (!allowed.includes(type)) throw new Error("invalid_type");
  return { contentType: type };
}

/** Human-readable upload errors for admin UI. */
export function uploadErrorMessage(
  code: string,
  role: "media" | "poster" = "poster",
): string {
  switch (code) {
    case "heic_unsupported":
      return "iPhone HEIC isn’t supported — export or choose JPEG / PNG";
    case "invalid_type":
      return role === "poster"
        ? "Use JPEG, PNG, WebP, or GIF for thumbnails"
        : "Unsupported AV type — use MP3, M4A/AAC, WAV, FLAC, OGG, MP4, MOV, or WebM";
    case "empty_file":
      return "That file was empty";
    case "file_too_large":
      return `File too large (max ${Math.floor(MAX_MEDIA_BYTES / (1024 * 1024))} MB)`;
    case "media_store_unavailable":
      return "Media store unavailable — try again after deploy";
    default:
      // Already humanized messages pass through.
      if (code.includes(" ") || /[A-Z]/.test(code)) return code;
      return code.replace(/_/g, " ");
  }
}

async function putKvMedia(key: string, data: ArrayBuffer, contentType: string): Promise<void> {
  const kv = await getAuthKv();
  if (!kv) throw new MediaStoreUnavailableError();
  const bytes = new Uint8Array(data);
  const parts = Math.max(1, Math.ceil(bytes.byteLength / KV_CHUNK));
  // Write parts first, then meta — so a mid-write failure never leaves
  // meta.size > reassembled bytes (players would cut off on trailing NULs).
  for (let i = 0; i < parts; i++) {
    const slice = bytes.subarray(i * KV_CHUNK, Math.min(bytes.byteLength, (i + 1) * KV_CHUNK));
    const copy = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
    await kv.put(`${KV_PREFIX}${key}:${i}`, copy as ArrayBuffer);
  }
  await kv.put(
    `${KV_PREFIX}${key}:meta`,
    JSON.stringify({ contentType, size: bytes.byteLength, parts }),
  );
}

async function readKvMeta(key: string): Promise<{
  contentType: string;
  size: number;
  parts: number;
} | null> {
  const kv = await getAuthKv();
  if (!kv) throw new MediaStoreUnavailableError();
  const metaRaw = await kv.get(`${KV_PREFIX}${key}:meta`, "text");
  if (!metaRaw || typeof metaRaw !== "string") return null;
  try {
    const meta = JSON.parse(metaRaw) as {
      contentType?: string;
      size?: number;
      parts?: number;
    };
    if (typeof meta.size !== "number" || meta.size < 0) return null;
    if (typeof meta.parts !== "number" || meta.parts < 1) return null;
    return {
      contentType: meta.contentType || "application/octet-stream",
      size: meta.size,
      parts: meta.parts,
    };
  } catch {
    return null;
  }
}

/** Read only the KV parts that cover [offset, offset+length) — no full-file reassembly. */
async function getKvMediaRange(
  key: string,
  offset: number,
  length: number,
): Promise<{
  body: Uint8Array;
  contentType: string;
  size: number;
} | null> {
  const kv = await getAuthKv();
  if (!kv) throw new MediaStoreUnavailableError();
  const meta = await readKvMeta(key);
  if (!meta) return null;
  if (offset < 0 || length <= 0 || offset >= meta.size) return null;
  const end = Math.min(meta.size, offset + length);
  const out = new Uint8Array(end - offset);
  const firstPart = Math.floor(offset / KV_CHUNK);
  const lastPart = Math.floor((end - 1) / KV_CHUNK);
  if (lastPart >= meta.parts) return null;
  let writeAt = 0;
  for (let i = firstPart; i <= lastPart; i++) {
    const part = await kv.get(`${KV_PREFIX}${key}:${i}`, "arrayBuffer");
    if (!part || !(part instanceof ArrayBuffer)) return null;
    const chunk = new Uint8Array(part);
    const partStart = i * KV_CHUNK;
    const from = Math.max(0, offset - partStart);
    const to = Math.min(chunk.byteLength, end - partStart);
    if (from >= to) continue;
    out.set(chunk.subarray(from, to), writeAt);
    writeAt += to - from;
  }
  if (writeAt !== out.byteLength) return null;
  return { body: out, contentType: meta.contentType, size: meta.size };
}

async function getKvMedia(key: string): Promise<{
  body: Uint8Array;
  contentType: string;
  size: number;
} | null> {
  const kv = await getAuthKv();
  if (!kv) throw new MediaStoreUnavailableError();
  const meta = await readKvMeta(key);
  if (!meta) return null;
  const out = new Uint8Array(meta.size);
  let offset = 0;
  for (let i = 0; i < meta.parts; i++) {
    const part = await kv.get(`${KV_PREFIX}${key}:${i}`, "arrayBuffer");
    if (!part || !(part instanceof ArrayBuffer)) return null;
    const chunk = new Uint8Array(part);
    if (offset + chunk.byteLength > meta.size) return null;
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  // Incomplete reassembly used to return trailing NULs — players cut songs short.
  if (offset !== meta.size) return null;
  return { body: out, contentType: meta.contentType, size: meta.size };
}

async function deleteKvMedia(key: string): Promise<void> {
  const kv = await getAuthKv();
  if (!kv) return;
  const metaRaw = await kv.get(`${KV_PREFIX}${key}:meta`, "text");
  let parts = 0;
  if (typeof metaRaw === "string") {
    try {
      parts = (JSON.parse(metaRaw) as { parts?: number }).parts ?? 0;
    } catch {
      parts = 0;
    }
  }
  await kv.delete(`${KV_PREFIX}${key}:meta`);
  for (let i = 0; i < parts; i++) {
    await kv.delete(`${KV_PREFIX}${key}:${i}`);
  }
}

export async function putHouseMedia(
  key: string,
  data: ArrayBuffer,
  contentType: string,
): Promise<void> {
  if (!key.startsWith(HOUSE_PREFIX)) throw new Error("invalid_key");
  const mode = await resolveBackend();
  if (mode === "r2") {
    const r2 = await getMediaR2();
    if (!r2) throw new MediaStoreUnavailableError();
    await r2.put(key, data, { httpMetadata: { contentType } });
    return;
  }
  if (mode === "kv") {
    await putKvMedia(key, data, contentType);
    return;
  }
  const path = await import("node:path");
  const { mkdir, writeFile } = await import("node:fs/promises");
  const rel = localPathForKey(key);
  const full = path.join(process.cwd(), ".data", "media", rel);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, Buffer.from(data));
}

/** Meta-only probe for HEAD — avoids loading the full object from KV / R2. */
export async function getHouseMediaMeta(key: string): Promise<{
  contentType: string;
  size: number;
} | null> {
  if (!key.startsWith(HOUSE_PREFIX) || key.includes("..")) return null;
  const mode = await resolveBackend();
  if (mode === "r2") {
    const r2 = await getMediaR2();
    if (!r2) throw new MediaStoreUnavailableError();
    // Prefer head() — never pull the body just to answer size/type.
    if (typeof r2.head === "function") {
      const head = await r2.head(key);
      if (!head) return null;
      return {
        contentType: head.httpMetadata?.contentType || "application/octet-stream",
        size: head.size ?? 0,
      };
    }
    // Fallback: zero-length range probe (some stubs lack head).
    const obj = await r2.get(key, { range: { offset: 0, length: 1 } });
    if (!obj) return null;
    return {
      contentType: obj.httpMetadata?.contentType || "application/octet-stream",
      size: obj.size ?? 0,
    };
  }
  if (mode === "kv") {
    const meta = await readKvMeta(key);
    if (!meta) return null;
    return { contentType: meta.contentType, size: meta.size };
  }
  const path = await import("node:path");
  const { stat } = await import("node:fs/promises");
  const rel = localPathForKey(key);
  const full = path.join(process.cwd(), ".data", "media", rel);
  try {
    const s = await stat(full);
    return { contentType: "application/octet-stream", size: s.size };
  } catch {
    return null;
  }
}

export async function getHouseMedia(
  key: string,
  opts?: { range?: { offset: number; length: number } },
): Promise<{
  body: ReadableStream | ArrayBuffer | Uint8Array;
  contentType: string;
  size?: number;
} | null> {
  if (!key.startsWith(HOUSE_PREFIX) || key.includes("..")) return null;
  const mode = await resolveBackend();
  if (mode === "r2") {
    const r2 = await getMediaR2();
    if (!r2) throw new MediaStoreUnavailableError();
    const obj = opts?.range
      ? await r2.get(key, { range: opts.range })
      : await r2.get(key);
    if (!obj?.body) return null;
    return {
      body: obj.body,
      contentType: obj.httpMetadata?.contentType || "application/octet-stream",
      size: obj.size,
    };
  }
  if (mode === "kv") {
    if (opts?.range) {
      const { offset, length } = opts.range;
      return getKvMediaRange(key, offset, length);
    }
    return getKvMedia(key);
  }
  const path = await import("node:path");
  const { readFile, open } = await import("node:fs/promises");
  const rel = localPathForKey(key);
  const full = path.join(process.cwd(), ".data", "media", rel);
  try {
    if (opts?.range) {
      const fh = await open(full, "r");
      try {
        const stat = await fh.stat();
        const { offset, length } = opts.range;
        if (offset < 0 || offset >= stat.size || length <= 0) return null;
        const readLen = Math.min(length, stat.size - offset);
        const buf = Buffer.alloc(readLen);
        await fh.read(buf, 0, readLen, offset);
        return {
          body: new Uint8Array(buf),
          contentType: "application/octet-stream",
          size: stat.size,
        };
      } finally {
        await fh.close();
      }
    }
    const buf = await readFile(full);
    const bytes = new Uint8Array(buf);
    return {
      body: bytes,
      contentType: "application/octet-stream",
      size: bytes.byteLength,
    };
  } catch {
    return null;
  }
}

export async function deleteHouseMedia(key: string): Promise<void> {
  if (!key.startsWith(HOUSE_PREFIX) || key.includes("..")) return;
  const mode = await resolveBackend();
  if (mode === "r2") {
    const r2 = await getMediaR2();
    if (!r2) throw new MediaStoreUnavailableError();
    await r2.delete(key);
    return;
  }
  if (mode === "kv") {
    await deleteKvMedia(key);
    return;
  }
  const path = await import("node:path");
  const { unlink } = await import("node:fs/promises");
  const rel = localPathForKey(key);
  const full = path.join(process.cwd(), ".data", "media", rel);
  try {
    await unlink(full);
  } catch {
    /* already gone */
  }
}

export async function deleteMediaForCatalogUrls(urls: (string | undefined)[]): Promise<void> {
  const keys = new Set<string>();
  for (const url of urls) {
    if (!url) continue;
    const key = mediaKeyFromUrl(url);
    if (key) keys.add(key);
  }
  await Promise.all([...keys].map((k) => deleteHouseMedia(k)));
}

/* —— Chunked admin uploads (bypass single-request Worker body cap) —— */

const UPLOAD_PREFIX = "media-up:";

type UploadSession = {
  id: string;
  key: string;
  role: "media" | "poster";
  contentType: string;
  size: number;
  chunkBytes: number;
  totalChunks: number;
  received: number[];
  createdAt: string;
};

async function putUploadMeta(session: UploadSession): Promise<void> {
  const mode = await resolveBackend();
  const payload = JSON.stringify(session);
  if (mode === "r2" || mode === "kv") {
    const kv = await getAuthKv();
    if (!kv) throw new MediaStoreUnavailableError();
    await kv.put(`${UPLOAD_PREFIX}${session.id}:meta`, payload);
    return;
  }
  const path = await import("node:path");
  const { mkdir, writeFile } = await import("node:fs/promises");
  const dir = path.join(process.cwd(), ".data", "uploads", session.id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "meta.json"), payload, "utf8");
}

async function getUploadMeta(id: string): Promise<UploadSession | null> {
  const mode = await resolveBackend();
  if (mode === "r2" || mode === "kv") {
    const kv = await getAuthKv();
    if (!kv) throw new MediaStoreUnavailableError();
    const raw = await kv.get(`${UPLOAD_PREFIX}${id}:meta`, "text");
    if (!raw || typeof raw !== "string") return null;
    try {
      return JSON.parse(raw) as UploadSession;
    } catch {
      return null;
    }
  }
  const path = await import("node:path");
  const { readFile } = await import("node:fs/promises");
  try {
    const raw = await readFile(
      path.join(process.cwd(), ".data", "uploads", id, "meta.json"),
      "utf8",
    );
    return JSON.parse(raw) as UploadSession;
  } catch {
    return null;
  }
}

async function putUploadChunk(id: string, index: number, data: ArrayBuffer): Promise<void> {
  const mode = await resolveBackend();
  if (mode === "r2" || mode === "kv") {
    const kv = await getAuthKv();
    if (!kv) throw new MediaStoreUnavailableError();
    await kv.put(`${UPLOAD_PREFIX}${id}:${index}`, data);
    return;
  }
  const path = await import("node:path");
  const { mkdir, writeFile } = await import("node:fs/promises");
  const dir = path.join(process.cwd(), ".data", "uploads", id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${index}.bin`), Buffer.from(data));
}

async function getUploadChunk(id: string, index: number): Promise<ArrayBuffer | null> {
  const mode = await resolveBackend();
  if (mode === "r2" || mode === "kv") {
    const kv = await getAuthKv();
    if (!kv) throw new MediaStoreUnavailableError();
    const part = await kv.get(`${UPLOAD_PREFIX}${id}:${index}`, "arrayBuffer");
    return part instanceof ArrayBuffer ? part : null;
  }
  const path = await import("node:path");
  const { readFile } = await import("node:fs/promises");
  try {
    const buf = await readFile(path.join(process.cwd(), ".data", "uploads", id, `${index}.bin`));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  } catch {
    return null;
  }
}

async function clearUploadSession(session: UploadSession): Promise<void> {
  const mode = await resolveBackend();
  if (mode === "r2" || mode === "kv") {
    const kv = await getAuthKv();
    if (!kv) return;
    await kv.delete(`${UPLOAD_PREFIX}${session.id}:meta`);
    for (let i = 0; i < session.totalChunks; i++) {
      await kv.delete(`${UPLOAD_PREFIX}${session.id}:${i}`);
    }
    return;
  }
  const path = await import("node:path");
  const { rm } = await import("node:fs/promises");
  try {
    await rm(path.join(process.cwd(), ".data", "uploads", session.id), {
      recursive: true,
      force: true,
    });
  } catch {
    /* gone */
  }
}

export async function initChunkedUpload(input: {
  filename: string;
  contentType: string;
  size: number;
  role: "media" | "poster";
}): Promise<{ uploadId: string; key: string; chunkBytes: number; totalChunks: number }> {
  validateUploadFile(
    { type: input.contentType, size: input.size },
    input.role,
  );
  if (input.size > MAX_MEDIA_BYTES) throw new Error("file_too_large");
  const totalChunks = Math.max(1, Math.ceil(input.size / UPLOAD_CHUNK_BYTES));
  const id = crypto.randomUUID();
  const key = newHouseObjectKey(input.filename || "upload.bin");
  const session: UploadSession = {
    id,
    key,
    role: input.role,
    contentType: input.contentType,
    size: input.size,
    chunkBytes: UPLOAD_CHUNK_BYTES,
    totalChunks,
    received: [],
    createdAt: new Date().toISOString(),
  };
  await putUploadMeta(session);
  return {
    uploadId: id,
    key,
    chunkBytes: UPLOAD_CHUNK_BYTES,
    totalChunks,
  };
}

export async function putChunkedUploadPart(
  uploadId: string,
  index: number,
  data: ArrayBuffer,
): Promise<{ received: number; totalChunks: number }> {
  const session = await getUploadMeta(uploadId);
  if (!session) throw new Error("upload_not_found");
  if (index < 0 || index >= session.totalChunks) throw new Error("invalid_chunk");
  if (data.byteLength <= 0) throw new Error("empty_file");
  const isLast = index === session.totalChunks - 1;
  const expected = isLast
    ? session.size - session.chunkBytes * (session.totalChunks - 1)
    : session.chunkBytes;
  if (data.byteLength !== expected) throw new Error("chunk_size_mismatch");
  await putUploadChunk(uploadId, index, data);
  if (!session.received.includes(index)) {
    session.received.push(index);
    session.received.sort((a, b) => a - b);
    await putUploadMeta(session);
  }
  return { received: session.received.length, totalChunks: session.totalChunks };
}

export async function completeChunkedUpload(uploadId: string): Promise<{
  url: string;
  key: string;
  contentType: string;
  bytes: number;
}> {
  const session = await getUploadMeta(uploadId);
  if (!session) throw new Error("upload_not_found");
  if (session.received.length !== session.totalChunks) {
    throw new Error("upload_incomplete");
  }
  const out = new Uint8Array(session.size);
  let offset = 0;
  for (let i = 0; i < session.totalChunks; i++) {
    const part = await getUploadChunk(uploadId, i);
    if (!part) throw new Error("upload_incomplete");
    const chunk = new Uint8Array(part);
    if (offset + chunk.byteLength > session.size) throw new Error("upload_corrupt");
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  if (offset !== session.size) throw new Error("upload_corrupt");
  const copy = out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
  await putHouseMedia(session.key, copy, session.contentType);
  await clearUploadSession(session);
  return {
    url: buildMediaUrl(session.key),
    key: session.key,
    contentType: session.contentType,
    bytes: session.size,
  };
}
