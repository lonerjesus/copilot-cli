# a11y-report

**Agent:** a11y  
**Verdict:** PASS

## Fixed

- Skip-to-content link (visible on focus).
- Global `:focus-visible` phosphor outline; mouse focus outlines suppressed.
- `main#top` is focusable via `tabIndex={-1}` for skip target.

## Notes

- Player controls already expose aria-labels.
- AgeGate uses `role="alertdialog"` + labelled title.
