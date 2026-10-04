import type { CatalogItem, MediaKind } from "@/data/catalog";
import type { CategoryId, SubcategoryId } from "@/data/taxonomy";
import { AuthStoreUnavailableError } from "@/lib/auth/store";

/**
 * Durable store for admin-uploaded catalog entries.
 * Uses AUTH_KV (same binding as auth) with a separate key, or local `.data/`.
 */

export type UploadedContent = CatalogItem & {
  /** Optional long-form body for blog / essay / vlog notes */
  body?: string;
  uploadedAt: string;
  uploadedBy: string;
};

const UPLOADS_KEY = "catalog-uploads-v1";

type AuthKv = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};

const g = globalThis as typeof globalThis & { __knUploads?: UploadedContent[] };
type Backend = "kv" | "fs" | "memory";
let backend: Backend | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function allowMemoryFallback(): boolean {
  return process.env.ALLOW_MEMORY_AUTH === "1" || process.env.NODE_ENV !== "production";
}

function isAuthKv(value: unknown): value is AuthKv {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as AuthKv).get === "function" &&
    typeof (value as AuthKv).put === "function"
  );
}

async function getAuthKv(): Promise<AuthKv | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const raw = (ctx.env as { AUTH_KV?: unknown }).AUTH_KV;
    if (raw != null && !isAuthKv(raw)) {
      throw new AuthStoreUnavailableError(
        "AUTH_KV is not a KV Namespace binding",
      );
    }
    return raw ?? null;
  } catch (err) {
    if (err instanceof AuthStoreUnavailableError) throw err;
    return null;
  }
}

async function resolveBackend(): Promise<Backend> {
  if (backend) return backend;
  const kv = await getAuthKv();
  if (kv) {
    backend = "kv";
    return backend;
  }
  try {
    const { mkdir, writeFile, access } = await import("node:fs/promises");
    const path = await import("node:path");
    const dataDir = path.join(process.cwd(), ".data");
    await mkdir(dataDir, { recursive: true });
    const probe = path.join(dataDir, ".write-test");
    await writeFile(probe, "ok", "utf8");
    await access(probe);
    backend = "fs";
    return backend;
  } catch {
    if (allowMemoryFallback()) {
      backend = "memory";
      return backend;
    }
    throw new AuthStoreUnavailableError();
  }
}

async function readUploads(): Promise<UploadedContent[]> {
  const mode = await resolveBackend();
  if (mode === "kv") {
    const kv = await getAuthKv();
    if (!kv) throw new AuthStoreUnavailableError();
    const raw = await kv.get(UPLOADS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as UploadedContent[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (mode === "fs") {
    const { readFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const file = path.join(process.cwd(), ".data", "catalog-uploads.json");
    try {
      const raw = await readFile(file, "utf8");
      const parsed = JSON.parse(raw) as UploadedContent[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (!g.__knUploads) g.__knUploads = [];
  return g.__knUploads;
}

async function writeUploads(items: UploadedContent[]): Promise<void> {
  const mode = await resolveBackend();
  const payload = JSON.stringify(items);
  writeQueue = writeQueue.then(async () => {
    if (mode === "kv") {
      const kv = await getAuthKv();
      if (!kv) throw new AuthStoreUnavailableError();
      await kv.put(UPLOADS_KEY, payload);
      return;
    }
    if (mode === "fs") {
      const { writeFile, mkdir } = await import("node:fs/promises");
      const path = await import("node:path");
      const dataDir = path.join(process.cwd(), ".data");
      await mkdir(dataDir, { recursive: true });
      await writeFile(path.join(dataDir, "catalog-uploads.json"), payload, "utf8");
      return;
    }
    g.__knUploads = items;
  });
  await writeQueue;
}

const KINDS: MediaKind[] = ["video", "audio", "vlog", "essay", "still", "live"];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export type CreateContentInput = {
  title: string;
  subtitle?: string;
  brand: string;
  kind: MediaKind;
  category: CategoryId;
  subcategory: SubcategoryId;
  platform: string;
  externalUrl: string;
  poster?: string;
  src?: string;
  duration?: string;
  tags?: string[];
  blurb: string;
  body?: string;
  paywalled?: boolean;
  embed?: CatalogItem["embed"];
};

export function validateCreateInput(raw: unknown): CreateContentInput {
  if (!raw || typeof raw !== "object") throw new Error("invalid_body");
  const o = raw as Record<string, unknown>;
  const title = String(o.title ?? "").trim();
  const brand = String(o.brand ?? "").trim();
  const kind = String(o.kind ?? "").trim() as MediaKind;
  const category = String(o.category ?? "").trim() as CategoryId;
  const subcategory = String(o.subcategory ?? "").trim() as SubcategoryId;
  const platform = String(o.platform ?? "").trim().toLowerCase();
  const externalUrl = String(o.externalUrl ?? "").trim();
  const blurb = String(o.blurb ?? "").trim();

  if (!title || title.length > 160) throw new Error("invalid_title");
  if (!brand || brand.length > 80) throw new Error("invalid_brand");
  if (!KINDS.includes(kind)) throw new Error("invalid_kind");
  if (!category || !subcategory) throw new Error("invalid_taxonomy");
  if (!platform || platform.length > 40) throw new Error("invalid_platform");
  if (!blurb || blurb.length > 600) throw new Error("invalid_blurb");

  let url: URL;
  try {
    url = new URL(externalUrl);
  } catch {
    throw new Error("invalid_url");
  }
  if (url.protocol !== "https:") throw new Error("invalid_url");

  const poster = o.poster ? String(o.poster).trim() : undefined;
  if (poster) {
    try {
      const p = new URL(poster);
      if (p.protocol !== "https:") throw new Error("invalid_poster");
    } catch {
      throw new Error("invalid_poster");
    }
  }

  const body = o.body ? String(o.body).slice(0, 50_000) : undefined;
  const subtitle = o.subtitle ? String(o.subtitle).trim().slice(0, 200) : undefined;
  const src = o.src ? String(o.src).trim() : undefined;
  if (src) {
    try {
      const s = new URL(src);
      if (s.protocol !== "https:") throw new Error("invalid_src");
    } catch {
      throw new Error("invalid_src");
    }
  }

  const tags = Array.isArray(o.tags)
    ? o.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 12)
    : [];

  return {
    title,
    subtitle,
    brand,
    kind,
    category,
    subcategory,
    platform,
    externalUrl: url.toString(),
    poster,
    src,
    duration: o.duration ? String(o.duration).trim().slice(0, 24) : undefined,
    tags,
    blurb,
    body,
    paywalled: o.paywalled !== false,
    embed:
      o.embed && typeof o.embed === "object"
        ? (o.embed as CatalogItem["embed"])
        : undefined,
  };
}

export async function listUploads(): Promise<UploadedContent[]> {
  const items = await readUploads();
  return [...items].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export async function createUpload(
  input: CreateContentInput,
  uploadedBy: string,
): Promise<UploadedContent> {
  const items = await readUploads();
  const base = slugify(input.title) || "piece";
  let id = `up-${base}`;
  let n = 2;
  while (items.some((i) => i.id === id)) {
    id = `up-${base}-${n++}`;
  }

  const item: UploadedContent = {
    id,
    title: input.title,
    subtitle: input.subtitle,
    brand: input.brand,
    kind: input.kind,
    category: input.category,
    subcategory: input.subcategory,
    duration: input.duration,
    publishedAt: new Date().toISOString().slice(0, 10),
    platform: input.platform,
    externalUrl: input.externalUrl,
    src: input.src,
    poster: input.poster,
    source: input.paywalled === false ? "fetched" : "uploaded",
    embed: input.embed,
    tags: input.tags?.length ? input.tags : [input.kind, input.brand],
    blurb: input.blurb,
    body: input.body,
    uploadedAt: new Date().toISOString(),
    uploadedBy,
  };

  items.unshift(item);
  await writeUploads(items);
  return item;
}

export async function deleteUpload(id: string): Promise<boolean> {
  const items = await readUploads();
  const next = items.filter((i) => i.id !== id);
  if (next.length === items.length) return false;
  await writeUploads(next);
  return true;
}

export async function findUpload(id: string): Promise<UploadedContent | undefined> {
  const items = await readUploads();
  return items.find((i) => i.id === id);
}
