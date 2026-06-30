# Tracker — GitHub Issues + Projects v2 (canonical pipeline reference)

Work items are **GitHub Issues** on **Projects v2 board #1**. This file is how to
drive them. Long-form knowledge stays markdown: design bodies in `docs/designs/`,
feedback in `meta/feedback/`, policies in `meta/policies.md`.

## Data model — one fact, one home

| Axis | Home | Values |
|---|---|---|
| **Type** | `Type` field | `Idea` · `Design` · `Ticket` |
| **Stage** | built-in **`Status`** field (JSON key `status`) | per-type, below |
| **Priority** | `Priority` field | `1` (high) · `2` (normal) · `3` (low) |
| **Size** | `Size` field | `S` · `M` · `L` (`L` = decompose first) |
| **Parent** (design → its tickets) | native **sub-issues** | — |
| **Dependencies** (ticket → ticket) | `Depends on` text field | e.g. `#17, #18` |
| **Description** | issue **body** | content only — no metadata preamble |

Stage lives in GitHub's mandatory **`Status`** field (its options were set to the
Stage values). It shows as "Status" in the UI and is the `status` key in JSON.
Never add a second "Stage" field. Labels carry no pipeline meaning.

`Type` and `Stage` are disjoint sub-pipelines — each Stage belongs to one Type,
except `Needs-input` (shared "blocked on Dan" state). Views are type-scoped.

```
Idea:    Backlog → Refining → Needs-input        (→ spawns a Design issue)
Design:  Drafting → Needs-input → Decomposed      (→ spawns Ticket issues)
Ticket:  Ready → In-progress → Blocked → Shipped → Verified   (Reverted on hard-eval backout)
```

- **Idea** — body holds the idea. `Backlog` = available to flesh out; `Refining` = being designed.
- **Design** — thin tracker; long-form body is a `docs/designs/*.md` file linked from the
  issue's first line (`**Design doc:** \`…\``). `Decomposed` = tickets created.
- **Ticket** — body holds the ticket. `Shipped` = merged, awaiting playtest; `Verified` = closed.

## Board coordinates

| Thing | Value |
|---|---|
| Repo | `dviator/squad-battler` |
| Project node id | `PVT_kwHOAGkbJ84Bb72k` (board #1, https://github.com/users/dviator/projects/1) |

| Field | Field id | Options (`name` → `optionId`) |
|---|---|---|
| `Type` | `PVTSSF_lAHOAGkbJ84Bb72kzhWyxAo` | Idea `82eedc5b` · Design `dbb9f149` · Ticket `a42145ab` |
| `Stage` (built-in `Status`) | `PVTSSF_lAHOAGkbJ84Bb72kzhWocFc` | Backlog `31e713bd` · Refining `5d98f4d0` · Drafting `a0fd1898` · Needs-input `df5c9074` · Decomposed `b278d8f2` · Ready `97875312` · In-progress `25425956` · Blocked `e93ff775` · Shipped `415d287c` · Verified `1f42d806` · Reverted `ff3d628c` |
| `Priority` | `PVTSSF_lAHOAGkbJ84Bb72kzhWyxC8` | 1 `a5cb227e` · 2 `3f426ea8` · 3 `23452f2e` |
| `Size` | `PVTSSF_lAHOAGkbJ84Bb72kzhWyxD0` | S `1f6dd80b` · M `4dc4093f` · L `feb1fc5d` |
| `Depends on` | `PVTF_lAHOAGkbJ84Bb72kzhWyxD4` | *(free text)* |

## Board views (Dan-facing)

Configure once in the Projects UI. The Stage axis is the field labelled **"Status"**.

| View | Filter | Sort | Dan's action |
|---|---|---|---|
| **Verification Queue** | `Type=Ticket` ∧ `Status=Shipped` | `Priority` ↑ | drag → `Verified` |
| **Designs needing input** | `Type=Design` ∧ `Status=Needs-input` | `Priority` ↑ | answer → Claude advances |
| **Ideas to flesh out** | `Type=Idea` ∧ `Status=Backlog` | `Priority` ↑ | pick one to refine |
| **Dev Pipeline** | `Type=Ticket` | group by `Status`, `Priority` ↑ | watch / drag |

## API recipes

No server-side field filtering; `gh issue create` can't set fields inline. Read the
whole board in one query and filter client-side; batch writes with aliased mutations.

### Read the whole board (one query)

```bash
gh api graphql -f query='
{ node(id:"PVT_kwHOAGkbJ84Bb72k"){ ... on ProjectV2 { items(first:100){ nodes {
    id
    fieldValues(first:20){ nodes {
      ... on ProjectV2ItemFieldSingleSelectValue { name field{ ... on ProjectV2FieldCommon{ name } } }
      ... on ProjectV2ItemFieldTextValue        { text field{ ... on ProjectV2FieldCommon{ name } } }
    }}
    content{ ... on Issue { number title state parent{ number } subIssues(first:50){ nodes{ number state } } } }
}}}}}'
```

`gh project item-list 1 --owner dviator --format json` is the quick equivalent: each
single-select flattens to a lowercased key (`type`, `status` ← the Stage, `priority`,
`size`) plus `depends on`, alongside `content` and `labels`.

### Bash helpers (bash 3.2 — no associative arrays)

```bash
OWNER=dviator; PROJ=1; PROJID=PVT_kwHOAGkbJ84Bb72k
F_TYPE=PVTSSF_lAHOAGkbJ84Bb72kzhWyxAo
F_STAGE=PVTSSF_lAHOAGkbJ84Bb72kzhWocFc   # built-in Status field
F_PRIO=PVTSSF_lAHOAGkbJ84Bb72kzhWyxC8
F_SIZE=PVTSSF_lAHOAGkbJ84Bb72kzhWyxD0
F_DEPS=PVTF_lAHOAGkbJ84Bb72kzhWyxD4

type_id()  { case "$1" in Idea) echo 82eedc5b;; Design) echo dbb9f149;; Ticket) echo a42145ab;; esac; }
stage_id() { case "$1" in
  Backlog) echo 31e713bd;; Refining) echo 5d98f4d0;; Drafting) echo a0fd1898;;
  Needs-input) echo df5c9074;; Decomposed) echo b278d8f2;; Ready) echo 97875312;;
  In-progress) echo 25425956;; Blocked) echo e93ff775;; Shipped) echo 415d287c;;
  Verified) echo 1f42d806;; Reverted) echo ff3d628c;; esac; }
prio_id()  { case "$1" in 1) echo a5cb227e;; 2) echo 3f426ea8;; 3) echo 23452f2e;; esac; }
size_id()  { case "$1" in S) echo 1f6dd80b;; M) echo 4dc4093f;; L) echo feb1fc5d;; esac; }

item_id() { # item_id <issue#>  — item-add is idempotent (returns existing id)
  gh project item-add "$PROJ" --owner "$OWNER" \
    --url "https://github.com/$OWNER/squad-battler/issues/$1" --format json \
    | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])"
}
set_select() { # <itemId> <fieldId> <optionId>
  gh api graphql -f query="mutation{ updateProjectV2ItemFieldValue(input:{
    projectId:\"$PROJID\",itemId:\"$1\",fieldId:\"$2\",value:{singleSelectOptionId:\"$3\"}
  }){ projectV2Item{ id } } }" >/dev/null
}
set_text() { # <itemId> <fieldId> "<text>"
  gh api graphql -f query="mutation{ updateProjectV2ItemFieldValue(input:{
    projectId:\"$PROJID\",itemId:\"$1\",fieldId:\"$2\",value:{text:\"$3\"}
  }){ projectV2Item{ id } } }" >/dev/null
}
set_stage() { set_select "$(item_id "$1")" "$F_STAGE" "$(stage_id "$2")"; }  # <issue#> <Stage>
```

### Operations

| Operation | Recipe |
|---|---|
| Create a ticket | `gh issue create --title "…" --body-file f.md` → `item_id <n>` → one batched mutation setting `Type=Ticket`/`Stage=Ready`/`Priority`/`Size` → `addSubIssue` under its design |
| Set many fields/items at once | one `gh api graphql` mutation, one aliased `updateProjectV2ItemFieldValue` per field (keep ≤ ~25 per request) |
| Move to in-progress | `set_stage <n> In-progress` (+ `gh issue edit <n> --add-assignee @me`) |
| Mark shipped at merge | `set_stage <n> Shipped` + `gh issue comment <n> --body "shipped <sha>"` — do **not** close |
| Block on a dep | `set_stage <n> Blocked`; record the blocker in `Depends on` |
| Raise needs-input | `set_stage <n> Needs-input` (the Stage is the flag — no label) |
| Verify | `set_stage <n> Verified` + `gh issue close <n> -r completed` (field changes don't auto-close) |
| Link ticket under design | `addSubIssue(input:{issueId:<designNodeId>, subIssueId:<ticketNodeId>})` (node ids via `gh issue view <n> --json id`) |

Batched multi-field example (one request):

```bash
gh api graphql -f query='mutation {
  t: updateProjectV2ItemFieldValue(input:{projectId:"…",itemId:"…",fieldId:"…TYPE",  value:{singleSelectOptionId:"a42145ab"}}){projectV2Item{id}}
  s: updateProjectV2ItemFieldValue(input:{projectId:"…",itemId:"…",fieldId:"…STAGE", value:{singleSelectOptionId:"97875312"}}){projectV2Item{id}}
  p: updateProjectV2ItemFieldValue(input:{projectId:"…",itemId:"…",fieldId:"…PRIO",  value:{singleSelectOptionId:"a5cb227e"}}){projectV2Item{id}}
}'
```

**Commit linkage:** reference issues with `Refs #N` / `Part of #N` — **never** `Fixes/Closes #N`
(auto-closes at merge; shipped ≠ done — an issue closes only at `Verified`).

## Gotchas

- Run `gh` from inside the checkout, or pass `-R dviator/squad-battler` (outside a git
  dir, `gh issue view/edit` fail with "not a git repository").
- The built-in `Status` field can't be deleted or renamed — it *is* the Stage. Don't
  add a second Stage field.
- SSH (port 22) may be blocked; push over HTTPS:
  `git push "https://x-access-token:$(gh auth token)@github.com/dviator/squad-battler.git" HEAD:main`.
- Cron/headless runs need a `GH_TOKEN` with `repo` + `project` scope.
