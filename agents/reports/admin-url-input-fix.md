# admin-url-input-fix

**Branch:** `cursor/admin-url-input-fix-560e`

## Bug
iOS Safari blocked **Save changes** with “Enter a URL” on Poster/Media fields.
House uploads store same-origin paths (`/api/media/house/…`), which fail `<input type="url">`.

## Fix
- Media / page / poster inputs → `type="text"` + `inputMode="url"`
- Form `noValidate` so native URL checks cannot trap Save
- `normalizeMediaRef` repairs bare house filenames / `house/…` keys before PATCH

## Verify
- `e2e-admin-edit-save` + typecheck
