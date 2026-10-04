import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Cloudflare dashboard uses `npm run build` → opennextjs-cloudflare build.
// OpenNext defaults to invoking `npm run build` again for Next, which would
// recurse forever. Pin the inner Next build explicitly.
const cloudflare = defineCloudflareConfig();

export default {
  ...cloudflare,
  buildCommand: "npx next build",
};
