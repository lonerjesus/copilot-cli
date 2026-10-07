/**
 * Site-wide ticker strip — admin-authored text that scrolls under the 18+ banner.
 * Backed by AUTH_KV (or local `.data/`) same as catalog uploads.
 */

import { AuthStoreUnavailableError } from "@/lib/auth/store";

export type SiteTicker = {
  text: string;
  enabled: boolean;
  updatedAt: string;
  updatedBy: string;
};

const TICKER_KEY = "site-ticker-v1";
const MAX_TICKER_CHARS = 280;

type AuthKv = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};

const g = globalThis as typeof globalThis & { __knTicker?: SiteTicker };
type Backend = "kv" | "fs" | "memory";
let backend: Backend | null = null;

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
      throw new AuthStoreUnavailableError("AUTH_KV is not a KV Namespace binding");
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

function emptyTicker(): SiteTicker {
  return {
    text: "",
    enabled: false,
    updatedAt: new Date(0).toISOString(),
    updatedBy: "",
  };
}

function normalizeTicker(raw: unknown): SiteTicker {
  if (!raw || typeof raw !== "object") return emptyTicker();
  const o = raw as Record<string, unknown>;
  return {
    text: String(o.text ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_TICKER_CHARS),
    enabled: Boolean(o.enabled) && Boolean(String(o.text ?? "").trim()),
    updatedAt: String(o.updatedAt ?? new Date(0).toISOString()),
    updatedBy: String(o.updatedBy ?? "").slice(0, 120),
  };
}

async function readTicker(): Promise<SiteTicker> {
  const mode = await resolveBackend();
  if (mode === "kv") {
    const kv = await getAuthKv();
    if (!kv) throw new AuthStoreUnavailableError();
    const raw = await kv.get(TICKER_KEY);
    if (!raw) return emptyTicker();
    try {
      return normalizeTicker(JSON.parse(raw));
    } catch {
      return emptyTicker();
    }
  }
  if (mode === "fs") {
    const { readFile } = await import("node:fs/promises");
    const path = await import("node:path");
    try {
      const raw = await readFile(path.join(process.cwd(), ".data", "site-ticker.json"), "utf8");
      return normalizeTicker(JSON.parse(raw));
    } catch {
      return emptyTicker();
    }
  }
  return g.__knTicker ? normalizeTicker(g.__knTicker) : emptyTicker();
}

async function writeTicker(ticker: SiteTicker): Promise<void> {
  const mode = await resolveBackend();
  const payload = JSON.stringify(ticker);
  if (mode === "kv") {
    const kv = await getAuthKv();
    if (!kv) throw new AuthStoreUnavailableError();
    await kv.put(TICKER_KEY, payload);
    return;
  }
  if (mode === "fs") {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const dataDir = path.join(process.cwd(), ".data");
    await mkdir(dataDir, { recursive: true });
    await writeFile(path.join(dataDir, "site-ticker.json"), payload, "utf8");
    return;
  }
  g.__knTicker = ticker;
}

export async function getSiteTicker(): Promise<SiteTicker> {
  try {
    return await readTicker();
  } catch (err) {
    if (err instanceof AuthStoreUnavailableError) throw err;
    return emptyTicker();
  }
}

export async function setSiteTicker(input: {
  text: string;
  enabled: boolean;
  updatedBy: string;
}): Promise<SiteTicker> {
  const text = input.text.replace(/\s+/g, " ").trim().slice(0, MAX_TICKER_CHARS);
  const next: SiteTicker = {
    text,
    enabled: Boolean(input.enabled) && text.length > 0,
    updatedAt: new Date().toISOString(),
    updatedBy: input.updatedBy.slice(0, 120),
  };
  await writeTicker(next);
  return next;
}

export { MAX_TICKER_CHARS };
