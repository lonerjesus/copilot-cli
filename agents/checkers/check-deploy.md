# check-deploy

**Agents:** `cloudflare-deploy` · `security` · `performance` → `verifier`

## Must verify
- [ ] Workers Builds green on PR head
- [ ] `AUTH_KV` binding present; no AUTH_KV string Variable collision
- [ ] Custom domains `www.kamaunegasi.net` + apex
- [ ] Smoke: register → home → footprint → session exclusivity → catalog house-only

## Outputs
`deploy-check.md` · `security-report.md` · `perf-notes.md` · `verify-verdict.md`
