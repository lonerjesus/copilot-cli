/**
 * Landing hero ▶ must start AV — not idle DECK / NO SIGNAL.
 * BASE=http://127.0.0.1:3040 ADMIN_EMAIL=… ADMIN_PASS=… node scripts/e2e-hero-play.mjs
 */
import { chromium } from "playwright";

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
  viewport: { width: 1280, height: 800 },
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
});

async function api(path, opts = {}) {
  const res = await context.request.fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers: { "content-type": "application/json", ...(opts.headers || {}) },
    data: opts.data,
  });
  return { status: res.status(), json: await res.json().catch(() => null) };
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
ok("session", Boolean(reg.json?.user?.email));

const stamp = Date.now();
const pub = await api("/api/admin/content", {
  method: "POST",
  data: {
    title: `Hero Play Probe ${stamp}`,
    kind: "audio",
    category: "audio",
    subcategory: "music",
    platform: "house",
    externalUrl: "https://www.kamaunegasi.net/",
    blurb: "hero play handoff",
    paywalled: false,
    tags: ["audio", "hero"],
  },
});
ok("publish-audio", pub.status === 201 && Boolean(pub.json?.item?.id), String(pub.status));

const page = await context.newPage();
await page.addInitScript(() => {
  localStorage.setItem("kn.age.ok.v1", "1");
  localStorage.setItem("kn.player.autoplay", "1");
});
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
if (page.url().includes("/access")) {
  await page.locator('input[type="email"]').fill(ADMIN);
  await page.locator('input[type="password"]').fill(PASS);
  await page.getByRole("button", { name: /^enter stream/i }).click();
  await page.waitForURL((u) => !u.pathname.includes("/access"), { timeout: 20000 }).catch(() => {});
}
const bootSkip = page.locator("button.boot__skip");
if ((await bootSkip.count()) > 0) {
  await bootSkip.click({ force: true, timeout: 8000 }).catch(() => {});
}
await page
  .waitForFunction(() => !document.querySelector(".boot"), null, { timeout: 15000 })
  .catch(() => {});
await page.waitForSelector("button.hero__play", { timeout: 20000 });
await page.waitForTimeout(600);

await page.locator("button.hero__play").click({ force: true });
await page.waitForTimeout(800);

const deckOpen = (await page.locator(".deck--open").count()) > 0;
ok("hero-expands-deck", deckOpen);

const label = ((await page.locator(".deck__label").textContent()) || "").trim();
ok(
  "hero-not-idle-signal",
  label.length > 0 && !/^NO SIGNAL$/i.test(label) && label !== "—",
  `label=${label}`,
);
ok(
  "hero-not-deck-eyebrow",
  (await page.locator(".deck__eyebrow").filter({ hasText: /^DECK$/i }).count()) === 0,
);
ok(
  "hero-shows-probe-title",
  /Hero Play Probe/i.test(label) ||
    /Hero Play Probe/i.test((await page.locator(".deck__copy h2").textContent().catch(() => "")) || ""),
  `label=${label}`,
);

const playing = await page.locator(".deck__dot.is-live").count();
ok("hero-playing-dot", playing > 0);

await page.screenshot({
  path: process.env.ARTIFACT_DIR
    ? `${process.env.ARTIFACT_DIR}/hero-play-handoff.png`
    : "/opt/cursor/artifacts/hero-play-handoff.png",
});

await browser.close();
console.log(`== result: ${pass} passed · ${fail} failed ==`);
process.exit(fail ? 1 : 0);
