---
id: ticket-001-world1-enemy-tuning
status: todo
priority: 1
size: M
parent: design-001-world1-difficulty-pass
depends_on: []
feedback_refs: []
created: 2026-06-27
updated: 2026-06-27
commit:
---

# Ticket: World 1 enemy tuning

## Goal

Retune World 1 enemy strength so the `test:balance` soft targets land in range,
without breaking the tutorial or the build.

## Scope

- Files likely touched: `src/core/world.ts` (`generateEnemySquad` nerf factor,
  `createWorld1Goobs` composition / boss multipliers).
- Tests to update: any in `tests/world.test.ts` that assert specific enemy stats.

## Acceptance Criteria

- [ ] `bun run test:balance`: mini-boss reach 40–70%, boss reach 10–30%, boss
      defeat 5–15%, Encounter 1 clear ≥ 90%.
- [ ] `bun run typecheck` and `bun run test` green.

## Verification

`/eval`. The key numbers come from `scripts/balance-check.ts`; iterate the nerf
factor and Goob/Alpha-Goob multipliers until all four soft targets read ✓ (or as
close as a numbers-only pass allows — if a target can't be hit without new content,
stop and raise `[NEEDS-INPUT]` per the design).

## Notes

Document the final tuning numbers in the commit body. Once shipped, playtest a
couple of runs to confirm it *feels* tense rather than just hitting the sim
targets, then `/capture-feedback` to verify.
