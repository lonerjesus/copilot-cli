# check-netflix-house

**Agents:** `code-checker` · `security` · `catalog-names` · `content-ingest` · `compliance-18plus` · `ux` · `a11y` · `analytics-bounce` · `qa-browser` → `cloudflare-deploy` → `verifier`

## Must verify
- [ ] Member stream / browse / `/api/catalog` = house uploads only (`isHouseMedia`)
- [ ] Footprint carries fetched/outside only (`isFetchedMedia` / `catalogToFootprint`)
- [ ] Names bay gone (no `AliasMatrix`, no `#names`)
- [ ] Admin Video / Photo / Music presets publish `source: uploaded`
- [ ] Second login → prior `/api/auth/me` = 401; cookie cleared on kick
- [ ] AgeGate + 18+ banner still present
- [ ] Exact house names only

## Outputs
`code-checker.md` · `security-report.md` · `names-audit.md` · `ingest-log.md` · `compliance-18plus.md` · UX/a11y/bounce · `qa-browser.md` · `deploy-check.md` · `verify-verdict.md`
