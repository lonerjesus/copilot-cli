# admin-edit-save — uploads stick on edit

**Branch:** `cursor/admin-edit-save-560e`

## Bug
Thumbnail/media uploads while **editing** only updated local form state. Message said “publish to save”, and **Save changes** wiped the success message + emptied Compose without returning to Library — looked like nothing saved.

## Fix
- Auto-`PATCH` after media/thumbnail upload when `editingId` is set
- Save/publish always returns to Library with a lasting `saved ·` / `published ·` status
- Chunk/single uploads retry on 5xx/429/network (3 attempts)
- Clear thumbnail persists while editing

## Verify
| Suite | Result |
|-------|--------|
| `e2e-av-upload` | 14/14 |
| `e2e-admin-edit-save` | 9/9 |
| `qa:smoke` + admin | 60/60 |
