import type { Metadata } from "next";
import { Chakra_Petch, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SITE } from "@/data/identity";

const display = Chakra_Petch({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
  preload: true,
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.title} · ${SITE.domain}`,
    template: `%s · ${SITE.title}`,
  },
  description: SITE.description,
  applicationName: SITE.title,
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  authors: [{ name: "Kendrick-Kamau Negasi" }],
  keywords: [
    "Kendrick-Kamau Negasi",
    "Streetpolitik",
    "Telling Show Of Love",
    "GrownAssKids",
    "BLKDTY",
    "357Itsumi",
    "portfolio",
    "vlog",
  ],
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
  openGraph: {
    title: SITE.title,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.title,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  alternates: {
    canonical: SITE.url,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const ageGate = process.env.AGE_GATE_REQUIRED !== "0" ? "1" : "0";
  return (
    <html
      lang="en"
      className={`${display.variable} ${mono.variable} h-full`}
      data-age-gate={ageGate}
    >
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
