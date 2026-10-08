/**
 * Browser proof: house AV plays via credentialed blob mode (data-kn-av-mode=blob).
 *
 * Usage:
 *   ADMIN_EMAIL=… ADMIN_PASS=… BASE=http://127.0.0.1:3040 node scripts/e2e-player-blob.mjs
 */
import { chromium } from "playwright";
import { BROWSER_UA, resolveAdmin, resolveBase } from "./qa/lib.mjs";

const BASE = resolveBase("http://127.0.0.1:3040");
const { email: EMAIL, password: PASS } = resolveAdmin();
const OUT = process.env.SHOT || "/opt/cursor/artifacts/player-blob-mode.png";
const CHROME =
  process.env.CHROME_PATH ||
  "/usr/bin/google-chrome-stable";

const browser = await chromium.launch({
  headless: true,
  executablePath: CHROME,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({
  userAgent: BROWSER_UA,
  viewport: { width: 1280, height: 800 },
});
const page = await context.newPage();

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

try {
  console.log(`== e2e player blob @ ${BASE} ==`);
  await page.goto(`${BASE}/access`, { waitUntil: "domcontentloaded", timeout: 60000 });
  // Prefer sign-in tab for existing admin
  const signIn = page.getByRole("tab", { name: /sign in/i });
  if (await signIn.count()) await signIn.click();
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASS);
  await page.getByRole("button", { name: /enter stream/i }).click();
  await page.waitForURL((u) => !u.pathname.includes("/access"), { timeout: 30000 });
  ok("login", true, page.url());

  const ageEnter = page.locator(".agegate button", { hasText: /^enter$/i });
  if (await ageEnter.count()) {
    await ageEnter.click();
    await page.waitForSelector(".agegate", { state: "detached", timeout: 10000 }).catch(() => {});
    ok("agegate", true);
  }

  await page.waitForTimeout(800);

  // Prefer seeded Range Probe; else first featured audio title
  const probe = page.locator(".featured__title", { hasText: /Range Probe|AUDIO|audio/i }).first();
  const hasProbe = await probe.count();
  if (hasProbe) {
    const card = probe.locator(
      "xpath=ancestor::*[contains(@class,'featured') or contains(@class,'card') or self::article or self::li][1]",
    );
    if (await card.count()) {
      const play = card.locator("button").first();
      if (await play.count()) await play.click();
      else await probe.click();
    } else {
      await probe.click();
    }
    ok("selected-track", true);
  } else {
    const playBtn = page.locator('button:has-text("▶"), button[aria-label*="Play" i]').first();
    await playBtn.click({ timeout: 15000 });
    ok("selected-track", true, "fallback play");
  }

  await page.waitForSelector(
    "audio[data-kn-av-mode], video[data-kn-av-mode], .deck__native-audio[data-kn-av-mode]",
    { timeout: 60000 },
  );

  if (!(await page.locator(".deck--open").count())) {
    await page.locator(".deck__expand").click().catch(() => {});
  }
  await page.locator(".deck__play").click().catch(() => {});

  await page.waitForFunction(
    () => {
      const el =
        document.querySelector("audio[data-kn-av-mode]") ||
        document.querySelector("video[data-kn-av-mode]");
      if (!el) return false;
      const mode = el.getAttribute("data-kn-av-mode");
      const src = el.currentSrc || el.src || "";
      return mode === "blob" || src.startsWith("blob:");
    },
    null,
    { timeout: 60000 },
  );

  const info = await page.evaluate(async () => {
    const el =
      document.querySelector("audio[data-kn-av-mode]") ||
      document.querySelector("video[data-kn-av-mode]");
    try {
      await el.play();
    } catch {
      /* gesture */
    }
    return {
      tag: el.tagName,
      mode: el.getAttribute("data-kn-av-mode"),
      srcKind: (el.currentSrc || el.src || "").startsWith("blob:") ? "blob" : "other",
      paused: el.paused,
      readyState: el.readyState,
      duration: Number.isFinite(el.duration) ? el.duration : null,
    };
  });
  ok("blob-mode", info.mode === "blob" || info.srcKind === "blob", JSON.stringify(info));
  ok("ready", info.readyState >= 2, `readyState=${info.readyState}`);
  ok("has-duration", Number(info.duration) > 0, String(info.duration));

  await page.waitForTimeout(600);
  await page.screenshot({ path: OUT, fullPage: false });
  ok("screenshot", true, OUT);
} catch (e) {
  await page
    .screenshot({ path: "/opt/cursor/artifacts/player-blob-mode-fail.png", fullPage: false })
    .catch(() => {});
  console.error(e);
  fail++;
} finally {
  await browser.close();
}

console.log(`== result: ${pass} passed · ${fail} failed ==`);
process.exit(fail ? 1 : 0);
