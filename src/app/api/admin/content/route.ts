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
  updateUpload,
  validateCreateInput,
} from "@/lib/content-store";
import { deleteMediaForCatalogUrls } from "@/lib/media-store";
import { recordAnalyticsEvent } from "@/lib/analytics-store";

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
    void recordAnalyticsEvent({
      signal: "publish",
      userId: user.id,
      meta: { id: item.id, kind: item.kind },
    });
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

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("auth_required", 401);
  if (!isAdminEmail(user.email)) return jsonError("forbidden", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_json", 400);
  }
  if (!body || typeof body !== "object") return jsonError("invalid_body", 400);
  const o = body as Record<string, unknown>;
  const id = String(o.id ?? "").trim();
  if (!id) return jsonError("missing_id", 400);

  try {
    const existing = await findUpload(id);
    if (!existing) return jsonError("not_found", 404);

    const patch: Record<string, unknown> = { ...o };
    delete patch.id;
    // Allow partials — validateCreateInput needs full shape; merge happens in updateUpload.
    const item = await updateUpload(id, patch as Parameters<typeof updateUpload>[1]);
    if (!item) return jsonError("not_found", 404);
    void recordAnalyticsEvent({
      signal: "admin_edit",
      userId: user.id,
      meta: { id: item.id },
    });
    return NextResponse.json(
      { item },
      { headers: { "Cache-Control": "no-store" } },
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
