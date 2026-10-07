import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/commerce/checkout";
import {
  buildMediaUrl,
  MediaStoreUnavailableError,
  newHouseObjectKey,
  putHouseMedia,
  validateUploadFile,
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

  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("missing_file", 400);

  const roleRaw = String(form.get("role") ?? "media").trim();
  const role = roleRaw === "poster" ? "poster" : "media";

  try {
    const key = newHouseObjectKey(file.name || "upload.bin");
    const data = await file.arrayBuffer();
    // Sniff bytes — mobile Safari often sends empty/`image/jpg` MIME for photos.
    const { contentType } = validateUploadFile(file, role, data);
    await putHouseMedia(key, data, contentType);
    const url = buildMediaUrl(key);
    return NextResponse.json(
      { ok: true, key, url, contentType, bytes: data.byteLength },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof MediaStoreUnavailableError) {
      return jsonError("media_store_unavailable", 503);
    }
    const message = err instanceof Error ? err.message : "upload_failed";
    const status =
      message === "file_too_large"
        ? 413
        : message === "invalid_type" ||
            message === "empty_file" ||
            message === "heic_unsupported"
          ? 400
          : 400;
    return jsonError(message, status);
  }
}
