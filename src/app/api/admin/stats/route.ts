import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { getSessionUser } from "@/lib/auth/session";
import { AuthStoreUnavailableError, getAdminStats } from "@/lib/auth/store";
import { summarizeAnalytics } from "@/lib/analytics-store";
import { jsonError } from "@/lib/commerce/checkout";
import { listUploads } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("auth_required", 401);
  if (!isAdminEmail(user.email)) return jsonError("forbidden", 403);

  try {
    const [stats, engagement, uploads] = await Promise.all([
      getAdminStats(),
      summarizeAnalytics(30),
      listUploads(),
    ]);

    const byKind: Record<string, number> = {};
    for (const item of uploads) {
      byKind[item.kind] = (byKind[item.kind] ?? 0) + 1;
    }

    return NextResponse.json(
      {
        ...stats,
        uploads: {
          total: uploads.length,
          byKind,
          latest: uploads.slice(0, 8).map((u) => ({
            id: u.id,
            title: u.title,
            kind: u.kind,
            publishedAt: u.publishedAt,
            paywalled: u.paywalled !== false,
          })),
        },
        engagement,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof AuthStoreUnavailableError) {
      return jsonError("auth_store_unavailable", 503);
    }
    throw err;
  }
}
