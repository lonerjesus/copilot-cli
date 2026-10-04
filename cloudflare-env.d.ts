// Augment OpenNext / wrangler CloudflareEnv with house bindings.
declare global {
  interface CloudflareEnv {
    /** Durable auth/commerce JSON store (required in Workers production). */
    AUTH_KV?: KVNamespace;
  }
}

export {};
