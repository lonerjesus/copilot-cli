import { hashPassword, randomToken, verifyPassword } from "@/lib/auth/crypto";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/data/commerce";
import { assertAdultBirthDate } from "@/lib/chart";

/**
 * Auth/commerce store.
 * Priority: Cloudflare KV (`AUTH_KV`) → local `.data/auth-store.json` →
 * memory only when not production (or `ALLOW_MEMORY_AUTH=1`).
 * Production Workers without KV fail closed — never silent memory.
 */

export type StoredUser = {
  id: string;
  email: string;
  displayName: string;
  /** ISO YYYY-MM-DD — powers personal cosmogram; never shown as legal name */
  birthDate?: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  purchasedCatalogIds: string[];
  donatedCentsTotal: number;
  /** Only one login at a time — must match session cookie `sid`. */
  activeSessionId?: string;
};

export type AuthStore = {
  users: StoredUser[];
  donations: { id: string; userId: string; cents: number; at: string; mode: string }[];
};

const STORE_KEY = "auth-store-v1";

/** Minimal KV surface used by the auth store (avoids hard dep on workers-types). */
type AuthKv = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};

const g = globalThis as typeof globalThis & { __knAuthStore?: AuthStore };
type Backend = "kv" | "fs" | "memory";
let backend: Backend | null = null;
let writeQueue: Promise<void> = Promise.resolve();

export class AuthStoreUnavailableError extends Error {
  constructor(message = "Auth store unavailable — bind AUTH_KV for Workers production") {
    super(message);
    this.name = "AuthStoreUnavailableError";
  }
}

function emptyStore(): AuthStore {
  return { users: [], donations: [] };
}

function normalizeStore(parsed: AuthStore): AuthStore {
  return {
    users: Array.isArray(parsed.users) ? [...parsed.users] : [],
    donations: Array.isArray(parsed.donations) ? [...parsed.donations] : [],
  };
}

function memoryStore(): AuthStore {
  if (!g.__knAuthStore) g.__knAuthStore = emptyStore();
  return g.__knAuthStore;
}

function allowMemoryFallback(): boolean {
  return (
    process.env.ALLOW_MEMORY_AUTH === "1" || process.env.NODE_ENV !== "production"
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

async function getAuthKv(): Promise<AuthKv | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const raw = (ctx.env as { AUTH_KV?: unknown }).AUTH_KV;
    // Dashboard Variables named AUTH_KV are strings — not a KV binding.
    if (raw != null && !isAuthKv(raw)) {
      throw new AuthStoreUnavailableError(
        "AUTH_KV is not a KV Namespace binding (delete any Variable named AUTH_KV; add Bindings → KV Namespace → variable name AUTH_KV)",
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

async function readStore(): Promise<AuthStore> {
  const mode = await resolveBackend();

  if (mode === "memory") return memoryStore();

  if (mode === "kv") {
    const kv = await getAuthKv();
    if (!kv) throw new AuthStoreUnavailableError();
    const raw = await kv.get(STORE_KEY);
    if (!raw) return emptyStore();
    try {
      return normalizeStore(JSON.parse(raw) as AuthStore);
    } catch {
      return emptyStore();
    }
  }

  try {
    const { readFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const storePath = path.join(process.cwd(), ".data", "auth-store.json");
    const raw = await readFile(storePath, "utf8");
    return normalizeStore(JSON.parse(raw) as AuthStore);
  } catch {
    return emptyStore();
  }
}

async function writeStore(store: AuthStore): Promise<void> {
  const mode = await resolveBackend();

  if (mode === "memory") {
    g.__knAuthStore = store;
    return;
  }

  if (mode === "kv") {
    const kv = await getAuthKv();
    if (!kv) throw new AuthStoreUnavailableError();
    await kv.put(STORE_KEY, JSON.stringify(store));
    return;
  }

  const { mkdir, writeFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const dataDir = path.join(process.cwd(), ".data");
  await mkdir(dataDir, { recursive: true });
  await writeFile(
    path.join(dataDir, "auth-store.json"),
    JSON.stringify(store, null, 2),
    "utf8",
  );
}

/**
 * Serialize full read-modify-write so concurrent login/purchase/donation
 * cannot clobber activeSessionId or other user fields.
 */
async function updateStore<T>(mutator: (store: AuthStore) => T | Promise<T>): Promise<T> {
  const run = async () => {
    const store = await readStore();
    const result = await mutator(store);
    await writeStore(store);
    return result;
  };
  const queued = writeQueue.then(run, run);
  writeQueue = queued.then(
    () => undefined,
    () => undefined,
  );
  return queued;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function mapStoreError(err: unknown): never {
  if (err instanceof AuthStoreUnavailableError) throw err;
  throw err;
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  try {
    const store = await readStore();
    const key = normalizeEmail(email);
    return store.users.find((u) => u.email === key) ?? null;
  } catch (err) {
    mapStoreError(err);
  }
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  try {
    const store = await readStore();
    return store.users.find((u) => u.id === id) ?? null;
  } catch (err) {
    mapStoreError(err);
  }
}

export async function createUser(input: {
  email: string;
  password: string;
  displayName: string;
  birthDate: string;
}): Promise<StoredUser> {
  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Invalid email");
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (input.password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(`Password must be at most ${MAX_PASSWORD_LENGTH} characters`);
  }
  const birthDate = assertAdultBirthDate(input.birthDate);
  const existing = await findUserByEmail(email);
  if (existing) throw new Error("Account already exists");

  const { hash, salt } = hashPassword(input.password);
  const user: StoredUser = {
    id: randomToken(18),
    email,
    displayName: input.displayName.trim().slice(0, 64) || email.split("@")[0] || "member",
    birthDate,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
    purchasedCatalogIds: [],
    donatedCentsTotal: 0,
  };

  return updateStore((store) => {
    if (store.users.some((u) => u.email === email)) {
      throw new Error("Account already exists");
    }
    store.users.push(user);
    return user;
  });
}

export async function updateUserBirthDate(
  userId: string,
  birthDateRaw: string,
): Promise<StoredUser | null> {
  const birthDate = assertAdultBirthDate(birthDateRaw);
  return updateStore((store) => {
    const user = store.users.find((u) => u.id === userId);
    if (!user) return null;
    user.birthDate = birthDate;
    return user;
  });
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<StoredUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) return null;
  return user;
}

/** Bind the sole active login session (invalidates any prior device). */
export async function setActiveSession(
  userId: string,
  sessionId: string,
): Promise<StoredUser | null> {
  return updateStore((store) => {
    const user = store.users.find((u) => u.id === userId);
    if (!user) return null;
    user.activeSessionId = sessionId;
    return user;
  });
}

export async function clearActiveSession(userId: string): Promise<void> {
  await updateStore((store) => {
    const user = store.users.find((u) => u.id === userId);
    if (!user) return;
    delete user.activeSessionId;
  });
}

export async function grantPurchase(userId: string, catalogId: string): Promise<StoredUser | null> {
  return updateStore((store) => {
    const user = store.users.find((u) => u.id === userId);
    if (!user) return null;
    if (!user.purchasedCatalogIds.includes(catalogId)) {
      user.purchasedCatalogIds.push(catalogId);
    }
    return user;
  });
}

export async function recordDonation(
  userId: string,
  cents: number,
  mode: string,
): Promise<StoredUser | null> {
  return updateStore((store) => {
    const user = store.users.find((u) => u.id === userId);
    if (!user) return null;
    user.donatedCentsTotal += cents;
    store.donations.push({
      id: randomToken(12),
      userId,
      cents,
      at: new Date().toISOString(),
      mode,
    });
    return user;
  });
}

export function publicUser(user: StoredUser, opts?: { isAdmin?: boolean }) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    birthDate: user.birthDate ?? null,
    purchasedCatalogIds: user.purchasedCatalogIds,
    donatedCentsTotal: user.donatedCentsTotal,
    createdAt: user.createdAt,
    isAdmin: Boolean(opts?.isAdmin),
  };
}

/** Owner dashboard aggregates — never exposes password hashes. */
export async function getAdminStats() {
  const store = await readStore();
  const purchaseCounts = new Map<string, number>();
  let purchaseEvents = 0;
  for (const user of store.users) {
    for (const id of user.purchasedCatalogIds) {
      purchaseEvents += 1;
      purchaseCounts.set(id, (purchaseCounts.get(id) ?? 0) + 1);
    }
  }
  const topPurchased = [...purchaseCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([catalogId, buyers]) => ({ catalogId, buyers }));

  const donationCents = store.donations.reduce((sum, d) => sum + d.cents, 0);
  const recentDonations = [...store.donations]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 20)
    .map((d) => {
      const member = store.users.find((u) => u.id === d.userId);
      return {
        id: d.id,
        cents: d.cents,
        at: d.at,
        mode: d.mode,
        displayName: member?.displayName ?? "member",
        email: member?.email ?? "",
      };
    });

  const members = store.users
    .map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      createdAt: u.createdAt,
      purchasedCount: u.purchasedCatalogIds.length,
      donatedCentsTotal: u.donatedCentsTotal,
      online: Boolean(u.activeSessionId),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    memberCount: members.length,
    onlineCount: members.filter((m) => m.online).length,
    donationCount: store.donations.length,
    donationCents,
    purchaseEvents,
    uniquePurchasedPieces: purchaseCounts.size,
    topPurchased,
    recentDonations,
    members,
  };
}
