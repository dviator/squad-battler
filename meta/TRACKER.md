# Tracker — GitHub Issues + Projects v2 (canonical pipeline reference)

The pipeline's work items live in **GitHub Issues**, organized on a **Projects v2
board**. This file is the single source of truth for *how to drive them* — every
pipeline skill reads it. Long-form knowledge (design bodies, feedback corpus,
policies) stays as markdown in the repo; see the split below.

> **2026-06-30 — board rationalization.** All status/classifier data moved off
> labels and the prose preamble into **Projects v2 fields** (`Type`, `Stage`,
> `Priority`, `Size`, `Depends on`). The old `type:`/`priority:`/`size:`/`needs-input`
> labels and the default `Status` field are retired. Each fact now has exactly one
> home: a field, a native sub-issue link, or the issue body. See "Data model" below.
>
> Migrated from the old file-based corpus on 2026-06-28 (issue #5, migration epic).

## Data model — one fact, one home

| Axis | Home | Values |
|---|---|---|
| **Type** | `Type` field | `Idea` · `Design` · `Ticket` |
| **Stage** | `Stage` field | per-type, below |
| **Priority** | `Priority` field | `1` (high) · `2` (normal) · `3` (low) |
| **Size** | `Size` field | `S` · `M` · `L` (`L` = decompose first) |
| **Parent** (design → its tickets) | **native sub-issues** | — |
| **Dependencies** (ticket → ticket) | `Depends on` text field | e.g. `#17, #18` |
| **Description** | issue **body** | no metadata preamble — body is *only* the content |

`Type` and `Stage` are **disjoint sub-pipelines**: an idea never reaches ticket
stages. Each `Stage` value belongs to exactly one `Type`, except `Needs-input`,
the one shared "blocked on Dan" state. Board views are type-scoped, so the two
axes never collide in practice.

```
Idea:    Backlog → Refining → Needs-input        (→ spawns a Design issue)
Design:  Drafting → Needs-input → Decomposed      (→ spawns Ticket issues)
Ticket:  Ready → In-progress → Blocked → Shipped → Verified   (Reverted on hard-eval backout)
```

- **Idea** — `Type=Idea` issue, body holds the whole idea. `Backlog` = available to
  flesh out; `Refining` = being turned into a design.
- **Design** — `Type=Design` issue is a *thin tracker*; the long-form body is a
  markdown file in **`docs/designs/`**, linked from the issue's first line
  (`**Design doc:** \`docs/designs/…\``). `Decomposed` = tickets created.
- **Ticket** — `Type=Ticket` issue, body holds the whole ticket. `Shipped` = merged,
  **awaiting playtest verification**; `Verified` = playtest-confirmed, issue closed.
- **Feedback / policies** — stay markdown: `meta/feedback/`, `meta/policies.md`.

> **Labels are retired** for pipeline meaning. The defunct `type:*`/`priority:*`/
> `size:*`/`needs-input` label *definitions* still exist (deleted in the skill-migration
> pass) but carry no status. Labels are free for ad-hoc tags only.

## Board coordinates

| Thing | Value |
|---|---|
| Repo | `dviator/squad-battler` |
| Project | **Squad Battler Pipeline** — number `1` — https://github.com/users/dviator/projects/1 |
| Project node id | `PVT_kwHOAGkbJ84Bb72k` |

Field ids and single-select option ids:

| Field | Field id | Options (`name` → `optionId`) |
|---|---|---|
| `Type` | `PVTSSF_lAHOAGkbJ84Bb72kzhWyxAo` | Idea `82eedc5b` · Design `dbb9f149` · Ticket `a42145ab` |
| `Stage` | `PVTSSF_lAHOAGkbJ84Bb72kzhWyxAE` | Backlog `1fa6cbfc` · Refining `1728a6f8` · Drafting `dedd1805` · Needs-input `9d47e97e` · Decomposed `2abd024c` · Ready `002565ca` · In-progress `741328c5` · Blocked `674d83ab` · Shipped `412615df` · Verified `5a11c81f` · Reverted `571905a0` |
| `Priority` | `PVTSSF_lAHOAGkbJ84Bb72kzhWyxC8` | 1 `a5cb227e` · 2 `3f426ea8` · 3 `23452f2e` |
| `Size` | `PVTSSF_lAHOAGkbJ84Bb72kzhWyxD0` | S `1f6dd80b` · M `4dc4093f` · L `feb1fc5d` |
| `Depends on` | `PVTF_lAHOAGkbJ84Bb72kzhWyxD4` | *(free text, e.g. `#17, #18`)* |

The built-in `Status` field (Todo/In Progress/Done) **cannot be deleted** (GitHub
only deletes custom fields) — it is excluded from every view, so ignore it.

## Queues = board views (Dan-facing) / one read query (Claude-facing)

Dan's board views (configure once in the Projects UI; native filter/sort, zero cost):

| View | Filter | Sort | Dan's action |
|---|---|---|---|
| **Verification Queue** | `Type=Ticket` ∧ `Stage=Shipped` | `Priority` ↑ | drag card → `Verified` |
| **Designs needing input** | `Type=Design` ∧ `Stage=Needs-input` | `Priority` ↑ | answer → Claude advances it |
| **Ideas to flesh out** | `Type=Idea` ∧ `Stage=Backlog` | `Priority` ↑ | pick one to refine |
| **Dev Pipeline** | `Type=Ticket` | group by `Stage`, `Priority` ↑ | watch / drag |

Claude reads the **whole board in one query** and filters client-side (see below).

## API recipes — the API is cheap at this scale

The Projects v2 API has **no server-side field filtering** and `gh issue create`
**can't set fields inline** — but GraphQL batches, so it doesn't bite: read the
whole board in **one query**; set many fields / advance many items in **one request**
via aliased mutations.

### Read the whole board (one query, filter with jq/python)

```bash
gh api graphql -f query='
{ node(id:"PVT_kwHOAGkbJ84Bb72k"){ ... on ProjectV2 { items(first:100){ nodes {
    id
    fieldValues(first:20){ nodes {
      ... on ProjectV2ItemFieldSingleSelectValue { name field{ ... on ProjectV2FieldCommon{ name } } }
      ... on ProjectV2ItemFieldTextValue        { text field{ ... on ProjectV2FieldCommon{ name } } }
    }}
    content{ ... on Issue {
      number title state
      parent{ number }
      subIssues(first:50){ totalCount nodes{ number state } }
    }}
}}}}}'
```

`gh project item-list 1 --owner dviator --format json` is the quick equivalent: it
flattens each single-select field to a lowercased top-level key (`type`, `stage`,
`priority`, `size`) plus `depends on`, alongside `content` and `labels`.

### Bash helpers (drop into a skill)

macOS ships bash 3.2 — **no associative arrays**; use `case` maps.

```bash
OWNER=dviator; PROJ=1; PROJID=PVT_kwHOAGkbJ84Bb72k
F_TYPE=PVTSSF_lAHOAGkbJ84Bb72kzhWyxAo
F_STAGE=PVTSSF_lAHOAGkbJ84Bb72kzhWyxAE
F_PRIO=PVTSSF_lAHOAGkbJ84Bb72kzhWyxC8
F_SIZE=PVTSSF_lAHOAGkbJ84Bb72kzhWyxD0
F_DEPS=PVTF_lAHOAGkbJ84Bb72kzhWyxD4

type_id()  { case "$1" in Idea) echo 82eedc5b;; Design) echo dbb9f149;; Ticket) echo a42145ab;; esac; }
stage_id() { case "$1" in
  Backlog) echo 1fa6cbfc;; Refining) echo 1728a6f8;; Drafting) echo dedd1805;;
  Needs-input) echo 9d47e97e;; Decomposed) echo 2abd024c;; Ready) echo 002565ca;;
  In-progress) echo 741328c5;; Blocked) echo 674d83ab;; Shipped) echo 412615df;;
  Verified) echo 5a11c81f;; Reverted) echo 571905a0;; esac; }
prio_id()  { case "$1" in 1) echo a5cb227e;; 2) echo 3f426ea8;; 3) echo 23452f2e;; esac; }
size_id()  { case "$1" in S) echo 1f6dd80b;; M) echo 4dc4093f;; L) echo feb1fc5d;; esac; }

item_id() { # item_id <issue#>  — item-add is idempotent (returns existing id)
  gh project item-add "$PROJ" --owner "$OWNER" \
    --url "https://github.com/$OWNER/squad-battler/issues/$1" --format json \
    | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])"
}

set_select() { # set_select <itemId> <fieldId> <optionId>
  gh api graphql -f query="mutation{ updateProjectV2ItemFieldValue(input:{
    projectId:\"$PROJID\",itemId:\"$1\",fieldId:\"$2\",value:{singleSelectOptionId:\"$3\"}
  }){ projectV2Item{ id } } }" >/dev/null
}
set_text() {   # set_text <itemId> <fieldId> "<text>"
  gh api graphql -f query="mutation{ updateProjectV2ItemFieldValue(input:{
    projectId:\"$PROJID\",itemId:\"$1\",fieldId:\"$2\",value:{text:\"$3\"}
  }){ projectV2Item{ id } } }" >/dev/null
}
set_stage() { set_select "$(item_id "$1")" "$F_STAGE" "$(stage_id "$2")"; }  # set_stage <issue#> <Stage>
```

### Operations

| Operation | Recipe |
|---|---|
| Create a ticket | `gh issue create --title "…" --body-file f.md` → `it=$(item_id <n>)` → one batched mutation setting `Type=Ticket`, `Stage=Ready`, `Priority`, `Size` → `addSubIssue` under its design |
| Set all fields at once | one `gh api graphql` mutation with aliased `updateProjectV2ItemFieldValue` calls (one alias per field) |
| Move to in-progress | `set_stage <n> In-progress` (+ `gh issue edit <n> --add-assignee @me`) |
| Mark shipped at merge | `set_stage <n> Shipped` + `gh issue comment <n> --body "shipped <sha>"` — do **not** close |
| Block on a dep | `set_stage <n> Blocked`; record the blocker in the `Depends on` field |
| Raise needs-input | `set_stage <n> Needs-input` (no label — the Stage *is* the flag) |
| Verify | `set_stage <n> Verified` + `gh issue close <n> -r completed` |
| Link ticket under design | `addSubIssue(input:{issueId:<designNodeId>, subIssueId:<ticketNodeId>})` (node ids via `gh issue view <n> --json id`) |

Batched multi-field / multi-item example (one HTTP request):

```bash
gh api graphql -f query='mutation {
  t: updateProjectV2ItemFieldValue(input:{projectId:"…",itemId:"…",fieldId:"…TYPE",  value:{singleSelectOptionId:"a42145ab"}}){projectV2Item{id}}
  s: updateProjectV2ItemFieldValue(input:{projectId:"…",itemId:"…",fieldId:"…STAGE", value:{singleSelectOptionId:"002565ca"}}){projectV2Item{id}}
  p: updateProjectV2ItemFieldValue(input:{projectId:"…",itemId:"…",fieldId:"…PRIO",  value:{singleSelectOptionId:"a5cb227e"}}){projectV2Item{id}}
}'
```

> Keep batches modest — a single request with ~60 aliased mutations dropped its
> tail once; ≤ ~25 mutations per request applied cleanly. Split larger migrations.

**Commit linkage:** reference the issue with `Refs #N` (or `Part of #N`) — **never
`Fixes #N`/`Closes #N`**, which auto-close at merge. Shipped ≠ done; an issue closes
only when it reaches `Verified`.

## Gotchas

- macOS ships bash 3.2 — **no associative arrays**; use the `case` maps above.
- Run `gh` from inside the repo checkout, or pass `-R dviator/squad-battler` —
  outside a git dir, `gh issue view/edit` fail with "not a git repository".
- `gh project field-delete` only removes **custom** fields; the built-in `Status`
  field can't be deleted (exclude it from views instead).
- Native **Issue Types** (`type:` server-side filter) are an **org-only** feature —
  unavailable on this user-owned repo, which is why `Type` is a project field.
- Field changes **don't close issues**: moving a ticket to `Verified` needs a
  matching `gh issue close` (the verify step / a sync does this).
- `gh project create --format json` is broken in gh 2.87.x — create projects via
  `gh api graphql` `createProjectV2` if a new project is ever needed.
- Cron/headless runs need a `GH_TOKEN` with `repo` + `project` scope in the
  environment (no interactive login in the ephemeral clone).
