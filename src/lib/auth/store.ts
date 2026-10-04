import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { hashPassword, randomToken, verifyPassword } from "@/lib/auth/crypto";

export type StoredUser = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  purchasedCatalogIds: string[];
  donatedCentsTotal: number;
};

export type AuthStore = {
  users: StoredUser[];
  donations: { id: string; userId: string; cents: number; at: string; mode: string }[];
};

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "auth-store.json");

let writeQueue: Promise<void> = Promise.resolve();

async function readStore(): Promise<AuthStore> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as AuthStore;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      donations: Array.isArray(parsed.donations) ? parsed.donations : [],
    };
  } catch {
    return { users: [], donations: [] };
  }
}

async function writeStore(store: AuthStore): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  });
  await writeQueue;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const store = await readStore();
  const key = normalizeEmail(email);
  return store.users.find((u) => u.email === key) ?? null;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  const store = await readStore();
  return store.users.find((u) => u.id === id) ?? null;
}

export async function createUser(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<StoredUser> {
  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Invalid email");
  }
  if (input.password.length < 10) {
    throw new Error("Password must be at least 10 characters");
  }
  const existing = await findUserByEmail(email);
  if (existing) throw new Error("Account already exists");

  const { hash, salt } = hashPassword(input.password);
  const user: StoredUser = {
    id: randomToken(18),
    email,
    displayName: input.displayName.trim().slice(0, 64) || email.split("@")[0],
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
    purchasedCatalogIds: [],
    donatedCentsTotal: 0,
  };

  const store = await readStore();
  store.users.push(user);
  await writeStore(store);
  return user;
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

export async function grantPurchase(userId: string, catalogId: string): Promise<StoredUser | null> {
  const store = await readStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return null;
  if (!user.purchasedCatalogIds.includes(catalogId)) {
    user.purchasedCatalogIds.push(catalogId);
    await writeStore(store);
  }
  return user;
}

export async function recordDonation(
  userId: string,
  cents: number,
  mode: string,
): Promise<StoredUser | null> {
  const store = await readStore();
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
  await writeStore(store);
  return user;
}

export function publicUser(user: StoredUser) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    purchasedCatalogIds: user.purchasedCatalogIds,
    donatedCentsTotal: user.donatedCentsTotal,
    createdAt: user.createdAt,
  };
}
