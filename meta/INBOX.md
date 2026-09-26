# INBOX — Needs Dan's input

Entries below are blocking the autonomous pipeline. Each requires a creative or
game-feel decision that Claude can't make autonomously. Answer in the linked
GitHub issue; the pipeline resumes on the next heartbeat.

---

## [NEEDS-INPUT] 2026-09-26 — Board fully dry; Card Combat UI (#30) is the only unblocking move

**Pipeline state:** All card-combat engineering, single-starting-ability, and
Wolf species (#32, shipped 2026-09-25) are on main. No Ready tickets remain;
the board is empty of actionable work.

| Issue | What | Stage |
|---|---|---|
| #27 | Card data model + placeholder decks | Shipped ✓ |
| #28 | Card combat turn resolver | Shipped ✓ |
| #29 | Deterministic AI policy + sim wiring | Shipped ✓ |
| #31 | `useCardCombat` hook + session phase machine | Shipped ✓ |
| #32 | Wolf species (LastPlayerTarget + Lone Wolf mutation) | Shipped ✓ |

The engine and session layer are complete. **The UI is the only missing piece**,
blocked on your answers to the UX questions in **#30 (design-007: Card Combat UI)**.

**Please answer Q1–Q6 in #30** so the UI ticket can be implemented:
<https://github.com/dviator/squad-battler/issues/30>

### Also waiting (lower urgency)

- **#22** — Battle legibility design (visual treatment for initiative, targeting
  icons, fight pacing): three design questions before tickets can be created.
  <https://github.com/dviator/squad-battler/issues/22>

- **#25** — Genetic Deckbuilder Pivot (north-star design): gene pool / starter
  roster decisions that shape the long-term roadmap.
  <https://github.com/dviator/squad-battler/issues/25>
