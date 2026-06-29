---
name: dev-tick
description: The autonomous development heartbeat. Reads the GitHub Issues board, selects the highest-value actionable item, and advances it (refine an idea, decompose a design, or implement a ticket), looping implementation-first until out of actionable work or session budget. Run on a schedule by the dev-tick cron routine, or manually to advance the pipeline.
---

# /dev-tick — the pipeline heartbeat

You are one fire of the autonomous loop. Work **implementation-first**: prefer
shipping a ready ticket over refining further upstream, and loop on actionable
work until the board is dry or the session budget is spent — then stop. The board
and git are the durable state; there is no `STATE.md` to write (retired).

`meta/TRACKER.md` is the canonical reference for board coordinates, Stage option
ids, labels, and every `gh` recipe. Source the `set_stage`/`stage_id` helpers from
it. Headless runs need `GH_TOKEN` (repo + project scope) in the environment.

## 1. Load memory

Read, in order:

- `meta/policies.md` — durable steering lessons (always honor these).
- The board — the prioritized open issues, via gh (this replaces `BACKLOG.md`):
  ```bash
  gh issue list --state open --json number,title,labels,assignees \
    --label type:ticket
  gh issue list --state open --json number,title,labels --label type:design
  gh issue list --state open --json number,title,labels --label type:idea
  ```
  Stage lives on the board, not the issue — read it from the project when you need
  to disambiguate (or use the saved board views named in `meta/TRACKER.md`).

If any issue is at Stage `In-progress` with an assignee, it's already in flight —
resume/finish that first unless it's `Blocked` or `Needs-input` (skip those:
waiting on a dependency or a Dan decision).

## 2. Select work (task selection)

Pick the **one** highest-value actionable unit using this priority order:

1. A `type:ticket` issue at Stage `Ready` whose "Blocked by #m" issues are all
   `Shipped`/`Verified`, highest `priority:` then smallest `size:`. → dispatch
   `/implement-ticket`.
2. A `type:design` issue at Stage `Ready` (no open questions). → dispatch
   `/decompose-design`.
3. A `type:idea` issue, or a `type:design` at Stage `Designing` worth advancing. →
   dispatch `/refine-idea`.

Skip anything at Stage `Needs-input`, `Blocked`, or with unmet "Blocked by" — not
actionable. Sizing: a `size:L` ticket is never implemented directly — route it to
`/decompose-design` (or split it). One unit must fit one session.

If **nothing** is actionable, stop (optionally open a `type:idea` issue noting the
backlog is dry and could use new ideas).

## 3. Do the work

Invoke the matching stage skill (`/refine-idea`, `/decompose-design`, or
`/implement-ticket`) for the selected issue. Let that skill own its gates, its
Stage transitions, and its commit/merge. Pass relevant context first:

- **In-session (MCP available):** call `mcp__plugin_qmd_qmd__query` with
  `collections: ["meta","docs"]` — use lex + vec sub-queries.
- **CLI/cloud fallback:** `scripts/meta-context.sh "<topic of the item>"`

## 4. Doc-sync cadence (derived, cheap)

Doc-sync cadence is **derived** — no counter to maintain. Find the last doc-sync
and count tickets verified since:

```bash
git log --grep doc-sync -1 --format=%H            # last doc-sync commit (if any)
gh issue list --label type:ticket --state closed \
  --search "reason:completed" --json number,closedAt   # verified = closed completed
```

If ≥ 5 `type:ticket` issues reached `Verified` (closed completed) since the last
doc-sync commit, flag that a doc-sync + archive sweep is due (the doc-sync routine
handles it; do it now only if trivial).

## 5. Loop or stop

Implementation-first: after a unit completes, if actionable work remains and the
session budget allows, return to step 2 and advance the next-highest item —
favoring tickets ready to ship. When no actionable work remains or budget is spent,
**stop**. No `STATE.md` write-back; the board Stages, issue timelines, and commit
messages are the record. A brief end-of-session note is optional, only if useful.
