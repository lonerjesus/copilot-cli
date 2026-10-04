# bounce-risk

**Agent:** analytics-bounce  
**Verdict:** PASS

## Signals wired (first-party)

| Signal | Surface |
|--------|---------|
| `boot_complete` | BootSequence |
| `age_accepted` | AgeGate |
| `enter_stream` | Hero CTA |
| `play` / `next` | PlayerDock |
| `magazine_open` | MagazineContext |
| `category_filter` | CategoryBrowser |
| `command` | CommandBar |
| `footprint_open` | FootprintFeed |
| `cosmogram_view` | Cosmogram IntersectionObserver |

Hero CTA remains the primary first action; no dead CTAs introduced.
