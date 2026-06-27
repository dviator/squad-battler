---
id: ticket-001-world1-enemy-tuning
status: shipped
priority: 1
size: M
parent: design-001-world1-difficulty-pass
depends_on: []
feedback_refs: []
created: 2026-06-27
updated: 2026-06-27
---

> **Shipped 2026-06-27.** Buffed Goob-family attack ×1.9 (GOOB 38→72,
> HEAVY_GOOB 28→53, MEGA_GOOB 38→72; HP unchanged) in `src/data/enemies.ts`.
> `test:balance`: mini-boss reach 69%, defeat 36%, boss reach 13%, boss kill 7.5%
> — all four targets in range; avg run depth 25→6 encounters.
> **Gap found & noted:** the design's assumed lever (the 50% nerf in
> `generateEnemySquad`) does not apply to the World 1 Goob campaign (fixed stats),
> and `runSimulator` models in-run healing + XP, so the squad was far stronger than
> the old hand-tuned comments assumed. Real lever = Goob base attack.
> **Verify by playtest:** confirm it *feels* tense (the buffed boss's Crushing
> Weight can now one-shot a unit) — then `/capture-feedback` to mark `verified`.

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
