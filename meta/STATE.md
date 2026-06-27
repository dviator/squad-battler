---
updated: 2026-06-27
in_flight: ticket-003-ui-specimen-card-portraits # ticket/design id currently being worked, or null
features_shipped: 2 # increments on each shipped ticket; doc-sync triggers every ~5
last_doc_sync_at: 0 # features_shipped value at last doc-sync
---

# Pipeline State — MEMORY

This is the loop's memory. Cloud heartbeat sessions start cold; everything they
need to resume lives here and in `backlog/`. `/dev-tick` reads this first and
writes a tick summary back at the end. Keep it short — it's working memory, not a
changelog. Detailed history lives in git and `meta/INBOX.md`.

## Current focus

UI design pass (design-002) in progress, implemented one ticket at a time:
ticket-002 (design system) `shipped`; ticket-003 (specimen cards) in flight;
ticket-004 (battle face-off) blocked on 003. ticket-001 also awaiting playtest.

## Tick log (most recent first, keep ~10)

- 2026-06-27 · implement · ticket-002-ui-design-system-foundation → shipped.
  Clinical Bright Lab token system; swept all web views off raw zinc; verified
  in-browser. 576 tests green. Next: ticket-003 specimen cards.
- 2026-06-27 · implement · ticket-001-world1-enemy-tuning → shipped. Buffed Goob
  attack ×1.9; `test:balance` all 4 targets in range, 427 tests green. Awaiting
  playtest. Gap found: design's assumed lever was wrong (see ticket notes).
- 2026-06-27 · dry-run · refined idea "world1 too easy" → design-001 (decomposed) →
  ticket-001 (todo). Surfaced by `test:balance`: starter squad beat World 1 boss
  ~94% vs 5–15% target.
