/**
 * Client-side media metadata from uploaded files.
 * Uses browser media elements + lightweight ID3v2 title sniff — no native deps.
 */

export type UploadMeta = {
  title?: string;
  duration?: string;
  width?: number;
  height?: number;
  kind?: "audio" | "video" | "image";
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Format seconds as m:ss or h:mm:ss (catalog duration field). */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "";
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${pad2(m)}:${pad2(sec)}`;
  return `${m}:${pad2(sec)}`;
}

function decodeId3Text(bytes: Uint8Array): string {
  if (!bytes.length) return "";
  const enc = bytes[0];
  const data = bytes.subarray(1);
  try {
    if (enc === 0) {
      return new TextDecoder("latin1").decode(data).replace(/\0+$/g, "").trim();
    }
    if (enc === 3) {
      return new TextDecoder("utf-8").decode(data).replace(/\0+$/g, "").trim();
    }
    if (enc === 1 || enc === 2) {
      return new TextDecoder("utf-16").decode(data).replace(/\0+$/g, "").trim();
    }
  } catch {
    /* ignore */
  }
  return "";
}

/** Best-effort ID3v2 TIT2 / TPE1 from the start of an MP3. */
export function readId3Tags(buf: ArrayBuffer): { title?: string; artist?: string } {
  const u = new Uint8Array(buf);
  if (u.length < 10 || u[0] !== 0x49 || u[1] !== 0x44 || u[2] !== 0x33) return {};
  const major = u[3] ?? 0;
  if (major < 2 || major > 4) return {};
  const size =
    ((u[6]! & 0x7f) << 21) |
    ((u[7]! & 0x7f) << 14) |
    ((u[8]! & 0x7f) << 7) |
    (u[9]! & 0x7f);
  const end = Math.min(u.length, 10 + size);
  let i = 10;
  let title: string | undefined;
  let artist: string | undefined;
  while (i + 10 <= end) {
    const id = String.fromCharCode(u[i]!, u[i + 1]!, u[i + 2]!, u[i + 3]!);
    if (id === "\0\0\0\0") break;
    const frameSize =
      major === 4
        ? ((u[i + 4]! & 0x7f) << 21) |
          ((u[i + 5]! & 0x7f) << 14) |
          ((u[i + 6]! & 0x7f) << 7) |
          (u[i + 7]! & 0x7f)
        : (u[i + 4]! << 24) | (u[i + 5]! << 16) | (u[i + 6]! << 8) | u[i + 7]!;
    if (frameSize <= 0 || i + 10 + frameSize > end) break;
    const body = u.subarray(i + 10, i + 10 + frameSize);
    if (id === "TIT2" && !title) title = decodeId3Text(body) || undefined;
    if (id === "TPE1" && !artist) artist = decodeId3Text(body) || undefined;
    i += 10 + frameSize;
    if (title && artist) break;
  }
  return { title, artist };
}

function probeMediaElement(
  url: string,
  tag: "audio" | "video",
  timeoutMs = 8000,
): Promise<{ duration?: number; width?: number; height?: number }> {
  return new Promise((resolve) => {
    const el = document.createElement(tag);
    el.preload = "metadata";
    el.muted = true;
    if (tag === "video") (el as HTMLVideoElement).playsInline = true;
    let settled = false;
    const done = (value: { duration?: number; width?: number; height?: number }) => {
      if (settled) return;
      settled = true;
      el.removeAttribute("src");
      el.load();
      resolve(value);
    };
    const timer = window.setTimeout(() => done({}), timeoutMs);
    el.onloadedmetadata = () => {
      window.clearTimeout(timer);
      const duration =
        Number.isFinite(el.duration) && el.duration > 0 ? el.duration : undefined;
      if (tag === "video") {
        const v = el as HTMLVideoElement;
        done({
          duration,
          width: v.videoWidth || undefined,
          height: v.videoHeight || undefined,
        });
      } else {
        done({ duration });
      }
    };
    el.onerror = () => {
      window.clearTimeout(timer);
      done({});
    };
    el.src = url;
  });
}

function probeImage(
  url: string,
  timeoutMs = 8000,
): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const done = (value: { width?: number; height?: number }) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timer = window.setTimeout(() => done({}), timeoutMs);
    img.onload = () => {
      window.clearTimeout(timer);
      done({
        width: img.naturalWidth || undefined,
        height: img.naturalHeight || undefined,
      });
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      done({});
    };
    img.src = url;
  });
}

/**
 * Pull title / duration / dimensions from a local File before or after upload.
 * Never throws — returns whatever the browser can read.
 */
export async function extractUploadMeta(file: File): Promise<UploadMeta> {
  const type = (file.type || "").toLowerCase().split(";")[0]?.trim() ?? "";
  const name = (file.name || "").toLowerCase();
  const meta: UploadMeta = {};

  // Lightweight ID3 title/artist from the head of the file.
  if (type.includes("mpeg") || type.includes("mp3") || name.endsWith(".mp3")) {
    try {
      const head = await file.slice(0, Math.min(file.size, 256 * 1024)).arrayBuffer();
      const tags = readId3Tags(head);
      if (tags.title) meta.title = tags.title.slice(0, 160);
      if (tags.artist && !meta.title) meta.title = tags.artist.slice(0, 160);
      else if (tags.artist && meta.title && !meta.title.includes(tags.artist)) {
        // Prefer "Artist · Title" when both present and title is bare (house separator).
        meta.title = `${tags.artist} · ${meta.title}`.slice(0, 160);
      }
    } catch {
      /* ignore */
    }
  }

  if (typeof document === "undefined" || typeof URL === "undefined") {
    return meta;
  }

  const url = URL.createObjectURL(file);
  try {
    if (type.startsWith("audio/") || /\.(mp3|m4a|aac|wav|flac|ogg|oga|opus|weba)$/i.test(name)) {
      meta.kind = "audio";
      const probed = await probeMediaElement(url, "audio");
      if (probed.duration) meta.duration = formatDuration(probed.duration);
    } else if (
      type.startsWith("video/") ||
      /\.(mp4|m4v|mov|webm|ogv|3gp|3g2)$/i.test(name)
    ) {
      meta.kind = "video";
      const probed = await probeMediaElement(url, "video");
      if (probed.duration) meta.duration = formatDuration(probed.duration);
      if (probed.width) meta.width = probed.width;
      if (probed.height) meta.height = probed.height;
    } else if (
      type.startsWith("image/") ||
      /\.(jpe?g|png|webp|gif)$/i.test(name)
    ) {
      meta.kind = "image";
      const probed = await probeImage(url);
      if (probed.width) meta.width = probed.width;
      if (probed.height) meta.height = probed.height;
    }
  } finally {
    URL.revokeObjectURL(url);
  }

  return meta;
}
