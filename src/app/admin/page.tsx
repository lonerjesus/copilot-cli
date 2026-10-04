import type { Metadata } from "next";
import { AdminShell } from "@/components/AdminShell";
import { SITE } from "@/data/identity";

export const metadata: Metadata = {
  title: "Admin Station",
  description: `Owner-only content desk for ${SITE.title}.`,
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

export default function AdminPage() {
  return <AdminShell />;
}
