---
id: ticket-004-ui-battle-faceoff
status: shipped
priority: 1
size: M
parent: design-002-ui-clinical-bright-lab
depends_on: [ticket-003-ui-specimen-card-portraits]
feedback_refs: []
created: 2026-06-27
updated: 2026-06-27
---

# Ticket: Battle left↔right face-off

## Goal

Turn the battle from a vertical stack into a squad-left / VS / enemy-right face-off.

## Scope

- `src/web/components/BattleArena.tsx` — horizontal arena: squad column (left), VS
  divider, enemy column (right); each column stacks up-to-3 `SpecimenCard`s by
  `Position` (reuse `getUnitAtPosition`). Dashed placeholder for empty slots.
  Section labels SQUAD (teal) / ENEMIES (red). Responsive: stack below `md`.
- `src/web/views/BattleView.tsx` — widen container (`max-w-lg` → `max-w-5xl`,
  responsive); keep `useBattleReplay` wiring untouched.
- Directional attack/hit animation (squad lunges right, enemy lunges left).

## Acceptance Criteria

- [ ] Battle shows squad left vs enemies right on desktop; stacked on narrow screens.
- [ ] Replay animations (attack/hit/dead) still work and read directionally.
- [ ] `bun run typecheck`, `bun run web:build`, `bun run test` green.

## Verification

`/eval` + `bun run web:build`; screenshot a battle mid-replay (attacking + hit
states) via claude-in-chrome.

## Notes

`depends_on` ticket-003 (specimen cards).

> **Shipped 2026-06-27.** Rebuilt `BattleArena` as squad-left / VS / enemy-right
> (columns stack each side's up-to-3 cards; dashed placeholder for empty slots;
> responsive — stacks below `md`). Widened `BattleView` to `max-w-5xl` (log/controls
> kept narrow). Added directional lunge keyframes; attacking squad lunges right,
> enemies left (derived from `isEnemy`). Verified in-browser. `/eval`: typecheck ✓
> test ✓ balance ✓ · web:build ✓. Completes design-002.
