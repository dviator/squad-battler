# Tracker — GitHub Issues + Projects v2 (canonical pipeline reference)

The pipeline's work items live in **GitHub Issues**, organized on a **Projects v2
board**. This file is the single source of truth for *how to drive them* — every
pipeline skill reads it. Long-form knowledge (design bodies, feedback corpus,
policies) stays as markdown in the repo; see the split below.

> Migrated from the old file-based `backlog/` + `meta/STATE/INBOX/VERIFY` corpus
> on 2026-06-28 (see GitHub issue #5, the migration epic).

## Board coordinates

| Thing | Value |
|---|---|
| Repo | `dviator/squad-battler` |
| Project | **Squad Battler Pipeline** — number `1` — https://github.com/users/dviator/projects/1 |
| Project node id | `PVT_kwHOAGkbJ84Bb72k` |
| `Stage` field id | `PVTSSF_lAHOAGkbJ84Bb72kzhWocII` |

`Stage` single-select option ids:

| Stage | Option id | Meaning |
|---|---|---|
| Idea | `f331e7da` | captured idea, unrefined |
| Designing | `c7da8475` | being refined into a design |
| Needs-input | `fc4c0acf` | blocked on a Dan decision (also carries `needs-input` label) |
| Ready | `fb63b451` | actionable: refined design or todo ticket |
| In-progress | `29266e77` | being implemented |
| Shipped | `b383ac69` | merged; **awaiting playtest verification** |
| Verified | `90fc8807` | playtest-confirmed; issue is **closed** |
| Blocked | `7dea6d51` | blocked on another issue (`depends_on`) |
| Reverted | `714c47a8` | hard-eval failure backed out |

There is also a default `Status` field (Todo/In Progress/Done) — **ignore it**;
`Stage` is canonical.

## Labels

- **Type:** `type:idea`, `type:design`, `type:ticket`.
- **Priority:** `priority:1` (high), `priority:2` (normal), `priority:3` (low).
- **Size:** `size:S`, `size:M` (~one session), `size:L` (decompose first).
- **`needs-input`** — mirrors Stage `Needs-input`; this is Dan's review flag.

## The funnel

```
idea(issue) → design(issue + docs/designs/*.md) → ticket(issue) → code → shipped → verified(closed)
```

- **Idea** — `type:idea` issue, body holds the whole idea.
- **Design** — `type:design` issue is a *thin tracker* (status, open-questions,
  link); the long-form body is a markdown file in **`docs/designs/`**. The issue
  links the file; the file is the retrieval-searchable content.
- **Ticket** — `type:ticket` issue, body holds the whole ticket.
- **Feedback / policies** — stay markdown: `meta/feedback/`, `meta/policies.md`.

## Queues = board views / `gh` queries (replacing the old generated files)

| Old file | Now |
|---|---|
| `backlog/BACKLOG.md` | `gh issue list --state open` sorted by `priority:` / board "Backlog by priority" view |
| `meta/VERIFY.md` | `gh issue list --label type:ticket` filtered to Stage `Shipped` / "Recently shipped" view |
| `meta/INBOX.md` | `gh issue list --label needs-input` / "Needs your input" view |
| `meta/STATE.md` | derived: in-flight = Stage `In-progress`; history = commit log + issue timelines |

## gh recipes (canonical commands)

Helper for setting Stage on an issue (item must be on the board first):

```bash
OWNER=dviator; PROJ=1; PROJID=PVT_kwHOAGkbJ84Bb72k
SF=PVTSSF_lAHOAGkbJ84Bb72kzhWocII
stage_id() { case "$1" in
  Idea) echo f331e7da;; Designing) echo c7da8475;; Needs-input) echo fc4c0acf;;
  Ready) echo fb63b451;; In-progress) echo 29266e77;; Shipped) echo b383ac69;;
  Verified) echo 90fc8807;; Blocked) echo 7dea6d51;; Reverted) echo 714c47a8;; esac; }

set_stage() { # set_stage <issue-number> <Stage>
  local url="https://github.com/$OWNER/squad-battler/issues/$1"
  local item=$(gh project item-add "$PROJ" --owner "$OWNER" --url "$url" --format json \
                 | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
  gh project item-edit --id "$item" --field-id "$SF" --project-id "$PROJID" \
    --single-select-option-id "$(stage_id "$2")"
}
```

(`item-add` is idempotent — re-adding an item returns its existing id, so `set_stage`
is safe to call on an issue already on the board.)

| Operation | Command |
|---|---|
| Create a ticket | `gh issue create --title "..." --label "type:ticket,priority:N,size:X" --body-file f.md` then `set_stage <n> Ready` |
| Move to in-progress | `set_stage <n> In-progress` (+ `gh issue edit <n> --add-assignee @me`) |
| Mark shipped at merge | `set_stage <n> Shipped` + `gh issue comment <n> --body "shipped <sha>"` (do **not** close) |
| Verify | `set_stage <n> Verified` + `gh issue close <n> -r completed` |
| Raise needs-input | `gh issue edit <n> --add-label needs-input` + `set_stage <n> Needs-input` |
| Block | `set_stage <n> Blocked` (note the blocker `#m` in the body) |
| List verify queue | `gh issue list --label type:ticket --state open --json number,title,labels` then keep Stage=Shipped |
| List needs-input | `gh issue list --label needs-input --state open` |

**Commit linkage:** reference the issue with `Refs #N` (or `Part of #N`) — **never
`Fixes #N`/`Closes #N`**, which auto-close at merge. Shipped ≠ done; an issue closes
only when it reaches `Verified`.

## Gotchas

- macOS ships bash 3.2 — **no associative arrays**; use the `case` mapping above.
- `gh project create --format json` is broken in gh 2.87.x — create projects via
  `gh api graphql` `createProjectV2` if a new project is ever needed.
- Cron/headless runs need a `GH_TOKEN` with `repo` + `project` scope in the
  environment (no interactive login in the ephemeral clone).
