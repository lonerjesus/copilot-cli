import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/commerce/checkout";
import {
  ATLAS,
  HOUSE_BRANDS,
  HOUSE_OUTLETS,
  HOUSE_PROJECTS,
} from "@/data/connections";
import { buildArchiveBridge } from "@/lib/archive-bridge";

export const dynamic = "force-dynamic";

/** Authed members — house atlas payload (outlets, projects, archive bridges). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("auth_required", 401);

  try {
    const archive = await buildArchiveBridge();
    return NextResponse.json(
      {
        atlas: ATLAS,
        outlets: HOUSE_OUTLETS,
        projects: HOUSE_PROJECTS,
        brands: HOUSE_BRANDS.map((b) => ({
          name: b.name,
          short: b.short,
          kind: b.kind,
          note: b.note,
        })),
        archive,
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60",
          "X-Robots-Tag": "noindex, nofollow",
        },
      },
    );
  } catch {
    return jsonError("connections_unavailable", 503);
  }
}
