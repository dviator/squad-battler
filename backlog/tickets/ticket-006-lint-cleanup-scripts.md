---
id: ticket-006-lint-cleanup-scripts
status: todo # todo | in-progress | blocked | shipped | verified | reverted
priority: 3 # 1 = high, 2 = normal, 3 = low
size: S # S | M | L  (M ≈ one session; L must be decomposed first)
parent: # standalone tech-debt cleanup — no parent design
depends_on: [] # ticket ids that must be shipped/verified first
feedback_refs: []
created: 2026-06-27
updated: 2026-06-27
---

# Ticket: Clear Biome lint errors in demo scripts

## Goal

Get `bun run lint` to a clean exit (0 errors) by fixing the 19 outstanding
Biome errors, all of which live in `scripts/` demo files. No production code
under `src/` is affected.

## Scope

- Files likely touched:
  - `scripts/equipment-demo.ts` (7)
  - `scripts/full-roguelike-demo.ts` (5)
  - `scripts/balance-test.ts` (5)
  - `scripts/combat-log-demo.ts` (3)
- Tests to add: none — these are dev demo scripts with no game logic. The
  verification gate is `bun run lint` itself.

## Error breakdown (as of 2026-06-27)

| Rule | Count | Fix |
|---|---|---|
| `lint/style/useTemplate` | 12 | auto (`bun run lint:fix`) |
| `lint/correctness/noUnusedImports` | 4 | auto (`bun run lint:fix`) |
| `lint/suspicious/noExplicitAny` | 3 | manual — give the value a real type |
| `lint/correctness/noUnusedFunctionParameters` | 1 | manual — drop or prefix `_` |

There are also ~19 warnings; clearing them is a stretch goal, not required to
pass.

## Acceptance Criteria

- [ ] `bun run lint` exits 0 with no errors.
- [ ] `noExplicitAny` sites get a concrete type, not an `// biome-ignore` escape
      hatch, unless the `any` is genuinely unavoidable (justify inline if so).
- [ ] No behavior change to any demo script's output.
- [ ] `bun run typecheck` still passes.

## Verification

`/eval` confirms: `bun run lint` clean, `bun run typecheck` clean. No balance
sim impact (scripts only — `test:balance` numbers unchanged).

## Notes

Most of this is a single `bun run lint:fix` pass; the only thinking required is
typing the 3 `noExplicitAny` sites and resolving the 1 unused parameter. Keep it
a single clean commit. Surfaced from a shop-UI cleanup session where the repo-wide
lint was found to be red.
