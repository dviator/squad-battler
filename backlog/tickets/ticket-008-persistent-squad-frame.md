---
id: ticket-008-persistent-squad-frame
status: todo
priority: 1
size: M
parent: design-004-level-loop-and-squad-frame
depends_on: []
feedback_refs: []
created: 2026-06-27
updated: 2026-06-27
---

# Ticket: Persistent squad frame + character-card layout

## Goal

Make the squad's character cards a **persistent frame** shared by combat and shop,
so the units never leave the screen across the loop. This is the structural/layout
slice — one `CharacterCard` component with slots for every element, plus a
`SquadFrame` that hosts the squad consistently in both views. (Visual polish /
design language is ticket-009.)

## Scope

- `src/web/components/` — consolidate the card variants. Today `UnitCard.tsx` has
  `SpecimenCard` (shared shell), `UnitCard` (roster), and `BattleUnitCard` (live
  combat). Factor a single `CharacterCard` with a `mode` (`live` | `idle`) and
  explicit slots:
  - **portrait** — reuse `SpecimenArt` (art-ready glyph slot).
  - **HP bar** — reuse `HpBar`.
  - **attack-icon placeholder** — new art-ready slot (no real art yet).
  - **attack-turn countdown timer** — new element. `live`: bound to combat
    tick/cooldown state; `idle`: static "every N ticks" preview from speed/cooldown.
  - existing chrome: SPEC-### tag, grade badge, position.
- `SquadFrame` component — lays out up-to-3 squad `CharacterCard`s by `Position`,
  reused by `BattleArena` (squad side of the face-off) and `ShopView`.
- `src/web/components/BattleArena.tsx` + `src/web/views/ShopView.tsx` — render the
  squad via `SquadFrame` so it's literally the same component instance pattern in
  both (no duplicated card markup).
- Attack-turn timer data: derive from `src/core/battle.ts` cooldown/tick model;
  combat reads the replay/tick state (`useBattleReplay`), idle derives from stats.
  Keep core pure — the timer only *renders* state.

## Acceptance Criteria

- [ ] One `CharacterCard` component renders in both battle and shop (no duplicated
      card markup); battle uses `mode="live"`, shop uses `mode="idle"`.
- [ ] The card exposes all four slots: portrait, HP bar, attack-icon placeholder,
      attack-turn timer.
- [ ] The attack-turn timer animates per tick during a battle replay and shows a
      stat-preview at rest.
- [ ] Squad layout is the same `SquadFrame` in battle and shop, responsive per
      `docs/MOBILE_STANDARDS.md` (renders at ~360px and desktop).
- [ ] `bun run typecheck`, `bun run web:build`, `bun run test`, `check:responsive`
      green.

## Verification

`/eval` + `bun run web:build` + `bun run check:responsive`. Screenshot the same
squad cards in a battle (timers ticking) and in the shop (idle preview) via
claude-in-chrome.

## Notes

Layout/structure slice of [[design-004-level-loop-and-squad-frame]] — engineering,
no creative input. The considered visual treatment is [[ticket-009-character-card-design]]
(needs Dan). Builds on ticket-003 (specimen cards) + ticket-004 (face-off).
