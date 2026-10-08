# Expert-tier harden — admin saves + screen adapt

## Scope
Post-#33 polish: durable saves during long uploads, keyboard-aware sticky Save, server-side media-ref normalization, narrow/landscape admin layout.

## Changes
- `formRef` / `editingIdRef` — upload/PATCH merges latest title/tags typed mid-upload
- `patchForm` functional updates + dirty `beforeunload` guard
- `visualViewport` → `--admin-keyboard-inset` so sticky Save clears iOS keyboard
- `src/lib/media-ref.ts` + content-store normalize (bare house keys / `house/` prefix)
- Admin tabs horizontal scroll; 480px + landscape compose polish
- `qa:media-ref` unit script (10/10)

## Verify
- `qa:media-ref` → pass
- `qa:av` / lint / build as run in PR
- Workers Builds on merge (same path as #33)

## Agents
catalog-names · security · ux · a11y · code-checker → verifier
