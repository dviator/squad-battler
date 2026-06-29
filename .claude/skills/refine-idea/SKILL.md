---
name: refine-idea
description: Turn a type:idea issue (or an in-progress design) into a ready, implementable design — a markdown body under docs/designs/ plus a thin type:design tracking issue — or set it Needs-input when a human decision is required. Checks the idea against the design framework and pulls relevant prior feedback. Use when advancing an idea, or invoked by /dev-tick.
---

# /refine-idea — idea → design

Turn one rough thought into a `Ready` design, or surface a clean blocker. Pick the
idea from `$ARGUMENTS` (an issue number) if given, else the highest-value
`type:idea` issue / `Designing` design from the board.

`meta/TRACKER.md` is canonical for board coordinates, Stage ids, labels, and `gh`
recipes; source the `set_stage`/`stage_id` helpers from it.

## Steps

1. **Read the source.** `gh issue view <n>` — a `type:idea` issue (whole idea in
   the body) or an in-progress `type:design` issue (thin tracker + its
   `docs/designs/*.md` body).

2. **Load context.**
   - `docs/DESIGN_FRAMEWORK.md` — the design constitution: tone, pillars, scope,
     idea-evaluation criteria, and the **required questions** + **open design
     questions**.
   - `meta/policies.md` — durable steering lessons.
   - Relevant prior feedback and related designs:
     - **In-session (MCP available):** call `mcp__plugin_qmd_qmd__query` with
       `collections: ["meta","docs"]` — use lex + vec sub-queries.
     - **CLI/cloud fallback:** `scripts/meta-context.sh "<idea topic>"`

3. **Evaluate against the framework.** Is it in scope, on-tone, and does it have a
   clear player experience + at least one concrete acceptance criterion? Apply the
   "ready to action" vs "needs more refinement" tests from DESIGN_FRAMEWORK.

4. **Open/locate the design issue.** A design is a *thin* `type:design` issue
   (status, open-questions, link to the file) plus a long-form markdown body in
   `docs/designs/`. If refining a `type:idea`, create the design issue and set its
   Stage `Designing`; if resuming, reuse the existing one.
   ```bash
   gh issue create --title "design: <slug>" --label "type:design,priority:N" \
     --body "Design body: docs/designs/design-NNN-slug.md
   Status: designing
   Refines #<idea-issue>"
   set_stage <design-n> Designing
   ```

5. **Branch:**
   - **Needs a human decision** (game feel, balance numbers, or new content —
     species/mutations/items a human must name; or it touches an open design
     question): write what's decided into `docs/designs/design-NNN-slug.md`, fill
     its **Open Questions** precisely, mirror those questions into the design
     issue body, then raise the flag — **do not guess**:
     ```bash
     gh issue edit <design-n> --add-label needs-input
     set_stage <design-n> Needs-input
     ```
     This replaces the old INBOX post; `label:needs-input` is Dan's review queue.
     - **Carve out the decided slice.** Before stopping, check whether part of the
       design is fully decided and needs **no** creative input — typically the
       engineering/structural foundation the content later slots into. If so,
       create that slice as its own actionable `type:ticket` issue now (`Refs
       #<design-n>`, no blockers), strictly limited to what needs no human
       decision; leave content-dependent work as tickets `Blocked by` the open
       questions. This keeps the loop producing while creative input is pending.
       See `meta/feedback/feedback-001-carve-actionable-slices.md`.
   - **Ready:** write the full `docs/designs/design-NNN-slug.md` (all sections,
     concrete testable acceptance criteria; reference any feedback ids that shaped
     it), keep the design issue body's link/status current, then `set_stage
     <design-n> Ready`.

6. **Graduate the idea.** If the source was a `type:idea` issue, close it as
   superseded once its content lives in the design — `gh issue close <idea-n> -r
   "not planned" --comment "refined into #<design-n>"`. (Close as not-planned
   without a design only if clearly out of scope; note why in the close comment.)

A `Ready` design is left for `/decompose-design` — don't decompose in the same
fire unless trivial and budget allows. Design file names are
`design-NNN-short-slug` (next free number); keep the slug stable — tickets
reference the design issue.
