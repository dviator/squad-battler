---
name: eval
description: The verification gate. Runs typecheck, the test suite, and the balance simulation check, then reports pass/fail with details. Hard gates block; soft balance targets are advisory. Use before committing/merging, or whenever you need to confirm the build is sound.
---

# /eval — verification gate

Run the three gates and report a clear verdict. This is what stands between work
and `main`.

## Run

```bash
bun run typecheck      # tsc strict, app + web  — HARD
bun run test           # vitest suite           — HARD
bun run test:balance   # balance sim sanity      — HARD gates + SOFT targets
```

Run all three even if an earlier one fails, so the report is complete.

## Interpret

- **HARD failure** in any gate → `/eval` FAILS. Nothing merges. Report exactly
  what failed (test names, type errors, which balance hard gate) so the caller can
  fix forward.
- **SOFT balance targets** out of range (from `scripts/balance-check.ts`) → advisory
  only. Surface them in the report and, if a change pushed a previously-in-range
  target out, flag it — but they do **not** block.

## Report format

```
EVAL: PASS | FAIL
  typecheck: ✓ | ✗ <summary>
  test:      ✓ | ✗ <n failed / n passed>
  balance:   ✓ | ✗ hard gates; <n> soft targets out of range
  key sim numbers: mini-boss reach X% · boss kill Y%
```
