import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/commerce/checkout";
import {
  MediaStoreUnavailableError,
  putChunkedUploadPart,
} from "@/lib/media-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("auth_required", 401);
  if (!isAdminEmail(user.email)) return jsonError("forbidden", 403);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("invalid_form", 400);
  }

  const uploadId = String(form.get("uploadId") ?? "").trim();
  const index = Number(form.get("index") ?? -1);
  const file = form.get("chunk");
  if (!uploadId || !(file instanceof File) || !Number.isInteger(index) || index < 0) {
    return jsonError("invalid_chunk", 400);
  }

  try {
    const data = await file.arrayBuffer();
    const progress = await putChunkedUploadPart(uploadId, index, data);
    return NextResponse.json(
      { ok: true, ...progress },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof MediaStoreUnavailableError) {
      return jsonError("media_store_unavailable", 503);
    }
    const message = err instanceof Error ? err.message : "upload_failed";
    return jsonError(message, 400);
  }
}
