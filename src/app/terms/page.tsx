import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/data/identity";

const TITLE = "Terms";
const DESCRIPTION = `Terms of use for ${SITE.domain}. Account gate, 18+, streaming, and house download rules.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}/terms` },
  robots: { index: true, follow: true },
  openGraph: {
    title: `${TITLE} · ${SITE.title}`,
    description: DESCRIPTION,
    url: `${SITE.url}/terms`,
    siteName: SITE.title,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: `${SITE.url}/og.png`,
        width: 1200,
        height: 630,
        alt: `${SITE.title} — Terms`,
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

export default function TermsPage() {
  return (
    <main className="legal" id="top">
      <article className="legal__panel">
        <p className="legal__eyebrow">18+ · terms</p>
        <h1 className="legal__title">Terms</h1>
        <p className="legal__lede">
          By creating an account or using {SITE.domain}, you agree to these terms.
        </p>

        <section className="legal__section">
          <h2>Eligibility</h2>
          <p>
            You must be 18 or older. Registration requires an age confirmation and a birth date.
          </p>
        </section>

        <section className="legal__section">
          <h2>Account</h2>
          <p>
            An account is required to enter the stream. Keep credentials private. Automated scraping
            and bulk harvesting are prohibited.
          </p>
        </section>

        <section className="legal__section">
          <h2>Media &amp; commerce</h2>
          <ul>
            <li>
              House uploads require a purchase (Stripe) before download. Ownership is per piece.
            </li>
            <li>Redistribution, resale, or public re-hosting of house files is prohibited.</li>
          </ul>
        </section>

        <section className="legal__section">
          <h2>Acceptable use</h2>
          <p>
            Do not attempt to bypass the account gate, paywall, bot controls, or rate limits. Do not
            upload malware or abuse APIs. We may suspend accounts that break these rules.
          </p>
        </section>

        <section className="legal__section">
          <h2>Changes</h2>
          <p>
            Terms may update as the house ships. Continued use after a change means you accept the
            updated terms.
          </p>
        </section>

        <p className="legal__back">
          <Link href="/access">← Back to access</Link>
          {" · "}
          <Link href="/privacy">Privacy</Link>
        </p>
      </article>
    </main>
  );
}
