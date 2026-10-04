import type { Metadata } from "next";
import { FootprintShell } from "@/components/FootprintShell";
import { buildFootprint } from "@/lib/feed";
import { SITE } from "@/data/identity";

export const metadata: Metadata = {
  title: "Watch Footprint",
  description: `Full archive of posts and media signals for ${SITE.title}.`,
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default async function FootprintPage() {
  const footprint = await buildFootprint();
  return <FootprintShell footprint={footprint} />;
}
