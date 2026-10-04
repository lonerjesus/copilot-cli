import { AppShell } from "@/components/AppShell";
import { buildFootprint } from "@/lib/feed";

export default async function Home() {
  const footprint = await buildFootprint();
  return <AppShell footprint={footprint} />;
}
