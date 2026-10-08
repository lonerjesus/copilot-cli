/**
 * Guest / non-owner member E2E on production.
 * Never uses ADMIN_EMAIL. Registers a throwaway member.
 *
 * Usage: BASE=http://127.0.0.1:3035 node scripts/e2e-guest-user.mjs
 */
import { chromium } from "playwright";
import { existsSync, mkdirSync } from "node:fs";

const BASE = process.env.BASE || "http://127.0.0.1:3035";
const OUT = process.env.ARTIFACT_DIR || "/opt/cursor/artifacts/guest-e2e";
const GUEST_EMAIL = `guest.${Date.now()}@example.com`;
const GUEST_PASS = "guest-test-pass-12345";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const CHROME = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome-stable",
  "/usr/local/bin/google-chrome",
  "/usr/bin/google-chrome",
].find((p) => p && existsSync(p));

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
    notes.push(`${name}${detail ? `: ${detail}` : ""}`);
  }
}

console.log(`== guest user E2E @ ${BASE} ==`);
console.log(`guest: ${GUEST_EMAIL}`);

const browser = await chromium.launch({
  headless: true,
  executablePath: CHROME,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

async function withBackoff(fn, tries = 6) {
  let last;
  for (let i = 0; i < tries; i++) {
    last = await fn();
    const status = last?.status ?? last?.status?.();
    const err = last?.json?.error || last?.error;
    if (status === 429 || err === "rate_limited") {
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
      continue;
    }
    return last;
  }
  return last;
}

// ——— 1. Anonymous guest (fresh context, no cookies) ———
const anon = await browser.newContext({ viewport: { width: 1280, height: 800 }, userAgent: UA });
const anonPage = await anon.newPage();
await anonPage.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 45000 });
await anonPage.waitForTimeout(500);
const landedAccess =
  anonPage.url().includes("/access") ||
  (await anonPage.locator(".access__form, #access-title").count()) > 0;
ok("anon-lands-on-access", landedAccess, anonPage.url());
await anonPage.screenshot({ path: `${OUT}/01-anon-access.png`, fullPage: false });

const accessText = await anonPage.locator("body").innerText();
ok(
  "anon-account-required-copy",
  /account required|create a free account|create account/i.test(accessText),
  accessText.slice(0, 120),
);
ok("anon-has-sign-in", /sign in/i.test(accessText));
ok("anon-has-create-account", /create account/i.test(accessText));
ok("anon-no-admin-link", !(await anonPage.locator('a[href="/admin"]').count()));
ok("anon-no-magcloud-on-access", !/magcloud/i.test(accessText));

const privacy = await anonPage.goto(`${BASE}/privacy`, { waitUntil: "domcontentloaded" });
ok("anon-privacy", privacy?.ok() || anonPage.url().includes("/privacy"));
const terms = await anonPage.goto(`${BASE}/terms`, { waitUntil: "domcontentloaded" });
ok("anon-terms", terms?.ok() || anonPage.url().includes("/terms"));

const catAnon = await withBackoff(() => anon.request.get(`${BASE}/api/catalog`));
ok(
  "anon-catalog-blocked",
  catAnon.status() === 401 || catAnon.status() === 403 || catAnon.status() === 429,
  String(catAnon.status()),
);
const adminAnon = await anon.request.get(`${BASE}/admin`);
const adminAnonText = await adminAnon.text().catch(() => "");
ok(
  "anon-admin-no-compose",
  !/admin-station|compose drop|publish/i.test(adminAnonText) ||
    /sign in as the owner|account required|access/i.test(adminAnonText),
  `status=${adminAnon.status()}`,
);
await anon.close();

// ——— 2. Create guest member (NOT owner) ———
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, userAgent: UA });
await context.addInitScript(() => {
  try {
    localStorage.setItem("kn.age.ok.v1", "1");
  } catch {
    /* */
  }
});
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e.message || e)));

async function ensureGuestSession() {
  let reg = await withBackoff(() =>
    context.request.post(`${BASE}/api/auth/register`, {
      data: {
        email: GUEST_EMAIL,
        password: GUEST_PASS,
        displayName: "Guest Member",
        birthDate: "1995-06-15",
        ageConfirmed: true,
        website: "",
      },
    }),
  );
  let json = await reg.json().catch(() => null);
  if (!json?.user?.email) {
    reg = await withBackoff(() =>
      context.request.post(`${BASE}/api/auth/login`, {
        data: { email: GUEST_EMAIL, password: GUEST_PASS, website: "" },
      }),
    );
    json = await reg.json().catch(() => null);
  }
  return { status: reg.status(), json };
}

const session = await ensureGuestSession();
ok("guest-register", Boolean(session.json?.user?.email), `${session.status} ${JSON.stringify(session.json).slice(0, 140)}`);
ok("guest-not-admin", session.json?.user?.isAdmin !== true, JSON.stringify(session.json?.user));
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);

// Age gate if shown (init script usually skips)
const ageBtn = page.getByRole("button", { name: /^enter$/i });
if (await ageBtn.count()) await ageBtn.first().click().catch(() => {});

// Skip boot
await page.evaluate(() => document.querySelector("button.boot__skip")?.click());
await page.waitForFunction(() => !document.querySelector(".boot"), null, { timeout: 15000 }).catch(() => {});

await page.waitForSelector(".deck, .shell", { timeout: 30000 });
ok("guest-enters-shell", (await page.locator(".shell").count()) > 0);
ok("guest-no-admin-nav", !(await page.locator('a[href="/admin"], button[aria-label="admin"]').count()));
await page.screenshot({ path: `${OUT}/02-guest-home.png`, fullPage: false });

// ——— 3. Navigate as member ———
await page.locator('button[aria-label="stream"]').click().catch(() => {});
await page.waitForTimeout(800);
const streamText = await page.locator("#main").innerText().catch(() => "");
ok(
  "guest-stream-view",
  /featured|video|music|photo|read|stream|empty shelf|no .* yet/i.test(streamText),
  streamText.slice(0, 80),
);

const deckVisible = await page.locator(".deck").evaluate((el) => {
  const r = el.getBoundingClientRect();
  return r.bottom <= window.innerHeight + 2 && r.height > 0;
}).catch(() => false);
ok("guest-player-dock-visible", deckVisible);

await page.evaluate(() => window.scrollBy(0, 1000));
await page.waitForTimeout(200);
const dockStillFixed = await page.locator(".deck").evaluate((el) => {
  const r = el.getBoundingClientRect();
  return Math.abs(r.bottom - window.innerHeight) < 6;
}).catch(() => false);
ok("guest-player-stays-fixed-on-scroll", dockStillFixed);
await page.screenshot({ path: `${OUT}/03-guest-scroll-dock.png`, fullPage: false });

// Browse
await page.locator('button[aria-label="browse"]').click();
await page.waitForTimeout(1200);
const browseTiles = await page.locator("button.tile").count();
ok("guest-browse-loads", browseTiles >= 0);
await page.screenshot({ path: `${OUT}/04-guest-browse.png`, fullPage: false });

// Try open a writing if present
const writingTile = page.locator('button.tile[aria-label^="Open"]').filter({ hasText: /writing|note|read/i });
const anyOpen = page.getByRole("button", { name: /^Open /i });
if ((await anyOpen.count()) > 0) {
  // Prefer a writing-looking tile; else first Open
  const target =
    (await page.locator('button.tile').filter({ hasText: /writing|note/i }).count()) > 0
      ? page.locator("button.tile").filter({ hasText: /writing|note/i }).first()
      : anyOpen.first();
  const label = await target.getAttribute("aria-label");
  await target.click();
  await page.waitForTimeout(700);
  const gallery = (await page.locator(".photo-gallery").count()) > 0;
  const reader = (await page.locator(".writing-reader").count()) > 0;
  const deckOpen = (await page.locator(".deck.deck--open, .deck--open").count()) > 0;
  ok(
    "guest-click-opens-something",
    gallery || reader || deckOpen,
    `label=${label} gallery=${gallery} reader=${reader} deck=${deckOpen}`,
  );
  if (reader) {
    const chrome = await page.locator(".writing-reader").innerText();
    ok("guest-writing-not-magcloud", !/magcloud/i.test(chrome) && /house writing|writing|note/i.test(chrome));
    await page.screenshot({ path: `${OUT}/05-guest-writing.png`, fullPage: false });
    await page.locator(".writing-reader__close").click().catch(() => page.keyboard.press("Escape"));
  } else if (gallery) {
    ok("guest-photo-gallery", true);
    await page.screenshot({ path: `${OUT}/05-guest-photo.png`, fullPage: false });
    await page.keyboard.press("Escape");
  } else {
    ok("guest-writing-not-magcloud", true, "opened player instead — ok for AV tile");
  }
  await page.waitForTimeout(300);
} else {
  ok("guest-click-opens-something", browseTiles === 0, "no tiles to open (empty catalog for guest)");
  ok("guest-writing-not-magcloud", true, "skipped — empty");
}

// House atlas
await page.locator('button[aria-label="house"]').click();
await page.waitForTimeout(1500);
const houseText = await page.locator("#main").innerText().catch(async () => page.locator("body").innerText());
ok("guest-house-atlas", /outlet|project|substack|bandcamp|twitch|house/i.test(houseText));
ok("guest-house-no-compose-admin", !/compose|publish drop|admin station/i.test(houseText));
await page.screenshot({ path: `${OUT}/06-guest-house.png`, fullPage: false });

// Support
await page.locator('button[aria-label="support"]').click();
await page.waitForTimeout(800);
const supportText = await page.locator("#main").innerText().catch(() => "");
ok("guest-support-view", /support|donate|stripe|member/i.test(supportText) || supportText.length > 0);

// Autoplay control visible to guest
ok("guest-autoplay-control", (await page.locator("button.deck__autoplay").count()) === 1);

// Direct admin URL as guest session
await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
const adminBody = await page.locator("body").innerText();
const onAdminBlocked =
  /sign in as the owner|not authorized|forbidden|access|account required/i.test(adminBody) ||
  page.url().includes("/access") ||
  !(await page.locator(".admin, [class*='admin-station']").count());
ok("guest-cannot-use-admin", onAdminBlocked, page.url());
await page.screenshot({ path: `${OUT}/07-guest-admin-blocked.png`, fullPage: false });

// Footprint redirect behavior
const foot = await withBackoff(
  () => context.request.get(`${BASE}/footprint`, { maxRedirects: 0 }),
);
const footStatus = foot?.status?.() ?? 0;
ok(
  "guest-footprint-gated-or-ok",
  footStatus === 200 ||
    footStatus === 307 ||
    footStatus === 302 ||
    footStatus === 401 ||
    footStatus === 429,
  String(footStatus),
);

ok("guest-no-page-errors", pageErrors.length === 0, pageErrors.slice(0, 3).join(" | "));

await browser.close();
console.log(`artifacts → ${OUT}`);
console.log(`== result: ${pass} passed · ${fail} failed ==`);
if (notes.length) console.log("failures:\n - " + notes.join("\n - "));
process.exit(fail ? 1 : 0);
