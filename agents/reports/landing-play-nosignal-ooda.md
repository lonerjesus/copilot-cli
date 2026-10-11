# Landing ▶ → idle / NO SIGNAL — OODA

**Screenshot:** Pause icon + `DECK` / `idle` / `NO SIGNAL` + green orb on `kamaunegasi.net`  
**Prod tip:** `main` @ `b4f55fc` (#43 only — stack #44 not deployed)

## OBSERVE

| UI | Meaning in code |
|----|-----------------|
| `NO SIGNAL` | `current == null` (empty player queue) |
| `DECK` / `idle` | expanded dock with no selected item |
| Pause `❚❚` | `playing === true` |
| Green orb | production PlayerDock (pre–DeckArt) |

Contradiction = **playing without a current track**.

## ORIENT

On `main`, Hero is still:

```ts
onStream={() => { setExpanded(true); toggle(); }}
```

`toggle` flips `playing` with no catalog seed (`CATALOG = []`). StreamDeck may show titles (live `/api/catalog`) but the **player queue was never filled**.

iOS “Lockdown Enabled” is Safari chrome — not the NO SIGNAL label. Real bug is empty-queue toggle.

## DECIDE / ACT (stack #44)

1. Hero / idle dock → `fetchPlayableHouse()` + `enterStream(..., { forcePlay: true })`
2. Queue order: **newest `publishedAt` first** → ▶ = latest; ⏭ = older (reverse chrono)
3. Invariant: `!current && playing` → force `playing = false` (no Pause+NO SIGNAL)
4. Gate: `qa:playable-house`

## REDTEAM

- Shipping only #43 left prod broken for landing ▶
- Merge #44 to clear production
- House-only filter kept (`houseCatalog`); matches `/api/catalog`
