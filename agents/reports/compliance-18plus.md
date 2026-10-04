# compliance-18plus

**Agent:** compliance-18plus  
**Verdict:** PASS

- AgeGate still modal + 18+ ONLY title; tracks `age_accepted` on confirm.
- Age banner + footer warning retained.
- QA smoke checks home HTML for `18+` marker.
- `wrangler.toml` sets `AGE_GATE_REQUIRED=1`.
