import { NextResponse } from "next/server";
import { buildFootprint } from "@/lib/feed";

// Avoid SSG/network during Workers Builds — resolve on demand.
export const dynamic = "force-dynamic";

export async function GET() {
  const items = await buildFootprint();
  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      count: items.length,
      items,
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
