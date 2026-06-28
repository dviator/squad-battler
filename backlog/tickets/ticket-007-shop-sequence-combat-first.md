---
id: ticket-007-shop-sequence-combat-first
status: in-progress
priority: 1
size: S
parent: design-004-level-loop-and-squad-frame
depends_on: []
feedback_refs: [feedback-005-action-before-economy]
created: 2026-06-27
updated: 2026-06-27
---

# Ticket: Shop sequence change — combat-first run loop

## Goal

Remove the shop that appears **before the first fight**. The run must open on
combat; the shop is earned and only appears **after a win**. Pure structural fix —
no new content, no balance change beyond ordering.

## Scope

- `src/web/store/gameStore.ts` — `startNewGame` currently sets `view: "shop"` and
  calls `generateShop(0)` before any fight (line ~167–177). Land the player on the
  first-fight screen instead (the squad/node screen that launches the first
  encounter); drop the pre-fight shop. The post-win shop in `afterBattleWin`
  (already `view: "shop"`, line ~335) is correct — leave it.
- `src/core/runSimulator.ts` — `simulateRun` runs `generateShop` *before* each
  combat (line ~180–182), including the first. Reorder so the shop phase happens
  *after* a combat win, before advancing to the next encounter; the first encounter
  gets no preceding shop.
- `src/web/views/ShopView.tsx` — copy says "Pre-battle supplies" (line ~59). Reframe
  as a post-fight resupply ("Resupply" / "Spend your winnings") so the shop reads as
  earned, not pre-fight. (Keep the "next fight" preview + Fight button — the shop
  still leads into the next node.)

## Acceptance Criteria

- [ ] Starting a new game lands on a fight (no shop screen appears before the first
      combat).
- [ ] After winning a combat, the shop appears before the next node; the first shop
      a player ever encounters is post-first-win.
- [ ] `simulateRun` performs no shop step before the first combat; shop occurs after
      each win. A test asserts no shopping precedes combat #1.
- [ ] `bun run test` + `bun run test:balance` green (no balance regression — this is
      ordering only).

## Verification

`/eval` (typecheck + test + test:balance) + `bun run web:build`. Screenshot a fresh
"New Game" landing directly on the first fight (no shop), then the shop appearing
after the first win, via claude-in-chrome.

## Notes

The decided slice of [[design-004-level-loop-and-squad-frame]]; enshrines
[[feedback-005-action-before-economy]]. No creative input required — ordering and
copy only.
