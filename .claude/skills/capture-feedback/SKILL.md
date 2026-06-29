---
name: capture-feedback
description: Capture user feedback into durable context. Two paths — steering feedback (how Claude should work, distilled into meta/policies.md + a feedback file) and playtest feedback on a shipped ticket issue (commented onto the issue, verifying it to closed or spawning a linked follow-up). Use whenever the user gives feedback on the work or the process.
---

# /capture-feedback — feedback intake

The single intake for all feedback. Take the feedback from `$ARGUMENTS` / the
conversation, classify it, and route it. `meta/TRACKER.md` is canonical for board
coordinates, Stage ids, and `gh` recipes; source `set_stage`/`stage_id` from it.

## 1. Classify

- **steering** — guidance on *how Claude should work* (process, code style,
  priorities, what to ask vs decide). Applies broadly. → markdown corpus.
- **playtest** — reaction to a *shipped change* (game feel, balance, a bug). Ties
  to a specific `type:ticket` issue in its `Shipped` verification window. → the issue.

## 2a. Steering path (unchanged markdown corpus)

- Create `meta/feedback/feedback-NNN-short-slug.md` from
  `meta/feedback/TEMPLATE.md`. Capture what was said faithfully, why it matters,
  and how to apply it. Set `kind: steering`, `tags`, `created`.
- Add a one-line lesson to `meta/policies.md` under the right heading, linking the
  file as `[[feedback-NNN-short-slug]]`. Keep policies tight — durable lessons only.
- Refresh retrieval so it's searchable: `qmd update && qmd embed` (BM25 +
  vectors). The MCP plugin and the `grep` fallback need no extra step.

## 2b. Playtest path (on the shipped ticket issue)

1. **Record the verdict** on the issue — this is the verification trail:
   ```bash
   gh issue comment <n> --body "playtest: <what Dan observed / verdict>"
   ```
2. **Positive / confirms it works** → verify and close:
   ```bash
   set_stage <n> Verified
   gh issue close <n> -r completed
   ```
3. **Negative / reveals a problem** → leave the original at Stage `Shipped` (never
   silently rewrite shipped history) and spawn a linked follow-up:
   - A direct, well-understood fix → a new `type:ticket` issue, `Refs #<n>`, noting
     the cause; `set_stage <new> Ready` (or `Blocked` if it depends on other work).
   - A fuzzier / design-level problem → a new `type:idea` issue, `Refs #<n>`, for
     `/refine-idea` to pick up.

Optionally refresh retrieval (`qmd update && qmd embed`) if the steering corpus
changed. The board Stages and issue timelines are the durable record — there is no
state file or verify file to update.
