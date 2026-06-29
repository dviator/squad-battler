---
id: feedback-006-verification-never-gates
kind: steering
created: 2026-06-28
ticket: ticket-007-shop-sequence-combat-first
sentiment:
tags: [pipeline, throughput, verification, push-gates, autonomy]
---

# Feedback: verification never gates development — automated checks are the only push gate

## What was said

I had implemented and eval'd ticket-007 but then *held the merge to main*, citing a
git-divergence concern and Dan's in-flight pipeline WIP. Dan: "You don't ever need
to hold new tickets for past verification, let's not let verification bottleneck
development. My verification is for steering, error correction, and developing the
game design through hands-on playtesting. The automated checks are the only thing
that should gate you pushing to the repo. If those leave the app in a bad state then
when I detect that our next step is to improve push gates so that it doesn't happen
again."

## Why it matters

Holding shipped work for human review serializes development on Dan's availability —
exactly the bottleneck the autonomous pipeline exists to remove. Dan's role is
*steering*, not *approval*: he playtests to correct course and evolve the game
design, after the work is in. The trust model is: **the automated gate (`/eval` —
typecheck + test + balance hard gates, plus `web:build` for web work) is the sole
arbiter of whether code is good enough to push.** If something bad still gets
through, that's a signal to *harden the gate* (add a check/test), not to add a human
approval step. Fix-forward, gate-forward.

This also resolves the specific mistake: a concurrent writer (the doc-sync routine)
advancing `origin/main` is NOT a reason to hold — it's a routine rebase. Rebase onto
`origin/main`, re-run `/eval`, `merge --ff-only`, push. The merge is the one
integration gate for concurrent writers, and it's mechanical, not a judgment call.

## How to apply

- After `/eval` passes on the branch, **integrate and push** — never hold a ticket
  for playtest/verification or for human sign-off. Shipped ≠ approved; it enters a
  playtest window that runs *in parallel* with continued development.
- A moved `origin/main` (another writer, a cloud routine) → `git fetch` +
  `rebase origin/main` + re-`/eval` + `merge --ff-only` + push. Not a blocker.
- If shipped code ever lands the app in a bad state, the corrective action is to
  **strengthen the push gates** (a new test/check), then fix-forward — not to start
  gating on human review.
- See [[policies]] · [[feedback-002-always-commit-and-push]] ·
  [[feedback-003-one-commit-and-push-races]].
