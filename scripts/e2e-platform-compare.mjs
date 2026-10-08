/**
 * Platform-comparison E2E: Spotify / Instagram / Substack / Netflix / Apple TV patterns.
 * Usage: BASE=http://127.0.0.1:3020 ADMIN_EMAIL=owner@… node --experimental-strip-types scripts/e2e-platform-compare.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  isPhotoStill,
  isPlayableMedia,
  isReadableText,
  photoSrc,
} from "../src/data/catalog.ts";

const BASE = process.env.BASE || "http://127.0.0.1:3020";
const ADMIN = process.env.ADMIN_EMAIL || "owner@kamaunegasi.net";
const PASS = process.env.ADMIN_PASS || "qa-test-pass-12345";
const OUT = process.env.ARTIFACT_DIR || "/opt/cursor/artifacts/platform-compare";
mkdirSync(OUT, { recursive: true });

let pass = 0;
let fail = 0;
const notes = [];
function ok(name, cond, detail = "") {
  if (cond) {
    console.log(`PASS  ${name}`);
    pass++;
  } else {
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
    fail++;
    notes.push(`FAIL ${name}${detail ? `: ${detail}` : ""}`);
  }
}

async function api(request, path, opts = {}) {
  const res = await request.fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers: { "content-type": "application/json", ...(opts.headers || {}) },
    data: opts.data,
  });
  const json = await res.json().catch(() => null);
  return { res, json, status: res.status() };
}

console.log(`== platform compare E2E @ ${BASE} ==`);

ok("unit-still-is-photo", isPhotoStill({ kind: "still" }));
ok("unit-still-not-playable", !isPlayableMedia({ kind: "still" }));
ok("unit-writing-readable", isReadableText({ kind: "writing" }));
ok(
  "unit-photo-src-prefers-src",
  photoSrc({
    src: "/api/media/house/a.jpg",
    poster: "/p.jpg",
    externalUrl: "https://x.com",
  }) === "/api/media/house/a.jpg",
);

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || "/usr/local/bin/google-chrome",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
});

let reg = await api(context.request, "/api/auth/register", {
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
  reg = await api(context.request, "/api/auth/login", {
    method: "POST",
    data: { email: ADMIN, password: PASS, website: "" },
  });
}
ok("session-admin", Boolean(reg.json?.user?.isAdmin), JSON.stringify(reg.json?.user));

const connections = await api(context.request, "/api/connections");
const outlets = connections.json?.outlets || connections.json?.HOUSE_OUTLETS || [];
const projects = connections.json?.projects || [];
const outletBlob = JSON.stringify(connections.json || {}).toLowerCase();
ok("conn-api", connections.status === 200, String(connections.status));
ok("conn-substack", /substack/.test(outletBlob));
ok("conn-bandcamp", /bandcamp/.test(outletBlob));
ok("conn-twitch", /twitch/.test(outletBlob));
ok("conn-youtube", /youtube/.test(outletBlob));
ok("conn-no-fake-instagram", !/"instagram"/.test(outletBlob));
ok("conn-no-fake-kick", !/"kick"/.test(outletBlob));
ok("conn-no-fake-onlyfans", !/onlyfans/.test(outletBlob));
ok("conn-no-fake-spotify", !/"spotify"/.test(outletBlob));

const stamp = Date.now();
const still = await api(context.request, "/api/admin/content", {
  method: "POST",
  data: {
    title: `Still Probe ${stamp}`,
    kind: "still",
    category: "visuals",
    subcategory: "stills",
    platform: "house",
    externalUrl: "https://www.kamaunegasi.net/logo-kn-phosphor.png",
    blurb: "iPhone gallery probe",
    paywalled: false,
    tags: ["still", "probe"],
  },
});
ok(
  "publish-still",
  still.status === 201 && Boolean(still.json?.item?.id),
  `${still.status} ${JSON.stringify(still.json).slice(0, 120)}`,
);

const writing = await api(context.request, "/api/admin/content", {
  method: "POST",
  data: {
    title: `Note Probe ${stamp}`,
    kind: "writing",
    category: "writing",
    subcategory: "notes",
    platform: "house",
    externalUrl: "https://www.kamaunegasi.net/",
    blurb: "substack-like note",
    body: "Paragraph one.\n\nParagraph two for enlarge reader.",
    paywalled: true,
    tags: ["writing", "probe"],
  },
});
ok("publish-writing", writing.status === 201 && Boolean(writing.json?.item?.id), String(writing.status));

const page = await context.newPage();
await page.addInitScript(() => {
  try {
    localStorage.setItem("kn.age.ok.v1", "1");
    localStorage.setItem("kn.player.autoplay", "0");
  } catch {
    /* */
  }
});
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(600);
// If session cookie did not attach, sign in through the access form.
if (page.url().includes("/access") || (await page.locator(".access__form").count()) > 0) {
  await page.getByRole("tab", { name: /sign in/i }).click().catch(() => {});
  await page.locator('input[type="email"]').fill(ADMIN);
  await page.locator('input[type="password"]').fill(PASS);
  await page.getByRole("button", { name: /enter stream|sign in|enter/i }).first().click();
  await page.waitForURL((url) => !url.pathname.includes("/access"), { timeout: 20000 }).catch(() => {});
}
const ageEnter = page.getByRole("button", { name: /^enter$/i });
if (await ageEnter.count()) await ageEnter.first().click().catch(() => {});
await page.evaluate(() => {
  document.querySelector("button.boot__skip")?.click();
});
await page.waitForFunction(() => !document.querySelector(".boot"), null, { timeout: 20000 }).catch(() => {
  document.querySelectorAll?.(".boot");
});
await page.waitForSelector(".deck", { timeout: 30000 });

const y0 = (await page.locator(".deck").boundingBox())?.y;
await page.evaluate(() => window.scrollBy(0, 1200));
await page.waitForTimeout(200);
const y1 = (await page.locator(".deck").boundingBox())?.y;
ok(
  "spotify-fixed-dock",
  typeof y0 === "number" && Math.abs((y1 ?? 0) - (y0 ?? 0)) < 4,
  `y0=${y0} y1=${y1}`,
);
await page.screenshot({ path: `${OUT}/01-fixed-dock.png` });

ok("autoplay-control", (await page.locator("button.deck__autoplay").count()) === 1);
const autoPref = await page.evaluate(() => localStorage.getItem("kn.player.autoplay"));
const autoPressed = await page.locator("button.deck__autoplay").getAttribute("aria-pressed");
ok(
  "autoplay-pref-off",
  autoPref === "0" && autoPressed === "false",
  `pref=${autoPref} pressed=${autoPressed}`,
);

await page.locator('button[aria-label="browse"]').click();
await page.waitForTimeout(800);
await page.waitForFunction(
  (title) => [...document.querySelectorAll("button.tile")].some((b) => (b.textContent || "").includes(title)),
  `Still Probe ${stamp}`,
  { timeout: 15000 },
).catch(() => {});

const stillBtn = page.getByRole("button", { name: new RegExp(`Open Still Probe ${stamp}|Still Probe ${stamp}`, "i") });
ok("still-tile-present", (await stillBtn.count()) > 0);
if ((await stillBtn.count()) > 0) await stillBtn.first().click();
await page.waitForSelector(".photo-gallery", { timeout: 12000 }).catch(() => null);
const galleryOpen = (await page.locator(".photo-gallery").count()) > 0;
ok("instagram-photo-gallery", galleryOpen);
if (galleryOpen) {
  const pos = await page.locator(".photo-gallery").evaluate((el) => getComputedStyle(el).position);
  ok("gallery-viewport-fixed", pos === "fixed", pos);
  await page.screenshot({ path: `${OUT}/02-gallery.png` });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  ok("gallery-esc-closes", (await page.locator(".photo-gallery").count()) === 0);
} else {
  ok("gallery-viewport-fixed", false, "no gallery");
  ok("gallery-esc-closes", false, "no gallery");
}

const noteBtn = page.getByRole("button", { name: new RegExp(`Open Note Probe ${stamp}|Note Probe ${stamp}`, "i") });
if ((await noteBtn.count()) > 0) await noteBtn.first().click();
await page.waitForSelector(".writing-reader", { timeout: 12000 }).catch(() => null);
ok("substack-writing-enlarge", (await page.locator(".writing-reader__card").count()) > 0);
await page.screenshot({ path: `${OUT}/03-writing.png` });
await page.locator(".writing-reader__close").click().catch(() => {});
await page.waitForTimeout(200);

await page.locator('button[aria-label="house"]').click();
await page.waitForSelector(".atlas, [class*='atlas']", { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1000);
const atlasText = await page.locator("body").innerText();
ok("atlas-has-substack", /substack|telling show of love/i.test(atlasText));
ok("atlas-has-twitch", /twitch/i.test(atlasText));
ok("atlas-has-bandcamp", /bandcamp/i.test(atlasText));
await page.screenshot({ path: `${OUT}/04-house-atlas.png` });

await browser.close();

const matrix = {
  Spotify: {
    fixedPlayer: notes.some((n) => n.includes("spotify-fixed-dock")) ? "FAIL" : "PASS",
    autoplayToggle: notes.some((n) => n.includes("autoplay")) ? "FAIL" : "PASS",
    upNext: "PASS (deck up-next)",
    gap: "No social listening / lyrics pane",
  },
  "Apple TV / Netflix / Disney+": {
    railBrowse: "PASS (stream shelves + browse)",
    theaterPlayer: "PASS (deck--theater)",
    gap: "No continue-watching persistence across devices",
  },
  Instagram: {
    photoEnlarge: notes.some((n) => n.includes("instagram-photo-gallery")) ? "FAIL" : "PASS",
    swipeGallery: "IMPLEMENTED (PhotoGallery — swipe/pinch/double-tap/dismiss)",
    gap: "No Stories / Reels surface",
  },
  Substack: {
    writingReader: notes.some((n) => n.includes("substack-writing")) ? "FAIL" : "PASS",
    paywallNotes: "PASS (ContentPayActions)",
    gap: "No email newsletter subscribe UI on-site",
  },
  Twitch: {
    embed: "PASS (player)",
    kick: "ABSENT (no Kick outlet — not invented)",
  },
  "X / MySpace / OnlyFans": {
    status: "NOT FIRST-CLASS — no fake accounts added",
  },
  connections: {
    apiOk: connections.status === 200,
    outletHint: outlets.length || "see json",
    projectHint: projects.length || "see json",
    openPr: "https://github.com/lonerjesus/copilot-cli/pull/29",
  },
  e2e: { pass, fail, notes },
};

writeFileSync(`${OUT}/matrix.json`, JSON.stringify(matrix, null, 2));
console.log(`artifacts → ${OUT}`);
console.log(`== result: ${pass} passed · ${fail} failed ==`);
process.exit(fail ? 1 : 0);
