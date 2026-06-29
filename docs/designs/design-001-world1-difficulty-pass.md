---
id: design-001-world1-difficulty-pass
status: decomposed
priority: 1
created: 2026-06-27
updated: 2026-06-27
feedback_refs: []
---

# Design: World 1 Difficulty Pass

## Summary

World 1 is currently a walkover. A fresh starter squad (no items, no
meta-progression) clears it almost every time. Retune enemy strength and encounter
composition so a first run is survivable but tense, bringing the
`docs/DESIGN_FRAMEWORK.md` balance targets into range. This is a pure stat/tuning
pass — no new content, no new mechanics — so it's within autonomous balance scope.

## Player Experience

A first-time player should feel real pressure: most runs end somewhere in the
mid-to-late floors, the mini-boss is a genuine wall, and beating the boss on a
fresh squad is a rare thrill rather than the default. The tutorial fight stays
gentle so new players aren't wiped immediately.

## Acceptance Criteria

Validated by `bun run test:balance` (fresh starter squad, World 1):

- [ ] Mini-boss reach rate within 40–70%.
- [ ] Boss reach rate within 10–30%.
- [ ] Boss defeat rate within 5–15%.
- [ ] Encounter 1 clear rate stays ≥ 90% (tutorial remains winnable).
- [ ] `bun run typecheck` and `bun run test` stay green (update any tests that
      assert specific enemy stats).

## Implementation Notes

- Primary lever: the flat 50% enemy nerf in `generateEnemySquad`
  (`src/core/world.ts`) and the World 1 Goob encounter composition in
  `createWorld1Goobs`. Tune the nerf factor and/or per-encounter enemy counts and
  the Mega/Alpha Goob multipliers.
- Iterate against `scripts/balance-check.ts` numbers; it already measures all the
  target checkpoints.
- Prefer the smallest set of changes that lands the targets; document the chosen
  numbers in the commit so the tuning rationale is traceable.

## Out of Scope

- New enemies, species, mutations, or items (would need human-designed content).
- Worlds 2–3 balance (placeholder-generated; separate pass once they're real).
- Meta-progression scaling (not yet implemented).

## Open Questions

None — stat tuning toward existing framework targets is autonomous. If hitting the
targets turns out to require a new enemy or a mechanic (not just numbers), stop and
raise a `[NEEDS-INPUT]`.

## Tickets

- ticket-001-world1-enemy-tuning
