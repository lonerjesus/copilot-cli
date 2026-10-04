import { NextResponse } from "next/server";
import { buildFootprint } from "@/lib/feed";

export const revalidate = 60;

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
