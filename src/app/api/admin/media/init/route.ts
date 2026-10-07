import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/commerce/checkout";
import {
  initChunkedUpload,
  MediaStoreUnavailableError,
  validateUploadFile,
} from "@/lib/media-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("auth_required", 401);
  if (!isAdminEmail(user.email)) return jsonError("forbidden", 403);

  let body: {
    filename?: string;
    contentType?: string;
    size?: number;
    role?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", 400);
  }

  const role = body.role === "poster" ? "poster" : "media";
  const size = Number(body.size ?? 0);
  const contentType = String(body.contentType ?? "").trim();
  const filename = String(body.filename ?? "upload.bin").trim() || "upload.bin";

  try {
    validateUploadFile({ type: contentType, size }, role);
    const session = await initChunkedUpload({
      filename,
      contentType,
      size,
      role,
    });
    return NextResponse.json(
      { ok: true, ...session },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof MediaStoreUnavailableError) {
      return jsonError("media_store_unavailable", 503);
    }
    const message = err instanceof Error ? err.message : "upload_failed";
    return jsonError(message, message === "file_too_large" ? 413 : 400);
  }
}
