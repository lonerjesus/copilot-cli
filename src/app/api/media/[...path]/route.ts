import { type NextRequest } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import { jsonError } from "@/lib/commerce/checkout";
import {
  getHouseMedia,
  getHouseMediaMeta,
  MediaStoreUnavailableError,
} from "@/lib/media-store";

export const dynamic = "force-dynamic";

function contentTypeFromKey(key: string, fallback: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith(".mp4") || lower.endsWith(".m4v") || lower.endsWith(".3gp") || lower.endsWith(".3g2")) {
    return "video/mp4";
  }
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov") || lower.endsWith(".qt")) return "video/quicktime";
  if (lower.endsWith(".ogv")) return "video/ogg";
  if (lower.endsWith(".mp3") || lower.endsWith(".mpga")) return "audio/mpeg";
  if (lower.endsWith(".m4a") || lower.endsWith(".aac")) return "audio/mp4";
  if (lower.endsWith(".wav") || lower.endsWith(".wave")) return "audio/wav";
  if (lower.endsWith(".flac")) return "audio/flac";
  if (lower.endsWith(".ogg") || lower.endsWith(".oga") || lower.endsWith(".opus")) {
    return "audio/ogg";
  }
  if (lower.endsWith(".weba")) return "audio/webm";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return fallback;
}

function toUint8Array(body: ReadableStream | ArrayBuffer | Uint8Array): Uint8Array | null {
  if (body instanceof Uint8Array) return body;
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  return null;
}

function parseRange(
  header: string | null,
  size: number,
): { start: number; end: number } | "unsatisfiable" | null {
  if (!header || size <= 0) return null;
  // Support single range only (browsers); ignore multi-range for now.
  const first = header.trim().split(",")[0]?.trim() ?? "";
  const m = /^bytes=(\d*)-(\d*)$/i.exec(first);
  if (!m) return null;
  const startRaw = m[1] ?? "";
  const endRaw = m[2] ?? "";
  let start: number;
  let end: number;
  if (startRaw === "" && endRaw === "") return null;
  if (startRaw === "") {
    const suffix = Number(endRaw);
    if (!Number.isFinite(suffix) || suffix <= 0) return "unsatisfiable";
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(startRaw);
    end = endRaw === "" ? size - 1 : Number(endRaw);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0) {
      return "unsatisfiable";
    }
    if (start >= size) return "unsatisfiable";
    end = Math.min(end, size - 1);
    if (end < start) return "unsatisfiable";
  }
  return { start, end };
}

function mediaHeaders(contentType: string, extra?: Record<string, string>): Record<string, string> {
  return {
    "Content-Type": contentType,
    // Session media — never CDN-cache a private body, but allow the browser to keep
    // the decoded buffer for the life of the tab (helps seek without re-auth races).
    "Cache-Control": "private, max-age=0, must-revalidate",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
    // Hint clients that this endpoint is Range-capable progressive AV.
    "X-KN-Media": "house-range",
    ...extra,
  };
}

async function serveMedia(request: NextRequest, key: string): Promise<Response> {
  // Meta-only size probe — never load the full object just to answer Range.
  const meta = await getHouseMediaMeta(key);
  if (!meta) return jsonError("not_found", 404);

  const contentType = contentTypeFromKey(key, meta.contentType);
  const size = meta.size;
  const common = mediaHeaders(contentType);
  const range = parseRange(request.headers.get("range"), size);

  if (range === "unsatisfiable") {
    return new Response(null, {
      status: 416,
      headers: {
        ...common,
        "Content-Range": `bytes */${size}`,
      },
    });
  }

  if (range) {
    const { start, end } = range;
    const length = end - start + 1;
    const hit = await getHouseMedia(key, { range: { offset: start, length } });
    if (!hit) return jsonError("not_found", 404);
    const bytes = toUint8Array(hit.body);
    if (bytes) {
      // Exact length guard — never claim a longer Content-Range than delivered.
      if (bytes.byteLength !== length) {
        return jsonError("media_range_incomplete", 503);
      }
      const copy = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
      return new Response(copy, {
        status: 206,
        headers: {
          ...common,
          "Content-Length": String(bytes.byteLength),
          "Content-Range": `bytes ${start}-${end}/${size}`,
        },
      });
    }
    if (hit.body instanceof ReadableStream) {
      return new Response(hit.body, {
        status: 206,
        headers: {
          ...common,
          "Content-Length": String(length),
          "Content-Range": `bytes ${start}-${end}/${size}`,
        },
      });
    }
  }

  // Full GET — load once; browsers that omit Range still get Accept-Ranges for follow-ups.
  const full = await getHouseMedia(key);
  if (!full) return jsonError("not_found", 404);
  const fullBytes = toUint8Array(full.body);
  if (fullBytes) {
    if (fullBytes.byteLength !== size) {
      return jsonError("media_integrity_mismatch", 503);
    }
    const copy = fullBytes.buffer.slice(
      fullBytes.byteOffset,
      fullBytes.byteOffset + fullBytes.byteLength,
    ) as ArrayBuffer;
    return new Response(copy, {
      status: 200,
      headers: {
        ...common,
        "Content-Length": String(fullBytes.byteLength),
      },
    });
  }
  if (full.body instanceof ReadableStream) {
    return new Response(full.body, {
      status: 200,
      headers: {
        ...common,
        "Content-Length": String(size),
      },
    });
  }

  return jsonError("media_unreadable", 503);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const user = await getSessionUserFromRequest(request);
  if (!user) return jsonError("auth_required", 401);

  const { path } = await context.params;
  const key = path.map((p) => decodeURIComponent(p)).join("/");
  if (!key.startsWith("house/") || key.includes("..")) {
    return jsonError("not_found", 404);
  }

  try {
    return await serveMedia(request, key);
  } catch (err) {
    if (err instanceof MediaStoreUnavailableError) {
      return jsonError("media_store_unavailable", 503);
    }
    throw err;
  }
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const user = await getSessionUserFromRequest(request);
  if (!user) return jsonError("auth_required", 401);

  const { path } = await context.params;
  const key = path.map((p) => decodeURIComponent(p)).join("/");
  if (!key.startsWith("house/") || key.includes("..")) {
    return jsonError("not_found", 404);
  }

  try {
    const meta = await getHouseMediaMeta(key);
    if (!meta) return jsonError("not_found", 404);
    const contentType = contentTypeFromKey(key, meta.contentType);
    return new Response(null, {
      status: 200,
      headers: mediaHeaders(contentType, {
        "Content-Length": String(meta.size),
      }),
    });
  } catch (err) {
    if (err instanceof MediaStoreUnavailableError) {
      return jsonError("media_store_unavailable", 503);
    }
    throw err;
  }
}
