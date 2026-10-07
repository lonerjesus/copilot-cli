import type { CatalogItem, MediaKind } from "@/data/catalog";
import type { CategoryId, SubcategoryId } from "@/data/taxonomy";
import { getSubcategory } from "@/data/taxonomy";
import { SITE } from "@/data/identity";
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

/** Single house brand — no alias picker on compose. */
const HOUSE_BRAND = SITE.title;

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
  const brand = HOUSE_BRAND;
  const kind = String(o.kind ?? "").trim() as MediaKind;
  const category = String(o.category ?? "").trim() as CategoryId;
  const subcategory = String(o.subcategory ?? "").trim() as SubcategoryId;
  const platform = String(o.platform ?? "").trim().toLowerCase();
  const externalUrlRaw = String(o.externalUrl ?? "").trim();
  const srcRaw = o.src ? String(o.src).trim() : "";
  const subtitle = o.subtitle ? String(o.subtitle).trim().slice(0, 200) : undefined;
  const blurbRaw = String(o.blurb ?? "").trim();
  const blurb = (blurbRaw || subtitle || title).slice(0, 600);

  if (!title || title.length > 160) throw new Error("invalid_title");
  if (!KINDS.includes(kind)) throw new Error("invalid_kind");
  if (!category || !subcategory) throw new Error("invalid_taxonomy");
  if (!getSubcategory(category, subcategory)) throw new Error("invalid_taxonomy");
  if (!platform || platform.length > 40) throw new Error("invalid_platform");
  if (!blurb) throw new Error("invalid_blurb");

  const mediaCandidate = externalUrlRaw || srcRaw;
  if (!mediaCandidate) throw new Error("invalid_url");

  function assertMediaRef(value: string, err: string): string {
    if (value.startsWith("/api/media/house/") && !value.includes("..")) {
      return value;
    }
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "https:") throw new Error(err);
      return parsed.toString();
    } catch {
      throw new Error(err);
    }
  }

  let externalUrl = assertMediaRef(mediaCandidate, "invalid_url");
  if (externalUrlRaw) {
    externalUrl = assertMediaRef(externalUrlRaw, "invalid_url");
  }

  const posterRaw = o.poster ? String(o.poster).trim() : undefined;
  let poster: string | undefined;
  if (posterRaw) {
    poster = assertMediaRef(posterRaw, "invalid_poster");
  }

  const body = o.body ? String(o.body).slice(0, 50_000) : undefined;
  const src = srcRaw ? assertMediaRef(srcRaw, "invalid_src") : undefined;

  const tags = Array.isArray(o.tags)
    ? o.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 12)
    : [];

  const EMBED_PROVIDERS = [
    "youtube",
    "vimeo",
    "twitch",
    "soundcloud",
    "substack",
    "audio",
    "bandcamp",
  ] as const;

  let embed: CatalogItem["embed"] | undefined;
  if (o.embed && typeof o.embed === "object") {
    const e = o.embed as Record<string, unknown>;
    const provider = String(e.provider ?? "").trim() as (typeof EMBED_PROVIDERS)[number];
    if (!EMBED_PROVIDERS.includes(provider)) throw new Error("invalid_embed");
    const id = e.id != null ? String(e.id).trim().slice(0, 120) : undefined;
    let embedUrl: string | undefined;
    if (e.url != null && String(e.url).trim()) {
      try {
        const eu = new URL(String(e.url).trim());
        if (eu.protocol !== "https:") throw new Error("invalid_embed");
        embedUrl = eu.toString();
      } catch {
        throw new Error("invalid_embed");
      }
    }
    if (!id && !embedUrl) throw new Error("invalid_embed");
    embed = { provider, id: id || undefined, url: embedUrl };
  }

  return {
    title,
    subtitle,
    brand,
    kind,
    category,
    subcategory,
    platform,
    externalUrl,
    poster,
    src,
    duration: o.duration ? String(o.duration).trim().slice(0, 24) : undefined,
    tags,
    blurb,
    body,
    paywalled: o.paywalled !== false,
    embed,
  };
}

export async function listUploads(): Promise<UploadedContent[]> {
  try {
    const items = await readUploads();
    return [...items].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  } catch (err) {
    // Propagate real store outages so admin/API can 503.
    if (err instanceof AuthStoreUnavailableError) throw err;
    return [];
  }
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
    source: "uploaded",
    paywalled: input.paywalled !== false,
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

export async function updateUpload(
  id: string,
  patch: Partial<CreateContentInput>,
): Promise<UploadedContent | null> {
  const items = await readUploads();
  const idx = items.findIndex((i) => i.id === id);
  if (idx < 0) return null;
  const current = items[idx]!;

  const mergedRaw = {
    title: patch.title ?? current.title,
    subtitle: patch.subtitle !== undefined ? patch.subtitle : current.subtitle,
    brand: patch.brand ?? current.brand,
    kind: patch.kind ?? current.kind,
    category: patch.category ?? current.category,
    subcategory: patch.subcategory ?? current.subcategory,
    platform: patch.platform ?? current.platform,
    externalUrl: patch.externalUrl ?? current.externalUrl,
    poster: patch.poster !== undefined ? patch.poster : current.poster,
    src: patch.src !== undefined ? patch.src : current.src,
    duration: patch.duration !== undefined ? patch.duration : current.duration,
    tags: patch.tags ?? current.tags,
    blurb: patch.blurb ?? current.blurb,
    body: patch.body !== undefined ? patch.body : current.body,
    paywalled: patch.paywalled !== undefined ? patch.paywalled : current.paywalled,
    embed: patch.embed !== undefined ? patch.embed : current.embed,
  };

  const validated = validateCreateInput(mergedRaw);
  const next: UploadedContent = {
    ...current,
    title: validated.title,
    subtitle: validated.subtitle,
    brand: validated.brand,
    kind: validated.kind,
    category: validated.category,
    subcategory: validated.subcategory,
    platform: validated.platform,
    externalUrl: validated.externalUrl,
    poster: validated.poster,
    src: validated.src,
    duration: validated.duration,
    tags: validated.tags?.length ? validated.tags : current.tags,
    blurb: validated.blurb,
    body: validated.body,
    paywalled: validated.paywalled !== false,
    embed: validated.embed,
  };

  items[idx] = next;
  await writeUploads(items);
  return next;
}

export async function findUpload(id: string): Promise<UploadedContent | undefined> {
  const items = await readUploads();
  return items.find((i) => i.id === id);
}
