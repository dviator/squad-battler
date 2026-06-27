---
name: dev-tick
description: The autonomous development heartbeat. Selects the single highest-value actionable item from the backlog and advances it one stage (refine an idea, decompose a design, or implement a ticket). Run on a schedule by the dev-tick cron routine, or manually to advance the pipeline. Does exactly one bounded unit of work, then stops.
---

# /dev-tick — the pipeline heartbeat

You are one fire of the autonomous loop. Do **exactly one bounded unit of work**,
persist state, then stop. Never chain multiple tickets — that blows the usage
budget and defeats the per-fire safety model.

## 1. Load memory

Read, in order:

- `meta/STATE.md` — what's in flight, feature count, last ticks.
- `meta/policies.md` — durable steering lessons (always honor these).
- `backlog/BACKLOG.md` — the prioritized index (you will also regenerate it).

If `meta/STATE.md` shows an `in_flight` item, resume/finish that first unless it's
`blocked` (then skip it — it's waiting on input or a dependency).

## 2. Select work (task selection)

Scan `backlog/tickets/*.md`, `backlog/designs/*.md`, `backlog/ideas/*.md`. Pick the
**one** highest-value actionable unit using this priority order:

1. A `todo` ticket whose `depends_on` are all `shipped`/`verified`, highest
   `priority` then smallest `size`. → dispatch `/implement-ticket`.
2. A `ready` design with no open questions. → dispatch `/decompose-design`.
3. A `draft` design or an idea worth refining. → dispatch `/refine-idea`.

Skip anything `needs-input`, `blocked`, or with unmet `depends_on` — these are not
actionable. If **nothing** is actionable, regenerate `BACKLOG.md`, note "idle —
nothing actionable" in `STATE.md`, and stop (optionally surface to INBOX if the
backlog is empty and could use new ideas).

Sizing: if the selected ticket is `size: L`, do not implement it — route to
`/decompose-design` (or split it) instead. One fire must fit one session.

## 3. Do the work

Invoke the matching stage skill (`/refine-idea`, `/decompose-design`, or
`/implement-ticket`) for the selected item. Let that skill own its gates and
outputs. Pass relevant context first:

- **In-session (MCP available):** call `mcp__plugin_qmd_qmd__query` with
  `collections: ["meta","backlog","docs"]` — use lex + vec sub-queries.
- **CLI/cloud fallback:** `scripts/meta-context.sh "<topic of the item>"`

## 4. Housekeeping (cheap, every tick)

- Regenerate `backlog/BACKLOG.md` from the current frontmatter of all backlog files
  (sections: Actionable now / Ready to decompose / Needs refinement / Blocked ·
  Needs input / Shipped — in verification window).
- If `features_shipped - last_doc_sync_at >= 5`, add a `[NEEDS-INPUT]`-free note to
  `STATE.md` flagging that a doc-sync + archive sweep is due (the doc-sync routine
  handles it; or do it now if trivial).

## 5. Write memory back

Update `meta/STATE.md`: set/clear `in_flight`, bump `features_shipped` if a ticket
shipped, prepend a one-line tick-log entry (date · what you picked · outcome ·
suggested next). Keep the tick log to ~10 lines.

Then **stop**. Do not pick up a second unit.
