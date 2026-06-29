---
name: verify-queue
description: Show the playtest verification queue — open type:ticket issues at Stage Shipped — each with its Playtest criteria, oldest first, then collect Dan's inline verdicts and apply them via the capture-feedback playtest path (verified → close; needs-work → linked follow-up). Use when Dan wants to run through what's awaiting playtest.
---

# /verify-queue — the playtest queue

Present everything awaiting playtest verification and apply Dan's verdicts. This
generates no files — it queries the board live. `meta/TRACKER.md` is canonical for
board coordinates, Stage ids, and `gh` recipes; source `set_stage`/`stage_id` from it.

## 1. Build the queue

List open `type:ticket` issues and keep those at Stage `Shipped`, **oldest shipped
first** (the longest-waiting verification leads):

```bash
gh issue list --label type:ticket --state open \
  --json number,title,createdAt,labels
```

Stage lives on the board, so filter to `Shipped` via the project (or the "Recently
shipped" board view named in `meta/TRACKER.md`). For each, read its body for the
`## Playtest` criteria and its `shipped <sha>` comment.

## 2. Present each, oldest first

For every shipped ticket, show:
- `#<n> — <title>`
- its `## Playtest` criteria (what to look for)
- the shipped sha / date, so Dan knows what build to check.

Ask Dan for an inline verdict per ticket: **verified** or **needs-work** (with a
note on what's wrong).

## 3. Apply verdicts via the capture-feedback playtest path

For each verdict, route through `/capture-feedback`'s playtest path:
- **verified** → comment the verdict, `set_stage <n> Verified`, `gh issue close <n>
  -r completed`.
- **needs-work** → comment the cause on `#<n>` (leave it `Shipped` — never rewrite
  shipped history) and spawn a linked follow-up: a `type:ticket` (`Refs #<n>`,
  `set_stage Ready`) for a clear fix, or a `type:idea` (`Refs #<n>`) for a fuzzier
  problem.

Stop when the queue is exhausted or Dan is done. The board Stages and issue
timelines are the durable record — nothing else to write back.
