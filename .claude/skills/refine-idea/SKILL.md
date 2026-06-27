---
name: refine-idea
description: Turn a rough idea (or a draft design) into a ready, implementable design doc — or mark it needs-input when a human decision is required. Checks the idea against the design framework, pulls relevant prior feedback, and writes a design under backlog/designs. Use when advancing an idea/draft, or invoked by /dev-tick.
---

# /refine-idea — idea → design

Turn one rough thought into a `ready` design, or surface a clean blocker. Pick the
idea from `$ARGUMENTS` if given, else the highest-value idea/draft from the backlog.

## Steps

1. **Read the source.** The `backlog/ideas/<slug>.md` file (lightweight, no
   frontmatter) or the `backlog/designs/<id>.md` draft.

2. **Load context.**
   - `docs/DESIGN_FRAMEWORK.md` — the design constitution: tone, pillars, scope,
     idea-evaluation criteria, and the **required questions** + **open design
     questions**.
   - `meta/policies.md` and `scripts/meta-context.sh "<idea topic>"` — relevant
     prior feedback and related designs, so this builds on past steering.

3. **Evaluate against the framework.** Is it in scope, on-tone, and does it have a
   clear player experience + at least one concrete acceptance criterion? Apply the
   "ready to action" vs "needs more refinement" tests from DESIGN_FRAMEWORK.

4. **Branch:**
   - **Needs a human decision** (game feel, balance numbers, or new content —
     species/mutations/items that a human must name; or it touches an open design
     question): write the design with `status: needs-input`, fill the **Open
     Questions** section precisely, add a `[NEEDS-INPUT]` entry to `meta/INBOX.md`,
     and fire a `PushNotification`. **Do not guess.** (See policies / autonomy
     boundaries.)
   - **Ready:** write `backlog/designs/<id>.md` from `backlog/designs/TEMPLATE.md`
     with `status: ready`, all sections filled, `feedback_refs` set to any feedback
     ids that shaped it, concrete testable acceptance criteria.

5. **Graduate the idea.** If the source was a `backlog/ideas/*.md` file, **delete
   it** — its content now lives in the design. (Discard rather than graduate only
   if the idea is clearly out of scope; note why in the tick log.)

6. **Update** `BACKLOG.md` and `meta/STATE.md`. If you wrote a `ready` design,
   leave it for `/decompose-design` (don't decompose in the same fire unless
   trivial and budget allows).

Naming: design ids are `design-NNN-short-slug` (next free number). Keep the slug
stable — tickets reference it as `parent`.
