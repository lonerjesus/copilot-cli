#!/usr/bin/env node
/**
 * Pre-deploy: register admin, POST real AV fixtures to /api/admin/media,
 * confirm Content-Type on GET /api/media/…
 */
import { writeFileSync, mkdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

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
      // fallback for older undici
      const single = res.headers.get("set-cookie");
      if (single && !raw.length) {
        for (const part of single.split(/,(?=[^;]+?=)/)) {
          const [pair] = part.split(";");
          const eq = pair.indexOf("=");
          if (eq > 0) jar.set(pair.trim().slice(0, eq), pair.trim().slice(eq + 1));
        }
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
    /* binary or html */
  }
  return { res, text, json };
}

function buildMp3() {
  const u = new Uint8Array(512);
  u[0] = 0x49;
  u[1] = 0x44;
  u[2] = 0x33;
  u[3] = 0x03;
  // pad + frame sync
  u[128] = 0xff;
  u[129] = 0xfb;
  return Buffer.from(u);
}

function buildWav() {
  const u = new Uint8Array(64);
  u.set([0x52, 0x49, 0x46, 0x46], 0);
  u[4] = 56;
  u.set([0x57, 0x41, 0x56, 0x45], 8);
  u.set([0x66, 0x6d, 0x74, 0x20], 12); // fmt
  return Buffer.from(u);
}

function buildFlac() {
  const u = new Uint8Array(32);
  u.set([0x66, 0x4c, 0x61, 0x43], 0);
  return Buffer.from(u);
}

function buildM4a() {
  const u = new Uint8Array(32);
  u[3] = 0x20; // size
  u.set([0x66, 0x74, 0x79, 0x70], 4);
  u.set([0x4d, 0x34, 0x41, 0x20], 8); // M4A
  return Buffer.from(u);
}

function buildMp4() {
  const u = new Uint8Array(32);
  u[3] = 0x20;
  u.set([0x66, 0x74, 0x79, 0x70], 4);
  u.set([0x69, 0x73, 0x6f, 0x6d], 8); // isom
  return Buffer.from(u);
}

async function upload(jar, buf, filename, declaredType) {
  const form = new FormData();
  form.append(
    "file",
    new Blob([buf], { type: declaredType }),
    filename,
  );
  form.append("role", "media");
  return api("/api/admin/media", { method: "POST", body: form, jar });
}

console.log(`== e2e AV upload @ ${BASE} ==`);
console.log(`admin ${ADMIN}`);

const jar = cookieJar();

// register / login
let { res, json } = await api("/api/auth/register", {
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
  ({ res, json } = await api("/api/auth/login", {
    method: "POST",
    jar,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: ADMIN, password: PASS, website: "" }),
  }));
}
ok("admin-session", Boolean(json?.user?.email || json?.email), JSON.stringify(json).slice(0, 120));

const me = await api("/api/auth/me", { jar });
ok("admin-flag", me.json?.user?.isAdmin === true, JSON.stringify(me.json));

const cases = [
  { name: "track.mp3", type: "audio/mpeg", buf: buildMp3(), expectCt: "audio/mpeg" },
  { name: "voice.m4a", type: "", buf: buildM4a(), expectCt: "audio/mp4" },
  { name: "hit.wav", type: "application/octet-stream", buf: buildWav(), expectCt: "audio/wav" },
  { name: "stem.flac", type: "", buf: buildFlac(), expectCt: "audio/flac" },
  { name: "clip.mp4", type: "video/mp4", buf: buildMp4(), expectCt: "video/mp4" },
];

for (const c of cases) {
  const up = await upload(jar, c.buf, c.name, c.type);
  const url = up.json?.url;
  const ct = up.json?.contentType;
  ok(
    `upload-${c.name}`,
    up.res.status === 201 && Boolean(url) && ct === c.expectCt,
    `status=${up.res.status} ct=${ct} body=${(up.text || "").slice(0, 160)}`,
  );
  if (!url) continue;
  const get = await api(url, { jar });
  const served = get.res.headers.get("content-type") || "";
  ok(
    `serve-${c.name}`,
    get.res.status === 200 && served.startsWith(c.expectCt),
    `status=${get.res.status} ct=${served}`,
  );
}

// reject pdf
{
  const form = new FormData();
  form.append("file", new Blob([Buffer.from("%PDF-1.4")], { type: "application/pdf" }), "x.pdf");
  form.append("role", "media");
  const bad = await api("/api/admin/media", { method: "POST", body: form, jar });
  ok("reject-pdf", bad.res.status === 400, `status=${bad.res.status}`);
}

// non-admin forbidden
const memberJar = cookieJar();
const memEmail = `member.${Date.now()}@example.com`;
await api("/api/auth/register", {
  method: "POST",
  jar: memberJar,
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    email: memEmail,
    password: PASS,
    displayName: "Member",
    birthDate: "1990-01-01",
    ageConfirmed: true,
    website: "",
  }),
});
const denied = await upload(memberJar, buildMp3(), "nope.mp3", "audio/mpeg");
ok("member-forbidden", denied.res.status === 403, `status=${denied.res.status}`);

console.log(`== result: ${pass} passed · ${fail} failed ==`);
process.exit(fail ? 1 : 0);
