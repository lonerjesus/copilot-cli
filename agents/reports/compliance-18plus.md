# compliance-18plus — Netflix house stream

**Agent:** `compliance-18plus`  
**Branch:** `cursor/netflix-house-stream-560e` lineage vs `origin/main`  
**Verdict:** PASS

## Gate path verified

| Surface | Status |
|---------|--------|
| `AgeGate` | Intact — `alertdialog`, title `18+`, “Adults only.”, `enter` → storage + `track("age_accepted")` |
| `data-age-gate` | `layout.tsx` from `AGE_GATE_REQUIRED !== "0"` |
| `wrangler.toml` | `AGE_GATE_REQUIRED = "1"` (prod + preview) |
| Boot | `BootSequence` still ahead of shell; brand = `SITE.title` / `SITE.domain` |
| Age banner | `.agebanner` `18+` on AppShell, FootprintShell, AdminShell |
| Identity / legal | `SITE.description` “18+ only.”; `/privacy`, `/terms`, `/access` keep 18+ copy |
| Account | `AccessGate` birth-date + 18+ eyebrow; register still needs adult DOB |
| Smoke | `compliance-18plus-marker` + `age-gate-flag` in `qa-smoke.sh` |

## Diff impact

PR does not weaken age gate, boot, or 18+ banner. Removals (Names bay, outside media from member stream) are not age-compliance surfaces.

## Copy exactness

Gate title and banner remain exact `18+`. No third-party age-rating language.

## Must-fix polish

None blocking. Optional: `SiteFooter` `note` with `18+ only` if product wants legal-strip duplication beyond banner + gate.

## Residual

AgeGate `getServerSnapshot` returns confirmed to avoid SSR flash — unchanged intentional behavior.
