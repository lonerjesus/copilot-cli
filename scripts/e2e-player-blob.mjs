/**
 * Browser proof: house AV plays via credentialed blob mode (data-kn-av-mode=blob).
 *
 * Seeds a short house WAV via admin API, then plays it in the dock.
 *
 * Usage:
 *   ADMIN_EMAIL=… ADMIN_PASS=… BASE=http://127.0.0.1:3040 node scripts/e2e-player-blob.mjs
 */
import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { BROWSER_UA, resolveAdmin, resolveBase } from "./qa/lib.mjs";

const BASE = resolveBase("http://127.0.0.1:3040");
const { email: EMAIL, password: PASS } = resolveAdmin();
const OUT = process.env.SHOT || "/opt/cursor/artifacts/player-blob-mode.png";
const CHROME = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome-stable",
  "/usr/local/bin/google-chrome",
  "/usr/bin/google-chrome",
].find((p) => p && existsSync(p));

function makeWav(seconds = 2, sampleRate = 22050) {
  const numSamples = Math.floor(seconds * sampleRate);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < numSamples; i++) {
    const s = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.2 * 32767;
    buffer.writeInt16LE(s | 0, 44 + i * 2);
  }
  return buffer;
}

async function apiJson(context, path, { method = "GET", data, headers, multipart } = {}) {
  let last;
  for (let i = 0; i < 8; i++) {
    last = multipart
      ? await context.request.fetch(`${BASE}${path}`, { method, multipart, headers })
      : await context.request.fetch(`${BASE}${path}`, {
          method,
          data,
          headers: { "content-type": "application/json", ...headers },
        });
    if (last.status() !== 429) break;
    await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
  }
  const text = await last.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* */
  }
  return { res: last, status: last.status(), json, text };
}

const browser = await chromium.launch({
  headless: true,
  executablePath: CHROME,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({
  userAgent: BROWSER_UA,
  viewport: { width: 1280, height: 800 },
});
await context.addInitScript(() => {
  try {
    localStorage.setItem("kn.age.ok.v1", "1");
  } catch {
    /* */
  }
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
  return Boolean(cond);
}

try {
  console.log(`== e2e player blob @ ${BASE} ==`);
  let auth = await apiJson(context, "/api/auth/login", {
    method: "POST",
    data: { email: EMAIL, password: PASS, website: "" },
  });
  if (!auth.json?.user?.email) {
    const reg = await apiJson(context, "/api/auth/register", {
      method: "POST",
      data: {
        email: EMAIL,
        password: PASS,
        displayName: "AV Owner",
        birthDate: "1987-04-05",
        ageConfirmed: true,
        website: "",
      },
    });
    if (reg.json?.user?.email) {
      auth = reg;
    } else {
      // Account exists / race — login again
      auth = await apiJson(context, "/api/auth/login", {
        method: "POST",
        data: { email: EMAIL, password: PASS, website: "" },
      });
    }
  }
  if (!ok("login-api", auth.json?.user?.isAdmin === true, auth.text.slice(0, 160))) {
    throw new Error("admin login required");
  }

  // Seed a short house WAV so blob path is guaranteed
  const wav = makeWav(2);
  const title = `Blob Probe ${Date.now()}`;
  const up = await apiJson(context, "/api/admin/media", {
    method: "POST",
    multipart: {
      file: {
        name: "blob-probe.wav",
        mimeType: "audio/wav",
        buffer: wav,
      },
      role: "media",
    },
  });
  if (!ok("upload-wav", up.status === 201 && Boolean(up.json?.url), up.text.slice(0, 160))) {
    throw new Error("upload failed");
  }
  const mediaUrl = up.json.url;

  const pub = await apiJson(context, "/api/admin/content", {
    method: "POST",
    data: {
      title,
      kind: "audio",
      category: "audio",
      subcategory: "music",
      platform: "house",
      externalUrl: mediaUrl,
      src: mediaUrl,
      duration: "0:02",
      blurb: "blob probe",
      paywalled: false,
      tags: ["probe", "blob"],
    },
  });
  if (!ok("publish-audio", pub.status === 201 && Boolean(pub.json?.item?.id), pub.text.slice(0, 160))) {
    throw new Error("publish failed");
  }

  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForURL((u) => !u.pathname.includes("/access"), { timeout: 30000 });
  ok("home", true, page.url());

  const ageEnter = page.locator(".agegate button", { hasText: /^enter$/i });
  if (await ageEnter.count()) {
    await ageEnter.click();
    await page.waitForSelector(".agegate", { state: "detached", timeout: 10000 }).catch(() => {});
  }
  await page.evaluate(() => document.querySelector("button.boot__skip")?.click());
  await page.waitForFunction(() => !document.querySelector(".boot"), null, { timeout: 15000 }).catch(() => {});

  // Open stream / browse and click the seeded title
  await page.locator('button[aria-label="stream"], button[aria-label="browse"]').first().click().catch(() => {});
  await page.waitForTimeout(500);
  const titleLoc = page.getByText(title, { exact: false }).first();
  await titleLoc.waitFor({ timeout: 20000 });
  const card = titleLoc.locator(
    "xpath=ancestor::*[self::article or self::li or contains(@class,'featured') or contains(@class,'card') or contains(@class,'tile')][1]",
  );
  if (await card.count()) {
    const btn = card.locator("button").first();
    if (await btn.count()) await btn.click();
    else await titleLoc.click();
  } else {
    await titleLoc.click();
  }
  ok("selected-track", true, title);

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
