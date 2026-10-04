import { NextResponse } from "next/server";
import { buildFootprint } from "@/lib/feed";

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
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
