"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  purchasedCatalogIds: string[];
  donatedCentsTotal: number;
  createdAt: string;
};

type AuthSnapshot = {
  user: AuthUser | null;
  loading: boolean;
  version: number;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  owns: (catalogId: string) => boolean;
  markOwned: (catalogId: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

let snapshot: AuthSnapshot = { user: null, loading: true, version: 0 };
let bootstrapped = false;
const listeners = new Set<() => void>();

function emit(next: AuthSnapshot) {
  snapshot = next;
  listeners.forEach((l) => l());
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot(): AuthSnapshot {
  return { user: null, loading: true, version: 0 };
}

async function fetchMe() {
  emit({ ...snapshot, loading: true, version: snapshot.version + 1 });
  try {
    const res = await fetch("/api/auth/me", { credentials: "same-origin" });
    if (!res.ok) {
      emit({ user: null, loading: false, version: snapshot.version + 1 });
      return;
    }
    const data = (await res.json()) as { user: AuthUser };
    emit({ user: data.user, loading: false, version: snapshot.version + 1 });
  } catch {
    emit({ user: null, loading: false, version: snapshot.version + 1 });
  }
}

function ensureBootstrap() {
  if (bootstrapped || typeof window === "undefined") return;
  bootstrapped = true;
  queueMicrotask(() => {
    void fetchMe();
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  ensureBootstrap();

  const refresh = useCallback(async () => {
    await fetchMe();
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    emit({ user: null, loading: false, version: snapshot.version + 1 });
    router.push("/access");
  }, [router]);

  const owns = useCallback(
    (catalogId: string) => Boolean(state.user?.purchasedCatalogIds.includes(catalogId)),
    [state.user],
  );

  const markOwned = useCallback((catalogId: string) => {
    const current = snapshot.user;
    if (!current) return;
    if (current.purchasedCatalogIds.includes(catalogId)) return;
    emit({
      user: {
        ...current,
        purchasedCatalogIds: [...current.purchasedCatalogIds, catalogId],
      },
      loading: false,
      version: snapshot.version + 1,
    });
  }, []);

  const value = useMemo(
    () => ({
      user: state.user,
      loading: state.loading,
      refresh,
      logout,
      owns,
      markOwned,
    }),
    [state.user, state.loading, refresh, logout, owns, markOwned],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
