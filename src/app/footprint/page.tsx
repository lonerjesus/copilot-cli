import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Fetched outside archive removed — house stream only. */
export default function FootprintPage() {
  redirect("/");
}
