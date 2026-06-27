---
id: ticket-005-floor-structure-foundation
status: shipped
priority: 1
size: M
parent: design-003-overall-level-design
depends_on: []
feedback_refs: [feedback-001-carve-actionable-slices]
created: 2026-06-27
updated: 2026-06-27
---

# Ticket: Floor-structure foundation (generalize World → Floor)

## Goal

Make the campaign a data-driven sequence of **9 floors + a bonus 10th** instead of
the hard-coded current set, so per-floor content can be added later without code
changes. Pure structural/engineering work — **no new creative content** (themes,
bosses, enemy species are human-authored and tracked in design-003). The existing
Goob content keeps working as one floor.

## Scope

- `src/core/world.ts` — generalize `World`/`Campaign` so the run is a declarative
  list of floors (count not hard-coded to current World 1). Each floor carries a
  number, name, and theme tag; ends in a boss slot. Reuse `createWorld1Goobs`,
  `generateWorld`, `advanceEncounter`, `getCurrentEncounter`.
- Existing Goob content becomes one floor in the new structure (no gameplay
  regression).
- UI: surface floor number/name + "Floor X/10" progress (e.g. `CampaignView.tsx`,
  reuse `getEncounterTypeLabel`/existing header).
- Tests: update/extend `tests/world.test.ts` for the generalized structure.

## Acceptance Criteria

- [ ] Campaign supports a 9-floor + bonus-10th run, floors declared as data
      (adding a floor needs no structural code change — only data + its content).
- [ ] Existing Goob floor plays identically — `bun run test` and
      `bun run test:balance` stay green (no balance regression).
- [ ] UI shows the current floor's number/name/theme and overall progress.

## Verification

`/eval` (typecheck + test + test:balance) + `bun run web:build`; screenshot the
campaign view showing floor progress.

## Notes

Carved out of `design-003-overall-level-design` (status needs-input) as the
fully-decided slice that needs no creative input — see [[feedback-001-carve-actionable-slices]].
Floor themes/ordering/bosses/rosters remain blocked on Dan (design-003 open
questions); this ticket only lays the structural groundwork. Leave the non-Goob
floors as empty/placeholder data until their content is authored.
