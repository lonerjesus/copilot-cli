import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/data/identity";

export const metadata: Metadata = {
  title: "Privacy",
  description: `Privacy policy for ${SITE.domain}. How we handle accounts, birth dates, and cosmogram data.`,
  robots: { index: false, follow: false },
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
              Birth date — used only to confirm you are 18+ and to power your personal{" "}
              <strong>cosmogram</strong> (a private chart for your account). It is not shown as a
              legal name on the site.
            </li>
            <li>Purchase and ownership records for house uploads you buy.</li>
          </ul>
        </section>

        <section className="legal__section">
          <h2>Cosmogram &amp; DOB</h2>
          <p>
            Your date of birth stays on your account profile for the cosmogram. We do not publish
            birth-certificate names or DOB on public surfaces. Cosmogram output is personal to the
            signed-in member.
          </p>
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
            Auth and commerce records live in the site&apos;s Cloudflare KV store for as long as the
            account remains. To correct or delete account data, contact the house operator through
            the channels listed on {SITE.domain} after you sign in.
          </p>
        </section>

        <p className="legal__back">
          <Link href="/access">← Back to access</Link>
        </p>
      </article>
    </main>
  );
}
