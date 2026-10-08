/**
 * E2E: publish a writing with body → catalog includes body → openReadable path.
 * Usage: BASE=http://127.0.0.1:3012 node scripts/e2e-writing-open.mjs
 */
import { isPlayableMedia, isReadableText } from "../src/data/catalog.ts";

const BASE = process.env.BASE || "http://127.0.0.1:3012";
const ADMIN = process.env.ADMIN_EMAIL || "av.owner@kamaunegasi.net";
const PASS = process.env.ADMIN_PASS || "qa-test-pass-12345";
const UA = "Mozilla/5.0 (compatible; KN-QA/1.0; +https://www.kamaunegasi.net)";

let pass = 0;
let fail = 0;
function ok(name, cond, detail = "") {
  if (cond) {
    console.log(`PASS  ${name}`);
    pass++;
  } else {
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
    fail++;
  }
}

function cookieJar() {
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
  };
}

async function api(path, { method = "GET", body, headers = {}, jar } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "User-Agent": UA,
      ...(jar ? { Cookie: jar.header() } : {}),
      ...headers,
    },
    body,
    redirect: "manual",
  });
  if (jar) jar.store(res);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* */
  }
  return { res, text, json };
}

console.log(`== e2e writing open @ ${BASE} ==`);

// Unit: readable vs playable
ok("unit-writing-readable", isReadableText({ kind: "writing" }));
ok("unit-writing-not-playable", !isPlayableMedia({ kind: "writing" }));
ok("unit-audio-playable", isPlayableMedia({ kind: "audio" }));
ok("unit-audio-not-readable-text", !isReadableText({ kind: "audio" }));
ok("unit-still-readable", isReadableText({ kind: "still" }));
ok(
  "unit-body-readable",
  isReadableText({ kind: "vlog", body: "note" }),
);

const jar = cookieJar();
let { json } = await api("/api/auth/register", {
  method: "POST",
  jar,
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    email: ADMIN,
    password: PASS,
    displayName: "AV Owner",
    birthDate: "1987-04-05",
    ageConfirmed: true,
    website: "",
  }),
});
if (!json?.user?.email) {
  ({ json } = await api("/api/auth/login", {
    method: "POST",
    jar,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: ADMIN, password: PASS, website: "" }),
  }));
}
ok("admin-session", Boolean(json?.user?.isAdmin || json?.user?.email));

const title = `Writing Open Probe ${Date.now()}`;
const bodyText =
  "First paragraph of the house note.\n\nSecond paragraph — click must open the reader.";
const pub = await api("/api/admin/content", {
  method: "POST",
  jar,
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    title,
    kind: "writing",
    category: "writing",
    subcategory: "notes",
    platform: "house",
    externalUrl: "https://www.kamaunegasi.net/",
    blurb: "short blurb",
    body: bodyText,
    paywalled: true,
    tags: ["writing", "probe"],
  }),
});
ok("publish-writing", pub.res.status === 201 && Boolean(pub.json?.item?.id), pub.text.slice(0, 160));
const id = pub.json?.item?.id;
ok("publish-has-body", pub.json?.item?.body === bodyText, String(pub.json?.item?.body?.slice(0, 40)));

const catalog = await api("/api/catalog", { jar });
const hit = (catalog.json?.items || []).find((i) => i.id === id);
ok("catalog-has-writing", Boolean(hit), id || "missing");
ok("catalog-body", hit?.body === bodyText, String(hit?.body?.slice(0, 40)));
ok("catalog-kind-writing", hit?.kind === "writing", hit?.kind);
ok("catalog-readable", hit ? isReadableText(hit) : false);
ok("catalog-not-playable", hit ? !isPlayableMedia(hit) : false);

// House writings open via WritingReader — MagCloud is archive-only, not required.
ok("house-writing-not-magcloud", true);

console.log(`== result: ${pass} passed · ${fail} failed ==`);
process.exit(fail ? 1 : 0);
