import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/data/identity";

const TITLE = "Privacy";
const DESCRIPTION = `Privacy policy for ${SITE.domain} — what we collect, why, and how accounts work.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}/privacy` },
  robots: { index: true, follow: true },
  openGraph: {
    title: `${TITLE} · ${SITE.title}`,
    description: DESCRIPTION,
    url: `${SITE.url}/privacy`,
    siteName: SITE.title,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: `${SITE.url}/og.png`,
        width: 1200,
        height: 630,
        alt: `${SITE.title} — Privacy`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} · ${SITE.title}`,
    description: DESCRIPTION,
    images: [`${SITE.url}/og.png`],
  },
};

export default function PrivacyPage() {
  return (
    <main className="legal" id="top">
      <article className="legal__panel">
        <p className="legal__eyebrow">18+ · privacy</p>
        <h1 className="legal__title">Privacy</h1>
        <p className="legal__lede">
          How {SITE.title} handles account data on {SITE.domain}.
        </p>

        <section className="legal__section">
          <h2>What we collect</h2>
          <ul>
            <li>Email and password hash (for sign-in).</li>
            <li>Optional display name.</li>
            <li>
              Birth date — used only to confirm you are 18+. It is not shown on public surfaces.
            </li>
            <li>Purchase and ownership records for house uploads you buy.</li>
          </ul>
        </section>

        <section className="legal__section">
          <h2>Payments</h2>
          <p>
            Card payments for house downloads and donations run through Stripe. We do not store full
            card numbers on our Workers. Stripe&apos;s privacy policy applies to checkout data.
          </p>
        </section>

        <section className="legal__section">
          <h2>Retention &amp; contact</h2>
          <p>
            Auth and commerce records stay with the house for as long as the account remains. To
            correct or delete account data, contact Kamau:{" "}
            <span className="legal__placeholder">[contact pending]</span>.
          </p>
        </section>

        <p className="legal__back">
          <Link href="/access">← Back to access</Link>
        </p>
      </article>
    </main>
  );
}
