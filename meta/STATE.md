---
updated: 2026-06-28
in_flight: ticket-007-shop-sequence-combat-first # ticket/design id currently being worked, or null
features_shipped: 5 # increments on each shipped ticket; doc-sync triggers every ~5
last_doc_sync_at: 5 # features_shipped value at last doc-sync
---

# Pipeline State — MEMORY

This is the loop's memory. Cloud heartbeat sessions start cold; everything they
need to resume lives here and in `backlog/`. `/dev-tick` reads this first and
writes a tick summary back at the end. Keep it short — it's working memory, not a
changelog. Detailed history lives in git and `meta/INBOX.md`.

## Current focus

Doc-sync complete (features_shipped 5 → last_doc_sync_at 5). DESIGN_FRAMEWORK +
SYSTEMS reflect 5 shipped features. Archive sweep: no verified items yet (all 5
tickets in verification window). Actionable: ticket-006 (lint-cleanup-scripts, P3
S) + idea (single-starting-ability-progression, needs refinement).

## Tick log (most recent first, keep ~10)

- 2026-06-28 · design+steering · Dan reworked the level loop. Filed
  design-004-level-loop-and-squad-frame (action before economy: run opens on combat,
  shop is earned; combat+shop share one persistent squad frame). Decomposed →
  tickets 007 (shop-seq bug, in-progress bg), 008 (squad frame + card layout), 009
  (card visual design, needs-input), 010 (shop layout). Enshrined feedback-005 +
  policies + DESIGN_FRAMEWORK Run Loop. design-004 open feel Qs → INBOX.
- 2026-06-28 · doc-sync · updated DESIGN_FRAMEWORK.md + SYSTEMS.md for 5 shipped
  features: Web UI system added, World Progression updated for 10-floor FLOOR_CATALOG,
  floor-count design question resolved. Archive sweep: 0 verified items, none moved.
  last_doc_sync_at = 5. Next: implement ticket-006 (lint-cleanup-scripts).
- 2026-06-27 · implement · ticket-005-floor-structure-foundation → shipped. FLOOR_CATALOG
  (10 entries), World.floorNumber, getFloorProgress, createGoobCampaign → 10 floors.
  CampaignView shows "Floor X / 10". 163 tests green, balance hard gates pass. Pushed.
  Next: doc-sync due (features_shipped hit 5).
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
