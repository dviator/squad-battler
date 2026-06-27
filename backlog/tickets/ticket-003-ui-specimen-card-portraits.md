---
id: ticket-003-ui-specimen-card-portraits
status: shipped
priority: 1
size: M
parent: design-002-ui-clinical-bright-lab
depends_on: [ticket-002-ui-design-system-foundation]
feedback_refs: []
created: 2026-06-27
updated: 2026-06-27
---

# Ticket: Specimen-card portraits

## Goal

Replace the small emoji unit display with large, art-ready specimen cards across
battle and roster/pickers.

## Scope

- `src/web/components/UnitCard.tsx` — consolidate `UnitCard` + `BattleUnitCard` into
  one `SpecimenCard` with `battle` and `roster` variants. Shared shell: tinted art
  panel (`getSpeciesTint`) + large centered glyph (room for future `<img>`),
  `SPEC-###` tag, grade badge, nameplate, `HpBar`, SPD/ATK.
- Update call sites with minimal change: `components/BattleArena.tsx`,
  `components/UnitPicker.tsx`, `views/LabView.tsx`, `views/ShopView.tsx`.

## Acceptance Criteria

- [ ] Units render as specimen cards with tinted art panel + glyph + SPEC tag +
      grade badge; battle variant shows live HP and attack/hit/dead states.
- [ ] `bun run typecheck`, `bun run web:build`, `bun run test` green.

## Verification

`/eval` + `bun run web:build`; screenshot battle + a roster/picker view.

## Notes

`depends_on` ticket-002 (tokens). Keep the existing prop surface so call sites
barely change.

> **Shipped 2026-06-27.** Rewrote `UnitCard.tsx`: shared `SpecimenCard` shell
> (tinted `SpecimenArt` panel + large glyph, `SPEC-###` tag, best-grade badge,
> nameplate, HpBar) used by both `UnitCard` (roster) and `BattleUnitCard` (battle
> states). `compact` kept as a dense list row with a tint chip. Call sites
> unchanged. Verified in-browser: campaign + battle show large art-ready cards.
> `/eval`: typecheck ✓ test ✓ balance ✓ · web:build ✓.
