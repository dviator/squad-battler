---
id: ticket-010-shop-screen-layout
status: todo
priority: 2
size: M
parent: design-004-level-loop-and-squad-frame
depends_on: [ticket-007-shop-sequence-combat-first, ticket-008-persistent-squad-frame]
feedback_refs: []
created: 2026-06-27
updated: 2026-06-27
---

# Ticket: Shop screen layout on the persistent frame

## Goal

Rebuild `ShopView` around the persistent `SquadFrame` so the shop *is* the squad
screen: your units stay on screen (continuity from combat) and the shop offers
render around them. Buying an item updates the relevant card in place.

## Scope

- `src/web/views/ShopView.tsx` — host the squad via `SquadFrame` (ticket-008) as the
  primary surface; lay the shop offers (`ShopItemCard` grid) around/below it.
  Purchase flow targets a card directly where possible (apply-to-unit), reducing the
  `UnitPicker` modal to the genuinely-ambiguous case.
- Keep the post-fight framing from ticket-007 (resupply with winnings) + the "next
  fight" preview + Fight button that advances to the next node.
- Buying updates the targeted `CharacterCard` in place (potion fills HP bar;
  equipment adds the item icon).
- Responsive per `docs/MOBILE_STANDARDS.md`: squad + offers reflow cleanly at
  ~360px (dense grids, `min-w-0`/`truncate`, no fixed px widths).

## Acceptance Criteria

- [ ] Shop renders the squad with the same `SquadFrame`/`CharacterCard` as combat —
      units are visibly continuous across the loop.
- [ ] Shop offers are laid out around the persistent squad; buying updates the card
      in place.
- [ ] Reads as a post-fight resupply that leads into the next node.
- [ ] `bun run web:build`, `bun run check:responsive`, `bun run test` green.

## Verification

`/eval` + `bun run web:build` + `bun run check:responsive`. Screenshot the shop at
~360px and desktop showing the persistent squad + offers, and a buy updating a card,
via claude-in-chrome.

## Notes

Depends on ticket-007 (combat-first loop) and ticket-008 (persistent frame).
Realizes the "shop = squad screen, same frame as combat" goal of
[[design-004-level-loop-and-squad-frame]].
