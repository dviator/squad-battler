---
id: design-003-overall-level-design
status: needs-input
priority: 1
created: 2026-06-27
updated: 2026-06-27
feedback_refs: []
---

# Design: Overall Level Design — floor structure & themes

## Summary

Define the macro structure of a full game run: **9 themed main floors + a bonus
10th floor** to beat the game. Each floor is a themed stage of the corporate
science lab you're escaping, escalating toward a high-damage endgame, and each
floor ends in a themed boss. This reframes the current code's generic "World 1"
as the first instance of a generalized **Floor** (a themed mini-world of several
encounters), and lays out the floor themes and progression.

## Player Experience

A full run is a legible climb: you feel the lab's fiction escalate floor by floor —
from discarded genetic waste up through corporate satire and a lethal pre-boss
gauntlet — each floor capped by a distinct boss, building to a climactic finale.
Each floor has its own identity (enemy faction, theme, boss) so the run never feels
like the same fight repeated.

## Decided structure (locked with Dan, 2026-06-27)

- **9 main floors + a bonus 10th floor** = the whole game.
- A **floor = a themed world of N encounters** (~the current World 1 shape): a
  sequence of regular/elite encounters ending in a **floor boss**; mid-floor
  mini-boss optional. Maps onto the existing `World → Level → Encounter` code —
  the current "World 1" (Goobs) becomes **one floor**, not the whole game.
- **Boss at the end of each floor** (9 floor bosses), with the **floor-10 finale**
  as the final challenge to beat the game.
- The **3 missing floor themes** (to reach 9) will be authored by Dan later — they
  stay open here; implementation proceeds on decided floors.

## Floor themes (6 of 9 known — Dan to author remaining 3)

| # | Theme | Notes | Status |
|---|---|---|---|
| — | **Genetic Scrap** | Discarded genetic material / lab waste. Early intro floor. | known |
| — | **Goobs & weird blobs** | The namesake blobs + gelatinous oddities. **Ties to existing roster/code (current World 1).** | known, partly built |
| — | **Reject creatures** | Things the lab deemed failures and threw out. | known |
| — | **Failed hybrids** | Botched genetic crossbreeds; leans into the breeding/genetics theme. | known |
| — | **HR Department (crazed humans)** | Corporate-satire floor; lab staff fanatically loyal to the evilcorp. First human enemies. | known |
| — | **Sharp creatures** | Cute/fuzzy creatures weaponized with piercing/bleed genetic mods. Cuteness subverts a lethal kit. The **high-damage pre-boss spike / gauntlet**. | known |
| — | _(theme TBD)_ | | **needs-input** |
| — | _(theme TBD)_ | | **needs-input** |
| — | _(theme TBD)_ | | **needs-input** |
| 10 | **Bonus floor** | Final challenge to beat the game (identity TBD). | **needs-input** |

(Floor numbers intentionally blank — ordering is an open question below.)

## Acceptance Criteria

For the **decided, actionable** structural slice (no creative input needed):

- [ ] The campaign model supports a 9-floor + bonus-10th run (generalize the
      existing `World`/`Campaign` so floors are data-driven and the count isn't
      hard-coded to the current World 1).
- [ ] The existing Goob content is reframed as one floor within the new structure
      (no gameplay regression; `bun run test` + `bun run test:balance` stay green).
- [ ] UI surfaces floor number/name/theme and "Floor X/10" progress.

Per-floor content (themes, bosses, enemy rosters) gets its own criteria once the
open questions below are resolved.

## Implementation Notes

- Reuse `src/core/world.ts` (`World`, `Level`, `Campaign`, `createWorld1Goobs`,
  `generateWorld`, `advanceEncounter`). Generalize naming toward "Floor" and make
  the floor list/themes declarative data rather than the current hard-coded set.
- Calibrate per-floor difficulty against `docs/systems/world-progression.md` +
  `scripts/balance-check.ts` (extend it to score later floors as they're built).
- **Reconcile docs:** `docs/systems/world-progression.md` currently targets "5–7
  worlds" and `DESIGN_FRAMEWORK.md` says "9–10 floors" — the doc-sync pass should
  align both to this 9 + bonus model once the structure ships.
- New enemy species/mutations per floor are **human-authored** (autonomy boundary)
  — do not invent them.

## Out of Scope

- Authoring the 3 missing themes, the floor bosses, and new enemy species/mutations
  (human-authored creative content).
- Meta-progression redesign (breeding cadence between floors vs. runs) — open
  question below; this design is about run macro-structure.

## Open Questions (need Dan — not to decide autonomously)

1. **3 missing floor themes** to reach 9 (Dan authoring later).
2. **Floor ordering / difficulty curve.** Proposed starting point from Dan's hints
   (genetic scrap early, Goobs tie-in, HR = first humans, sharp = pre-boss spike):
   `1 Genetic Scrap · 2 Goobs · 3 Reject creatures · 4 Failed hybrids ·
   5 HR Department · 6 TBD · 7 TBD · 8 Sharp creatures · 9 TBD (climax) · 10 Bonus`.
   Confirm or reorder.
3. **Floor-10 bonus identity** — true final boss? endless mode? secret floor?
4. **Per-floor enemy/boss rosters** — which species/mutations populate each floor;
   new content is human-authored.
5. **Meta-progression interaction** — breeding/lab between floors, or only between
   full runs?

## Tickets (after open questions resolve)

The **structural foundation** ticket (generalize World→Floor for a 9+bonus
campaign, reframe Goobs as Floor 1-or-2, surface floor progress in UI) is
independently actionable now and can be decomposed without waiting on the creative
open questions. Per-floor content tickets are blocked on Q1–Q4.
