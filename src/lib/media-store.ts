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

/** 95 MiB — stay under typical Worker request limits. */
export const MAX_MEDIA_BYTES = 95 * 1024 * 1024;

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

export function validateUploadFile(
  file: { type: string; size: number },
  role: "media" | "poster",
): { contentType: string } {
  const allowed = ALLOWED_MEDIA_TYPES[role];
  const type = (file.type || "application/octet-stream").toLowerCase();
  if (!allowed.includes(type)) throw new Error("invalid_type");
  if (file.size <= 0) throw new Error("empty_file");
  if (file.size > MAX_MEDIA_BYTES) throw new Error("file_too_large");
  return { contentType: type };
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
