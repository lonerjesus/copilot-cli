/**
 * Shared QA helpers — one cookie jar, one admin contract, one UA.
 */

export const QA_UA =
  "Mozilla/5.0 (compatible; KN-QA/1.0; +https://www.kamaunegasi.net)";

export const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export function resolveBase(fallback = "http://127.0.0.1:3000") {
  return (process.env.BASE || fallback).replace(/\/$/, "");
}

export function resolveAdmin() {
  const email = process.env.ADMIN_EMAIL || "av.owner@kamaunegasi.net";
  const password = process.env.ADMIN_PASS || "qa-test-pass-12345";
  return { email, password };
}

export function cookieJar() {
  const jar = new Map();
  return {
    store(res) {
      const raw = res.headers.getSetCookie?.() || [];
      for (const c of raw) {
        const [pair] = c.split(";");
        const eq = pair.indexOf("=");
        if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
      }
    },
    header() {
      return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    clear() {
      jar.clear();
    },
  };
}

export function counters() {
  let pass = 0;
  let fail = 0;
  return {
    ok(name, cond, detail = "") {
      if (cond) {
        console.log(`PASS  ${name}`);
        pass++;
      } else {
        console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
        fail++;
      }
      return Boolean(cond);
    },
    result() {
      console.log(`== result: ${pass} passed · ${fail} failed ==`);
      return fail;
    },
    get pass() {
      return pass;
    },
    get fail() {
      return fail;
    },
  };
}

export async function api(base, path, { method = "GET", body, headers = {}, jar, ua = QA_UA } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      "User-Agent": ua,
      ...(jar ? { Cookie: jar.header() } : {}),
      ...headers,
    },
    body,
    redirect: "manual",
  });
  if (jar) jar.store(res);
  const buf = Buffer.from(await res.arrayBuffer());
  let json = null;
  const text = buf.toString("utf8");
  try {
    json = JSON.parse(text);
  } catch {
    /* binary / html */
  }
  return { res, buf, text, json };
}

/** Register or login; require isAdmin === true for owner suites. */
export async function ensureAdmin(base, { requireAdmin = true } = {}) {
  const { email, password } = resolveAdmin();
  const jar = cookieJar();
  let { json, res } = await api(base, "/api/auth/register", {
    method: "POST",
    jar,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      displayName: "AV Owner",
      birthDate: "1987-04-05",
      ageConfirmed: true,
      website: "",
    }),
  });
  if (!json?.user?.email) {
    ({ json, res } = await api(base, "/api/auth/login", {
      method: "POST",
      jar,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, website: "" }),
    }));
  }
  const user = json?.user;
  if (!user?.email) {
    throw new Error(`admin-session failed status=${res.status} body=${JSON.stringify(json).slice(0, 160)}`);
  }
  if (requireAdmin && user.isAdmin !== true) {
    throw new Error(
      `admin-session not admin — set ADMIN_EMAIL to match server (got ${user.email}, isAdmin=${user.isAdmin})`,
    );
  }
  return { jar, user, email, password };
}

export async function ensureGuest(base) {
  const jar = cookieJar();
  const stamp = Date.now();
  const email = `guest.${stamp}@kamaunegasi.test`;
  const password = "qa-guest-pass-12345";
  const { json, res } = await api(base, "/api/auth/register", {
    method: "POST",
    jar,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      displayName: "Guest QA",
      birthDate: "1992-08-12",
      ageConfirmed: true,
      website: "",
    }),
  });
  if (!json?.user?.email) {
    throw new Error(`guest register failed status=${res.status}`);
  }
  if (json.user.isAdmin) {
    throw new Error("guest unexpectedly admin");
  }
  return { jar, user: json.user, email, password };
}
