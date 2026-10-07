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
  get(key: string): Promise<R2Object | null>;
  delete(key: string): Promise<void>;
};

type R2Object = {
  body: ReadableStream | null;
  httpMetadata?: { contentType?: string };
  size?: number;
};

type AuthKv = {
  get(key: string, type?: "text" | "arrayBuffer"): Promise<string | ArrayBuffer | null>;
  put(key: string, value: string | ArrayBuffer): Promise<void>;
  delete(key: string): Promise<void>;
};

const HOUSE_PREFIX = "house/";
const KV_PREFIX = "media-bin:";
const KV_CHUNK = 3 * 1024 * 1024;

export const ALLOWED_MEDIA_TYPES: Record<"media" | "poster", string[]> = {
  media: [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/webm",
    "audio/x-wav",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ],
  poster: ["image/jpeg", "image/png", "image/webp", "image/gif"],
};

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
};

/** True for same-origin house binary URLs (`/api/media/house/…`). */
export function isHouseMediaUrl(url: string): boolean {
  return mediaKeyFromUrl(url) != null;
}

/** Sniff common image payloads — mobile Safari often omits or mangles MIME. */
export function sniffImageContentType(data: ArrayBuffer): string | null {
  const u = new Uint8Array(data);
  if (u.length >= 3 && u[0] === 0xff && u[1] === 0xd8 && u[2] === 0xff) {
    return "image/jpeg";
  }
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
  if (
    u.length >= 12 &&
    u[0] === 0x52 &&
    u[1] === 0x49 &&
    u[2] === 0x46 &&
    u[3] === 0x46 &&
    u[8] === 0x57 &&
    u[9] === 0x45 &&
    u[10] === 0x42 &&
    u[11] === 0x50
  ) {
    return "image/webp";
  }
  // ISO-BMFF brands used by iPhone HEIC/HEIF
  if (u.length >= 12) {
    const box = String.fromCharCode(u[4]!, u[5]!, u[6]!, u[7]!);
    if (box === "ftyp") {
      const brand = String.fromCharCode(u[8]!, u[9]!, u[10]!, u[11]!).toLowerCase();
      if (brand === "heic" || brand === "heif" || brand === "mif1" || brand === "msf1") {
        return "image/heic";
      }
    }
  }
  return null;
}

function normalizeDeclaredType(raw: string): string {
  const type = (raw || "").toLowerCase().trim();
  if (!type) return "";
  return MIME_ALIASES[type] || type;
}

/**
 * Validate upload MIME/size. Pass `data` when available so empty/`image/jpg`
 * declarations from phones can be recovered via magic-byte sniffing.
 */
export function validateUploadFile(
  file: { type: string; size: number },
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
    (!type || type === "application/octet-stream" || (role === "poster" && !allowed.includes(type)));

  if (needsSniff && data) {
    const sniffed = sniffImageContentType(data);
    if (sniffed === "image/heic") throw new Error("heic_unsupported");
    if (sniffed) type = sniffed;
  }

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
        : "Unsupported file type for this upload";
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
  await kv.put(
    `${KV_PREFIX}${key}:meta`,
    JSON.stringify({ contentType, size: bytes.byteLength, parts }),
  );
  for (let i = 0; i < parts; i++) {
    const slice = bytes.subarray(i * KV_CHUNK, Math.min(bytes.byteLength, (i + 1) * KV_CHUNK));
    const copy = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
    await kv.put(`${KV_PREFIX}${key}:${i}`, copy as ArrayBuffer);
  }
}

async function getKvMedia(key: string): Promise<{
  body: Uint8Array;
  contentType: string;
  size: number;
} | null> {
  const kv = await getAuthKv();
  if (!kv) throw new MediaStoreUnavailableError();
  const metaRaw = await kv.get(`${KV_PREFIX}${key}:meta`, "text");
  if (!metaRaw || typeof metaRaw !== "string") return null;
  let meta: { contentType: string; size: number; parts: number };
  try {
    meta = JSON.parse(metaRaw) as { contentType: string; size: number; parts: number };
  } catch {
    return null;
  }
  const out = new Uint8Array(meta.size);
  let offset = 0;
  for (let i = 0; i < meta.parts; i++) {
    const part = await kv.get(`${KV_PREFIX}${key}:${i}`, "arrayBuffer");
    if (!part || !(part instanceof ArrayBuffer)) return null;
    const chunk = new Uint8Array(part);
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
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

export async function getHouseMedia(key: string): Promise<{
  body: ReadableStream | ArrayBuffer | Uint8Array;
  contentType: string;
  size?: number;
} | null> {
  if (!key.startsWith(HOUSE_PREFIX) || key.includes("..")) return null;
  const mode = await resolveBackend();
  if (mode === "r2") {
    const r2 = await getMediaR2();
    if (!r2) throw new MediaStoreUnavailableError();
    const obj = await r2.get(key);
    if (!obj?.body) return null;
    return {
      body: obj.body,
      contentType: obj.httpMetadata?.contentType || "application/octet-stream",
      size: obj.size,
    };
  }
  if (mode === "kv") {
    return getKvMedia(key);
  }
  const path = await import("node:path");
  const { readFile } = await import("node:fs/promises");
  const rel = localPathForKey(key);
  const full = path.join(process.cwd(), ".data", "media", rel);
  try {
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
  if (data.byteLength > session.chunkBytes + 64) throw new Error("chunk_too_large");
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
