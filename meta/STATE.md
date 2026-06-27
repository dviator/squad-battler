---
updated: 2026-06-27
in_flight: null # ticket/design id currently being worked, or null
features_shipped: 0 # increments on each shipped ticket; doc-sync triggers every ~5
last_doc_sync_at: 0 # features_shipped value at last doc-sync
---

# Pipeline State — MEMORY

This is the loop's memory. Cloud heartbeat sessions start cold; everything they
need to resume lives here and in `backlog/`. `/dev-tick` reads this first and
writes a tick summary back at the end. Keep it short — it's working memory, not a
changelog. Detailed history lives in git and `meta/INBOX.md`.

## Current focus

Nothing in flight. `ticket-001-world1-enemy-tuning` is the next actionable item;
the next `/dev-tick` (or a manual `/implement-ticket`) will pick it up.

## Tick log (most recent first, keep ~10)

- 2026-06-27 · dry-run · refined idea "world1 too easy" → design-001 (decomposed) →
  ticket-001-world1-enemy-tuning (todo). Surfaced by `test:balance`: starter squad
  beats World 1 boss ~94% vs 5–15% target. Next: implement ticket-001.
