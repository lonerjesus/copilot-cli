#!/usr/bin/env node
/**
 * Pre-deploy: publish → edit → upload thumbnail → confirm PATCH persisted
 * without needing a second "save changes" click.
 */
const BASE = process.env.BASE || "http://127.0.0.1:3010";
const ADMIN = process.env.ADMIN_EMAIL || "av.owner@kamaunegasi.net";
const PASS = process.env.ADMIN_PASS || "qa-test-pass-12345";
const UA =
  "Mozilla/5.0 (compatible; KN-QA/1.0; +https://www.kamaunegasi.net)";

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

function tinyPng() {
  // 1x1 PNG
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5W7tQAAAAASUVORK5CYII=",
    "base64",
  );
}

function tinyMp3() {
  const u = new Uint8Array(256);
  u[0] = 0x49;
  u[1] = 0x44;
  u[2] = 0x33;
  u[128] = 0xff;
  u[129] = 0xfb;
  return Buffer.from(u);
}

console.log(`== e2e admin edit/save @ ${BASE} ==`);
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

// Upload media + poster binaries
async function uploadBin(buf, name, type, role) {
  const form = new FormData();
  form.append("file", new Blob([buf], { type }), name);
  form.append("role", role);
  return api("/api/admin/media", { method: "POST", body: form, jar });
}

const mediaUp = await uploadBin(tinyMp3(), "note-bed.mp3", "audio/mpeg", "media");
ok("upload-media", mediaUp.res.status === 201 && Boolean(mediaUp.json?.url), mediaUp.text.slice(0, 120));
const mediaUrl = mediaUp.json?.url;

const pub = await api("/api/admin/content", {
  method: "POST",
  jar,
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    title: `Edit Save Probe ${Date.now()}`,
    kind: "writing",
    category: "writing",
    subcategory: "notes",
    platform: "house",
    externalUrl: "https://www.kamaunegasi.net/",
    src: mediaUrl,
    blurb: "probe",
    body: "original body",
    paywalled: true,
    tags: ["probe"],
  }),
});
ok("publish", pub.res.status === 201 && Boolean(pub.json?.item?.id), pub.text.slice(0, 160));
const id = pub.json?.item?.id;

const posterUp = await uploadBin(tinyPng(), "cover.png", "image/png", "poster");
ok("upload-poster", posterUp.res.status === 201 && Boolean(posterUp.json?.url), posterUp.text.slice(0, 120));
const posterUrl = posterUp.json?.url;

// Simulate what AdminStation does after thumb upload while editing: immediate PATCH
const patched = await api("/api/admin/content", {
  method: "PATCH",
  jar,
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    id,
    title: pub.json.item.title,
    kind: "writing",
    category: "writing",
    subcategory: "notes",
    platform: "house",
    externalUrl: "https://www.kamaunegasi.net/",
    src: mediaUrl,
    poster: posterUrl,
    blurb: "probe",
    body: "updated body after thumb",
    paywalled: true,
    tags: ["probe", "edited"],
  }),
});
ok("patch-save", patched.res.status === 200 && patched.json?.item?.poster === posterUrl, patched.text.slice(0, 200));
ok(
  "patch-body",
  patched.json?.item?.body === "updated body after thumb",
  String(patched.json?.item?.body),
);

const listed = await api("/api/admin/content", { jar });
const hit = (listed.json?.items || []).find((i) => i.id === id);
ok("list-has-poster", Boolean(hit?.poster === posterUrl), hit?.poster || "missing");
ok("list-has-body", hit?.body === "updated body after thumb", hit?.body || "missing");

// catalog surface should see the upload
const catalog = await api("/api/catalog", { jar });
const catHit = (catalog.json?.items || []).find((i) => i.id === id);
ok("catalog-has-poster", catHit?.poster === posterUrl, catHit?.poster || "missing");

// House-path media refs (same shape AdminStation normalizeMediaRef emits) must PATCH.
const houseKey = String(mediaUrl).replace(/^.*\/api\/media\//, "");
const bareName = String(mediaUrl).split("/").pop();
const housePatch = await api("/api/admin/content", {
  method: "PATCH",
  jar,
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    id,
    title: pub.json.item.title,
    kind: "writing",
    category: "writing",
    subcategory: "notes",
    platform: "house",
    externalUrl: `/api/media/${houseKey}`,
    src: `/api/media/${houseKey}`,
    poster: posterUrl,
    blurb: "probe",
    body: "house path body",
    paywalled: true,
    tags: ["probe"],
  }),
});
ok(
  "patch-house-path",
  housePatch.res.status === 200 &&
    String(housePatch.json?.item?.src || "").includes("/api/media/house/"),
  housePatch.text.slice(0, 200),
);

// Clear poster (empty string) must stick — no still→src restore on writing.
const cleared = await api("/api/admin/content", {
  method: "PATCH",
  jar,
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    id,
    title: pub.json.item.title,
    kind: "writing",
    category: "writing",
    subcategory: "notes",
    platform: "house",
    externalUrl: "https://www.kamaunegasi.net/",
    src: mediaUrl,
    poster: "",
    blurb: "probe",
    body: "cleared poster",
    paywalled: true,
    tags: ["probe"],
  }),
});
ok(
  "patch-clear-poster",
  cleared.res.status === 200 && !cleared.json?.item?.poster,
  String(cleared.json?.item?.poster ?? "cleared"),
);

// Chunked upload round-trip (init → one part → complete) for small MP3.
const mp3 = tinyMp3();
const init = await api("/api/admin/media/init", {
  method: "POST",
  jar,
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    filename: "chunk-probe.mp3",
    contentType: "audio/mpeg",
    size: mp3.length,
    role: "media",
  }),
});
ok(
  "chunk-init",
  (init.res.status === 200 || init.res.status === 201) && Boolean(init.json?.uploadId),
  init.text.slice(0, 160),
);
if (init.json?.uploadId) {
  const part = new FormData();
  part.append("uploadId", init.json.uploadId);
  part.append("index", "0");
  part.append("chunk", new Blob([mp3], { type: "application/octet-stream" }), "part-0.bin");
  const partRes = await api("/api/admin/media/chunk", {
    method: "POST",
    jar,
    body: part,
  });
  ok("chunk-part", partRes.res.status === 200 || partRes.res.status === 201, partRes.text.slice(0, 120));
  const done = await api("/api/admin/media/complete", {
    method: "POST",
    jar,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ uploadId: init.json.uploadId }),
  });
  ok(
    "chunk-complete",
    (done.res.status === 200 || done.res.status === 201) && Boolean(done.json?.url),
    done.text.slice(0, 160),
  );
} else {
  ok("chunk-part", false, "skipped");
  ok("chunk-complete", false, "skipped");
}

ok("bare-name-hint", Boolean(bareName && /\.mp3$/i.test(bareName)), bareName || "missing");

console.log(`== result: ${pass} passed · ${fail} failed ==`);
process.exit(fail ? 1 : 0);
