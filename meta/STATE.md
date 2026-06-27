---
updated: 2026-06-27
in_flight: null # ticket/design id currently being worked, or null
features_shipped: 4 # increments on each shipped ticket; doc-sync triggers every ~5
last_doc_sync_at: 0 # features_shipped value at last doc-sync
---

# Pipeline State — MEMORY

This is the loop's memory. Cloud heartbeat sessions start cold; everything they
need to resume lives here and in `backlog/`. `/dev-tick` reads this first and
writes a tick summary back at the end. Keep it short — it's working memory, not a
changelog. Detailed history lives in git and `meta/INBOX.md`.

## Current focus

Nothing in flight. UI design pass (design-002) complete — tickets 002/003/004
`shipped`, awaiting playtest. design-003 (overall level design) refined →
`needs-input` (creative content needs Dan — see INBOX); its structural-foundation
slice is now **ticket-005 (actionable)**, the next thing `/dev-tick` will pick up.
ticket-001 also awaiting playtest. Note: 4 features shipped, last_doc_sync_at 0 →
doc-sync + archive due soon.

## Tick log (most recent first, keep ~10)

- 2026-06-27 · steering · enshrined "carve the decided slice out of a needs-input
  design" (feedback-001 + policies + refine-idea skill). Created
  ticket-005-floor-structure-foundation (actionable) from design-003.
- 2026-06-27 · refine · idea overall-level-design → design-003 (needs-input). Locked
  9 floors + bonus, floor = themed world, boss per floor. Open: 3 themes, ordering,
  floor-10, rosters, meta-progression. Structural slice → ticket-005.
- 2026-06-27 · implement · ticket-004-ui-battle-faceoff → shipped. BattleArena now
  squad-left / VS / enemy-right with directional lunges; verified in-browser.
  Completes design-002 (UI design pass).
- 2026-06-27 · implement · ticket-003-ui-specimen-card-portraits → shipped. Unified
  SpecimenCard (tinted art panel, SPEC tag, grade badge) for roster + battle;
  verified in-browser. Next: ticket-004 battle face-off.
- 2026-06-27 · implement · ticket-002-ui-design-system-foundation → shipped.
  Clinical Bright Lab token system; swept all web views off raw zinc; verified
  in-browser. 576 tests green. Next: ticket-003 specimen cards.
- 2026-06-27 · implement · ticket-001-world1-enemy-tuning → shipped. Buffed Goob
  attack ×1.9; `test:balance` all 4 targets in range, 427 tests green. Awaiting
  playtest. Gap found: design's assumed lever was wrong (see ticket notes).
- 2026-06-27 · dry-run · refined idea "world1 too easy" → design-001 (decomposed) →
  ticket-001 (todo). Surfaced by `test:balance`: starter squad beat World 1 boss
  ~94% vs 5–15% target.
