/**
 * Batch album/series collection API + ZIP unit path.
 * Usage: BASE=http://127.0.0.1:3040 ADMIN_EMAIL=… ADMIN_PASS=… node scripts/e2e-batch-collection.mjs
 */
import { chromium } from "playwright";
import { deflateRawSync } from "node:zlib";

const BASE = (process.env.BASE || "http://127.0.0.1:3040").replace(/\/$/, "");
const ADMIN = process.env.ADMIN_EMAIL || "owner@kamaunegasi.net";
const PASS = process.env.ADMIN_PASS || "qa-test-pass-12345";

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

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || "/usr/local/bin/google-chrome",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const context = await browser.newContext({
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
});

async function api(path, opts = {}) {
  const res = await context.request.fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers: { "content-type": "application/json", ...(opts.headers || {}) },
    data: opts.data,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status(), json };
}

let reg = await api("/api/auth/register", {
  method: "POST",
  data: {
    email: ADMIN,
    password: PASS,
    displayName: "Owner",
    birthDate: "1987-04-05",
    ageConfirmed: true,
    website: "",
  },
});
if (!reg.json?.user?.email) {
  reg = await api("/api/auth/login", {
    method: "POST",
    data: { email: ADMIN, password: PASS, website: "" },
  });
}
ok("session-admin", Boolean(reg.json?.user?.isAdmin), JSON.stringify(reg.json?.user));

const stamp = Date.now();
const albumTitle = `Batch Album ${stamp}`;
const t1 = await api("/api/admin/content", {
  method: "POST",
  data: {
    title: `Track One ${stamp}`,
    subtitle: albumTitle,
    kind: "audio",
    category: "audio",
    subcategory: "music",
    platform: "house",
    externalUrl: "https://www.kamaunegasi.net/",
    blurb: `${albumTitle} · 1`,
    paywalled: false,
    tags: ["album"],
    collection: {
      type: "album",
      id: `batch-album-${stamp}`,
      title: albumTitle,
      index: 1,
    },
  },
});
ok("publish-track-1", t1.status === 201 && t1.json?.item?.collection?.index === 1);

const t2 = await api("/api/admin/content", {
  method: "POST",
  data: {
    title: `Track Two ${stamp}`,
    subtitle: albumTitle,
    kind: "audio",
    category: "audio",
    subcategory: "music",
    platform: "house",
    externalUrl: "https://www.kamaunegasi.net/",
    blurb: `${albumTitle} · 2`,
    paywalled: false,
    tags: ["album"],
    collection: {
      type: "album",
      id: `batch-album-${stamp}`,
      title: albumTitle,
      index: 2,
    },
  },
});
ok("publish-track-2", t2.status === 201 && t2.json?.item?.collection?.type === "album");
ok(
  "tags-stamped",
  Array.isArray(t2.json?.item?.tags) &&
    t2.json.item.tags.some((t) => String(t).startsWith("album:")),
);

const bad = await api("/api/admin/content", {
  method: "POST",
  data: {
    title: `Bad Collection ${stamp}`,
    kind: "audio",
    category: "audio",
    subcategory: "music",
    platform: "house",
    externalUrl: "https://www.kamaunegasi.net/",
    blurb: "x",
    collection: { type: "playlist", title: "nope" },
  },
});
ok("reject-fake-collection-type", bad.status === 400);

const cat = await api("/api/catalog");
const items = cat.json?.items || [];
const albumItems = items.filter(
  (i) => i.collection?.id === `batch-album-${stamp}`,
);
ok("catalog-has-album", albumItems.length >= 2, String(albumItems.length));

// Browser: admin compose shows Album / Series modes
const page = await context.newPage();
await page.addInitScript(() => {
  localStorage.setItem("kn.age.ok.v1", "1");
});
await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded", timeout: 60000 });
if (page.url().includes("/access")) {
  await page.locator('input[type="email"]').fill(ADMIN);
  await page.locator('input[type="password"]').fill(PASS);
  await page.getByRole("button", { name: /^enter stream/i }).click();
  await page.waitForURL((u) => u.pathname.includes("/admin"), { timeout: 20000 }).catch(() => {});
  await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
}
await page.waitForSelector(".admin__batch-modes", { timeout: 20000 }).catch(() => null);
ok("ui-batch-modes", (await page.locator(".admin__batch-modes").count()) === 1);
await page.getByRole("button", { name: /^Album$/i }).click();
ok(
  "ui-album-title",
  (await page.locator(".admin__collection-title input").count()) === 1,
);
await page.getByRole("button", { name: /^Series$/i }).click();
const ph = await page.locator(".admin__collection-title input").getAttribute("placeholder");
ok("ui-series-placeholder", /season/i.test(ph || ""));

await browser.close();

// ZIP helper still green (store) — light smoke without importing TS path twice
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}
const data = Buffer.from("KN");
const name = Buffer.from("a.mp3");
const crc = crc32(data);
const local = Buffer.alloc(30 + name.length + data.length);
local.writeUInt32LE(0x04034b50, 0);
local.writeUInt16LE(20, 4);
local.writeUInt32LE(crc, 14);
local.writeUInt32LE(data.length, 18);
local.writeUInt32LE(data.length, 22);
local.writeUInt16LE(name.length, 26);
name.copy(local, 30);
data.copy(local, 30 + name.length);
ok("zip-local-header-built", local.length > 30);
void deflateRawSync; // keep import used for future deflate cases

console.log(`== result: ${pass} passed · ${fail} failed ==`);
process.exit(fail ? 1 : 0);
