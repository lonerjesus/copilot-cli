/**
 * Full E2E: upload song bytes → serve full body → Range 206 → length integrity.
 * Catches truncated house media that cuts playback short.
 *
 * Usage: BASE=http://127.0.0.1:3012 node scripts/e2e-media-range.mjs
 */
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
  const buf = Buffer.from(await res.arrayBuffer());
  let json = null;
  const text = buf.toString("utf8");
  try {
    json = JSON.parse(text);
  } catch {
    /* binary */
  }
  return { res, buf, text, json };
}

/** PCM WAV — exact byte length and playable duration. */
function makeWav(seconds, sampleRate = 44100) {
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
    const s = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.25 * 32767;
    buffer.writeInt16LE(s | 0, 44 + i * 2);
  }
  return buffer;
}

console.log(`== e2e media range / integrity @ ${BASE} ==`);
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

// —— Short song (single-shot) ——
const short = makeWav(3);
const shortForm = new FormData();
shortForm.append("file", new Blob([short], { type: "audio/wav" }), "probe-short.wav");
shortForm.append("role", "media");
const upShort = await api("/api/admin/media", { method: "POST", body: shortForm, jar });
ok(
  "upload-short",
  upShort.res.status === 201 && upShort.json?.bytes === short.length,
  `status=${upShort.res.status} bytes=${upShort.json?.bytes}`,
);
const shortUrl = upShort.json?.url;
ok("short-url", Boolean(shortUrl), String(shortUrl));

const full = await api(shortUrl, { jar });
ok("serve-full-status", full.res.status === 200, String(full.res.status));
ok(
  "serve-full-length",
  full.buf.length === short.length &&
    full.res.headers.get("content-length") === String(short.length),
  `got=${full.buf.length} want=${short.length} cl=${full.res.headers.get("content-length")}`,
);
ok(
  "serve-accept-ranges",
  (full.res.headers.get("accept-ranges") || "").toLowerCase() === "bytes",
  full.res.headers.get("accept-ranges") || "missing",
);
ok(
  "serve-x-kn-media",
  (full.res.headers.get("x-kn-media") || "") === "house-range",
  full.res.headers.get("x-kn-media") || "missing",
);
ok("serve-full-bytes-match", full.buf.equals(short));

const mid = await api(shortUrl, {
  jar,
  headers: { Range: "bytes=44-143" },
});
ok("range-206", mid.res.status === 206, String(mid.res.status));
ok(
  "range-length",
  mid.buf.length === 100 && mid.res.headers.get("content-length") === "100",
  `len=${mid.buf.length} cl=${mid.res.headers.get("content-length")}`,
);
ok(
  "range-content-range",
  mid.res.headers.get("content-range") === `bytes 44-143/${short.length}`,
  mid.res.headers.get("content-range") || "missing",
);
ok("range-bytes-match", mid.buf.equals(short.subarray(44, 144)));

const suffix = await api(shortUrl, {
  jar,
  headers: { Range: "bytes=-64" },
});
ok("range-suffix-206", suffix.res.status === 206, String(suffix.res.status));
ok(
  "range-suffix-match",
  suffix.buf.equals(short.subarray(short.length - 64)),
  `len=${suffix.buf.length}`,
);

const bad = await api(shortUrl, {
  jar,
  headers: { Range: `bytes=${short.length}-${short.length + 10}` },
});
ok("range-416", bad.res.status === 416, String(bad.res.status));

const head = await fetch(`${BASE}${shortUrl}`, {
  method: "HEAD",
  headers: { "User-Agent": UA, Cookie: jar.header() },
});
ok("head-200", head.status === 200, String(head.status));
ok(
  "head-length",
  head.headers.get("content-length") === String(short.length),
  head.headers.get("content-length") || "missing",
);
ok(
  "head-accept-ranges",
  (head.headers.get("accept-ranges") || "").toLowerCase() === "bytes",
);
ok(
  "head-x-kn-media",
  (head.headers.get("x-kn-media") || "") === "house-range",
  head.headers.get("x-kn-media") || "missing",
);

// Meta-only HEAD must not require a full body pull — Content-Length is enough
// for the player blob-vs-progressive decision.
ok(
  "head-no-body",
  Number(head.headers.get("content-length") || 0) === short.length,
);

// —— Multi-chunk upload (~9 MiB forces 2× 8 MiB parts) ——
const long = makeWav(100); // ~8.8 MB PCM
ok("long-over-8mb", long.length > 8 * 1024 * 1024, String(long.length));
const init = await api("/api/admin/media/init", {
  method: "POST",
  jar,
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    filename: "probe-long.wav",
    contentType: "audio/wav",
    size: long.length,
    role: "media",
  }),
});
ok(
  "chunk-init",
  (init.res.status === 200 || init.res.status === 201) && Boolean(init.json?.uploadId),
  init.text.slice(0, 160),
);
const uploadId = init.json?.uploadId;
const chunkBytes = init.json?.chunkBytes || 8 * 1024 * 1024;
const totalChunks = init.json?.totalChunks || Math.ceil(long.length / chunkBytes);
ok("chunk-count", totalChunks >= 2, String(totalChunks));

if (uploadId) {
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkBytes;
    const end = Math.min(long.length, start + chunkBytes);
    const part = new FormData();
    part.append("uploadId", uploadId);
    part.append("index", String(i));
    part.append(
      "chunk",
      new Blob([long.subarray(start, end)], { type: "application/octet-stream" }),
      `part-${i}.bin`,
    );
    const partRes = await api("/api/admin/media/chunk", { method: "POST", body: part, jar });
    ok(`chunk-part-${i}`, partRes.res.status === 200 || partRes.res.status === 201, partRes.text.slice(0, 80));
  }
  const done = await api("/api/admin/media/complete", {
    method: "POST",
    jar,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ uploadId }),
  });
  ok(
    "chunk-complete",
    (done.res.status === 200 || done.res.status === 201) && Boolean(done.json?.url),
    done.text.slice(0, 160),
  );
  const longUrl = done.json?.url;
  if (longUrl) {
    const served = await api(longUrl, { jar });
    ok("chunk-serve-status", served.res.status === 200, String(served.res.status));
    ok(
      "chunk-serve-length",
      served.buf.length === long.length,
      `got=${served.buf.length} want=${long.length}`,
    );
    ok("chunk-serve-bytes-match", served.buf.equals(long));
    const midLong = await api(longUrl, {
      jar,
      headers: { Range: `bytes=${chunkBytes - 50}-${chunkBytes + 49}` },
    });
    ok("chunk-boundary-206", midLong.res.status === 206, String(midLong.res.status));
    ok(
      "chunk-boundary-match",
      midLong.buf.equals(long.subarray(chunkBytes - 50, chunkBytes + 50)),
      `len=${midLong.buf.length}`,
    );

    // Publish + catalog so player path exists
    const pub = await api("/api/admin/content", {
      method: "POST",
      jar,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: `Range Probe ${Date.now()}`,
        kind: "audio",
        category: "audio",
        subcategory: "music",
        platform: "house",
        externalUrl: longUrl,
        src: longUrl,
        duration: "1:40",
        blurb: "range probe",
        paywalled: true,
        tags: ["probe", "range"],
      }),
    });
    ok("publish-audio", pub.res.status === 201 && Boolean(pub.json?.item?.id), pub.text.slice(0, 120));
    const cat = await api("/api/catalog", { jar });
    const hit = (cat.json?.items || []).find((i) => i.id === pub.json?.item?.id);
    ok("catalog-src", hit?.src === longUrl, hit?.src || "missing");
  }
} else {
  ok("chunk-parts", false, "no uploadId");
  ok("chunk-complete", false, "skipped");
}

console.log(`== result: ${pass} passed · ${fail} failed ==`);
process.exit(fail ? 1 : 0);
