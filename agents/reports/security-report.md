# security

- Media refs still reject `..` / `\` before house-path accept.
- Server `validateCreateInput` normalizes then asserts `/api/media/house/` or `https:`.
- No new deps, no XSS sinks, credentials unchanged.
PASS
