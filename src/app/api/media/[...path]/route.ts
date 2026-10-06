import { type NextRequest } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import { jsonError } from "@/lib/commerce/checkout";
import { getHouseMedia, MediaStoreUnavailableError } from "@/lib/media-store";

export const dynamic = "force-dynamic";

function contentTypeFromKey(key: string, fallback: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".ogg")) return "audio/ogg";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return fallback;
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
    const hit = await getHouseMedia(key);
    if (!hit) return jsonError("not_found", 404);

    const contentType = contentTypeFromKey(key, hit.contentType);
    let body: BodyInit;
    if (hit.body instanceof ReadableStream) {
      body = hit.body;
    } else if (hit.body instanceof Uint8Array) {
      body = hit.body.buffer.slice(
        hit.body.byteOffset,
        hit.body.byteOffset + hit.body.byteLength,
      ) as ArrayBuffer;
    } else {
      body = hit.body as ArrayBuffer;
    }

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        ...(hit.size != null ? { "Content-Length": String(hit.size) } : {}),
      },
    });
  } catch (err) {
    if (err instanceof MediaStoreUnavailableError) {
      return jsonError("media_store_unavailable", 503);
    }
    throw err;
  }
}
