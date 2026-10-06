import Link from "next/link";
import { PRIMARY_NAME } from "@/data/identity";

export function SiteFooter({ note }: { note?: string }) {
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} {PRIMARY_NAME}
        {note ? <span className="footer__note"> · {note}</span> : null}
      </p>
      <nav className="footer__legal" aria-label="Legal">
        <Link href="/privacy">Privacy</Link>
        <span aria-hidden>·</span>
        <Link href="/terms">Terms</Link>
      </nav>
    </footer>
  );
}
