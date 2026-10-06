import { AuthStoreUnavailableError } from "@/lib/auth/store";

/**
 * First-party engagement events for the owner analytics tab.
 * Same AUTH_KV backend as auth (separate key), or local `.data/`.
 */

export type ServerAnalyticsEvent = {
  signal: string;
  at: number;
  meta?: Record<string, string | number | boolean>;
  userId?: string;
};

const KEY = "analytics-events-v1";
const MAX = 2000;

type AuthKv = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};

const g = globalThis as typeof globalThis & { __knAnalytics?: ServerAnalyticsEvent[] };
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

async function readEvents(): Promise<ServerAnalyticsEvent[]> {
  const mode = await resolveBackend();
  if (mode === "kv") {
    const kv = await getAuthKv();
    if (!kv) throw new AuthStoreUnavailableError();
    const raw = await kv.get(KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as ServerAnalyticsEvent[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (mode === "fs") {
    const { readFile } = await import("node:fs/promises");
    const path = await import("node:path");
    try {
      const raw = await readFile(path.join(process.cwd(), ".data", "analytics-events.json"), "utf8");
      const parsed = JSON.parse(raw) as ServerAnalyticsEvent[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (!g.__knAnalytics) g.__knAnalytics = [];
  return g.__knAnalytics;
}

async function writeEvents(events: ServerAnalyticsEvent[]): Promise<void> {
  const mode = await resolveBackend();
  const trimmed = events.slice(-MAX);
  const payload = JSON.stringify(trimmed);
  writeQueue = writeQueue.then(async () => {
    if (mode === "kv") {
      const kv = await getAuthKv();
      if (!kv) throw new AuthStoreUnavailableError();
      await kv.put(KEY, payload);
      return;
    }
    if (mode === "fs") {
      const { writeFile, mkdir } = await import("node:fs/promises");
      const path = await import("node:path");
      const dataDir = path.join(process.cwd(), ".data");
      await mkdir(dataDir, { recursive: true });
      await writeFile(path.join(dataDir, "analytics-events.json"), payload, "utf8");
      return;
    }
    g.__knAnalytics = trimmed;
  });
  await writeQueue;
}

const ALLOWED = new Set([
  "boot_complete",
  "age_accepted",
  "enter_stream",
  "play",
  "next",
  "queue_next",
  "magazine_open",
  "category_filter",
  "command",
  "footprint_open",
  "cosmogram_view",
  "publish",
  "admin_edit",
]);

export async function recordAnalyticsEvent(
  event: Omit<ServerAnalyticsEvent, "at"> & { at?: number },
): Promise<void> {
  const signal = String(event.signal ?? "").trim();
  if (!ALLOWED.has(signal)) return;
  const events = await readEvents();
  events.push({
    signal,
    at: event.at ?? Date.now(),
    meta: event.meta,
    userId: event.userId,
  });
  await writeEvents(events);
}

export async function summarizeAnalytics(limit = 40) {
  const events = await readEvents();
  const bySignal: Record<string, number> = {};
  for (const e of events) {
    bySignal[e.signal] = (bySignal[e.signal] ?? 0) + 1;
  }
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const last24h = events.filter((e) => e.at >= dayAgo).length;
  const plays = events.filter((e) => e.signal === "play" || e.signal === "enter_stream");
  const topIds = new Map<string, number>();
  for (const e of plays) {
    const id = e.meta && typeof e.meta.id === "string" ? e.meta.id : null;
    if (!id) continue;
    topIds.set(id, (topIds.get(id) ?? 0) + 1);
  }
  return {
    totalEvents: events.length,
    last24h,
    bySignal,
    topPlayed: [...topIds.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ id, count })),
    recent: [...events].reverse().slice(0, limit),
  };
}
