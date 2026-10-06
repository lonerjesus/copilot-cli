import Link from "next/link";
import { SITE } from "@/data/identity";

export function SiteFooter() {
  return (
    <footer className="footer footer--compact">
      <p>© {new Date().getFullYear()} {SITE.title}</p>
      <nav className="footer__legal" aria-label="Legal">
        <Link href="/privacy">Privacy</Link>
        <span aria-hidden>·</span>
        <Link href="/terms">Terms</Link>
      </nav>
    </footer>
  );
}
