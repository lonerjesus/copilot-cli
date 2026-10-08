import type { Metadata } from "next";
import { AccessGate } from "@/components/AccessGate";
import { PRIMARY_NAME, SITE } from "@/data/identity";

export const metadata: Metadata = {
  title: "Enter the stream",
  description: SITE.shareDescription,
  alternates: { canonical: `${SITE.url}/access` },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  openGraph: {
    title: `${SITE.title} — enter`,
    description: SITE.shareDescription,
    url: `${SITE.url}/access`,
    siteName: SITE.title,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: `${SITE.url}/og.png`,
        width: 1200,
        height: 630,
        alt: `${SITE.title} — ${SITE.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.title} — enter`,
    description: SITE.shareDescription,
    images: [`${SITE.url}/og.png`],
  },
};

function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.title,
        description: SITE.shareDescription,
        inLanguage: "en-US",
        potentialAction: {
          "@type": "RegisterAction",
          target: `${SITE.url}/access?mode=register`,
          name: "Create account",
        },
      },
      {
        "@type": "Person",
        "@id": `${SITE.url}/#person`,
        name: PRIMARY_NAME,
        alternateName: ["Kamau Negasi", "Streetpolitik", "357Itsumi"],
        url: SITE.url,
        sameAs: [
          "https://tellingshowoflove.substack.com",
          "https://www.youtube.com/@KamauNegasi",
          "https://www.twitch.tv/kamaunegasi",
          "https://357itsumi.bandcamp.com",
        ],
      },
    ],
  };
}

export default function AccessPage() {
  const ld = jsonLd();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <AccessGate />
    </>
  );
}
