# follow-up — checker must-fixes

**Agents addressed:** [Catalog-names expert check](bc-158d79ad-32eb-550b-9d4f-3a42d3f3368f) · [Security expert checker](bc-7dec5438-ebd0-5328-9cd1-998c71237b12) · [UX a11y bounce checkers](bc-6a9c7da0-fe27-58d5-a8de-dd0cfb5531e5) · [Perf compliance code-checker](bc-a0cd041c-ee33-536c-b263-3b653b7c46c1)

## Already on main (#15)
- Security RMW + embed HTTPS
- Catalog blurb exact names

## This follow-up PR
| Fix | Source |
|-----|--------|
| Hero / Footprint `E:` drive letter | ux |
| Empty shelf placeholders | ux / bounce |
| Essay featured/hero → magazine when available | bounce |
| `aria-label` on tiles / next / mag / featured; admin `aria-pressed` | a11y |
| `/access?reason=session` + live notice | a11y |
| Admin upload always `source: uploaded`; `paywalled` flag separate | code-checker |
| Taxonomy validate via `getSubcategory` | code-checker |
| AbortController on catalog fetches; drop double house filter | perf / code-checker |
