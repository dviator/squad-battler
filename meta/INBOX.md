# INBOX — Needs Dan's input

Entries below are blocking the autonomous pipeline. Each requires a creative or
game-feel decision that Claude can't make autonomously. Answer in the linked
GitHub issue; the pipeline resumes on the next heartbeat.

---

## [NEEDS-INPUT] 2026-08-26 — Card Combat UI (#30) is the only remaining blocker

**Pipeline state:** All card-combat engineering is shipped and on main.

| Issue | What | Stage |
|---|---|---|
| #27 | Card data model + placeholder decks | Shipped ✓ |
| #28 | Card combat turn resolver | Shipped ✓ |
| #29 | Deterministic AI policy + sim wiring | Shipped ✓ |
| #31 | `useCardCombat` hook + session phase machine | Shipped ✓ |

The session layer is ready. The UI is the only missing piece — and it's blocked
on your answers to the UX questions in **#30 (design-007: Card Combat UI)**.

**Please answer Q1–Q6 in #30** so the UI ticket can be implemented:
<https://github.com/dviator/squad-battler/issues/30>

### Also waiting (lower urgency)

- **#21** — Wolf species: two unpipelined branches need your pick of which to
  merge and any stat/ability tweaks you want before it lands.
  <https://github.com/dviator/squad-battler/issues/21>

- **#22** — Battle legibility design (visual treatment for initiative, targeting
  icons, fight pacing): three design questions before tickets can be created.
  <https://github.com/dviator/squad-battler/issues/22>

- **#25** — Genetic Deckbuilder Pivot (north-star design): higher-level direction
  that shapes the long-term roadmap.
  <https://github.com/dviator/squad-battler/issues/25>
