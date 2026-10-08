# admin compose — expert save + mobile pass

**Branch:** `cursor/admin-url-input-fix-560e`

## Bugs fixed
| Issue | Fix |
|-------|-----|
| iOS “Enter a URL” blocked Save | `type="text"` + `noValidate`; house paths OK |
| Edit felt unsaved | Auto-PATCH on drop; sticky Save; Library confirmation |
| Advanced panel traps phones | Edit opens with details **closed** (drop zones first) |
| Tiny inputs / zoom | 16px inputs; sticky action bar; safe-area |

## Polish
- Editing banner: “thumbnails & media save as you drop them”
- Sticky cancel/save bar above home indicator
- Library edit/remove full-width on phone
- `normalizeMediaRef` for bare house filenames
- Upload retries (3×) on 5xx/429/network

## Verify
- `e2e-admin-edit-save` · `e2e-av-upload` · `qa:smoke` + admin
