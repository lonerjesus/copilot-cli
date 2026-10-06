import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { getSessionUser } from "@/lib/auth/session";
import { AuthStoreUnavailableError } from "@/lib/auth/store";
import { jsonError } from "@/lib/commerce/checkout";
import {
  createUpload,
  deleteUpload,
  findUpload,
  listUploads,
  validateCreateInput,
} from "@/lib/content-store";
import { deleteMediaForCatalogUrls } from "@/lib/media-store";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("auth_required", 401);
  if (!isAdminEmail(user.email)) return jsonError("forbidden", 403);
  try {
    const items = await listUploads();
    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof AuthStoreUnavailableError) {
      return jsonError("auth_store_unavailable", 503);
    }
    throw err;
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("auth_required", 401);
  if (!isAdminEmail(user.email)) return jsonError("forbidden", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_json", 400);
  }

  try {
    const input = validateCreateInput(body);
    const item = await createUpload(input, user.email);
    return NextResponse.json(
      { item },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof AuthStoreUnavailableError) {
      return jsonError("auth_store_unavailable", 503);
    }
    const message = err instanceof Error ? err.message : "invalid_body";
    return jsonError(message, 400);
  }
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("auth_required", 401);
  if (!isAdminEmail(user.email)) return jsonError("forbidden", 403);

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) return jsonError("missing_id", 400);

  try {
    const existing = await findUpload(id);
    const ok = await deleteUpload(id);
    if (!ok) return jsonError("not_found", 404);
    if (existing) {
      await deleteMediaForCatalogUrls([existing.src, existing.poster, existing.externalUrl]);
    }
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof AuthStoreUnavailableError) {
      return jsonError("auth_store_unavailable", 503);
    }
    throw err;
  }
}
