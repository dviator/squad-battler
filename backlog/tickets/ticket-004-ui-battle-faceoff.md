---
id: ticket-004-ui-battle-faceoff
status: todo
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
