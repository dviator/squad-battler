---
name: capture-feedback
description: Capture user feedback into the curated corpus so future autonomous sessions get the right context. Handles two kinds — steering feedback (how Claude should work, distilled into policies) and playtest feedback on a shipped ticket (tied back to the ticket, verifying it or spawning a follow-up). Use whenever the user gives feedback on the work or the process.
---

# /capture-feedback — feedback intake

The single intake for all feedback. Turn what the user said into durable, curated
context. Take the feedback from `$ARGUMENTS` / the conversation.

## 1. Classify

- **steering** — guidance on *how Claude should work* (process, code style,
  priorities, what to ask vs decide). Applies broadly.
- **playtest** — reaction to a *shipped change* (game feel, balance, a bug). Ties
  to a specific ticket in its verification window.

## 2. Write the feedback file

Create `meta/feedback/feedback-NNN-short-slug.md` from
`meta/feedback/TEMPLATE.md`. Capture what was said faithfully, why it matters, and
how to apply it. Set `kind`, `tags`, `created`. For `playtest` also set `ticket`
and `sentiment`.

## 3. Wire it in

**Steering:**
- Add a one-line lesson to `meta/policies.md` under the right heading, linking the
  file as `[[feedback-NNN-short-slug]]`. Keep policies tight — durable lessons only.
- Add `feedback_refs` to any open backlog items the lesson should shape.

**Playtest:**
- Add this feedback id to the target ticket's `feedback_refs`, and append a short
  note to the ticket body (the verification trail).
- **Positive / confirms it works** → set the ticket `status: verified` (now
  archivable). 
- **Negative / reveals a problem** → spawn a follow-up `todo` ticket (link it via
  `depends_on`/parent and note the cause), or reopen to `todo` if it's a direct
  fix. Never silently rewrite shipped history.

## 4. Refresh retrieval & state

- Refresh the search index so the new feedback is immediately searchable:
  run `qmd update && qmd embed` (updates BM25 + regenerates vectors). The MCP
  plugin reads from the same index — no extra step needed there. The `grep`
  fallback needs no step.
- Update `meta/STATE.md` tick log and `BACKLOG.md` if ticket statuses changed.
- Clear the corresponding `meta/INBOX.md` entry once handled.
