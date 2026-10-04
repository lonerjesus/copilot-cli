import type { Metadata } from "next";
import { AccessGate } from "@/components/AccessGate";
import { SITE } from "@/data/identity";

export const metadata: Metadata = {
  title: "Access",
  description: `Account required to enter ${SITE.domain}. 18+ only.`,
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

export default function AccessPage() {
  return <AccessGate />;
}
