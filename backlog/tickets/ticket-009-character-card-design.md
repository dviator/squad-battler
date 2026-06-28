---
id: ticket-009-character-card-design
status: blocked # needs-input — blocked on Dan's card visual-design direction (design-004 Open Q1)
priority: 1
size: M
parent: design-004-level-loop-and-squad-frame
depends_on: [ticket-008-persistent-squad-frame]
feedback_refs: []
created: 2026-06-27
updated: 2026-06-27
---

# Ticket: Character card visual design

## Goal

Make the `CharacterCard` (built in ticket-008) genuinely well-designed — the
considered visual treatment that shows the right information to make the game fun.
This is the *design* slice, distinct from the layout/structure in ticket-008.

## Blocked on input (design-004 Open Q1)

The card's visual design language is a Dan-led decision and must not be guessed:

- **Attack-turn timer treatment** — radial ring around the portrait? a depleting
  bar? a pip/segment countdown? Should it read at a glance which unit fires next?
- **Information hierarchy** — what's primary (portrait + HP + timer) vs. secondary
  (stats, mutations, grade)? What hides until hovered/tapped?
- **The "fun"** — how the card telegraphs threat/readiness and makes the
  tick-based combat legible and satisfying to watch.

Resolve via INBOX `[NEEDS-INPUT]`; a quick in-browser prototype of 1–2 timer
treatments for Dan to pick from is a good way to unblock.

## Scope (once unblocked)

- Apply the chosen treatment to `CharacterCard` for both `live` and `idle` modes.
- Polish portrait framing, HP-bar styling, attack-icon slot, and the timer per the
  picked direction; keep within the Clinical Bright Lab tokens (design-002).
- No new game logic; render-only.

## Acceptance Criteria (draft — finalize after input)

- [ ] Attack-turn timer uses the Dan-approved treatment and reads at a glance in a
      live battle.
- [ ] Card hierarchy makes portrait, HP, and readiness primary; secondary stats
      don't crowd them at ~360px.
- [ ] `bun run web:build`, `bun run check:responsive`, `bun run test` green.

## Verification

`/eval` + `bun run web:build`; before/after screenshots of a live battle and the
shop card via claude-in-chrome for Dan to confirm the feel.

## Notes

Design slice of [[design-004-level-loop-and-squad-frame]]. Blocked on Open Q1 per
[[feedback-001-carve-actionable-slices]] (structure shipped in ticket-008; the
creative visual direction waits on Dan).
