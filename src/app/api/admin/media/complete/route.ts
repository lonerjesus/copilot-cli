import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/commerce/checkout";
import {
  completeChunkedUpload,
  MediaStoreUnavailableError,
} from "@/lib/media-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("auth_required", 401);
  if (!isAdminEmail(user.email)) return jsonError("forbidden", 403);

  let body: { uploadId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", 400);
  }
  const uploadId = String(body.uploadId ?? "").trim();
  if (!uploadId) return jsonError("missing_upload_id", 400);

  try {
    const result = await completeChunkedUpload(uploadId);
    // 202 while durable promote batches remaining (large AV on KV).
    const status = result.pending ? 202 : 201;
    return NextResponse.json(
      { ok: true, ...result },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof MediaStoreUnavailableError) {
      return jsonError("media_store_unavailable", 503);
    }
    const message = err instanceof Error ? err.message : "upload_failed";
    return jsonError(message, 400);
  }
}
