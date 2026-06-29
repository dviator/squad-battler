---
id: feedback-003-one-commit-and-push-races
kind: steering
created: 2026-06-27
ticket: ticket-005-floor-structure-foundation
sentiment:
tags: [pipeline, git, concurrency, cloud, implement-ticket]
---

# Feedback: one commit per ticket + handle concurrent-writer push races

## What was said

The first live cloud `dev-tick` run (implementing ticket-005) validated the whole
path — clone → install → implement → eval → commit → push, incl. push auth — but
surfaced two things during reconciliation:

1. It shipped the ticket in **two commits** (code, then bookkeeping) because the
   `implement-ticket` skill listed the commit step *before* the bookkeeping step.
2. While it ran (~6 min), local sessions also committed to `main`, so histories
   diverged and needed a manual rebase; `BACKLOG.md` went briefly stale because two
   writers regenerated it around the same time.

## Why it matters

- **One ticket = one commit** isn't cosmetic: a single-commit ticket reverts
  cleanly. If code and bookkeeping are split, reverting the code leaves the
  ticket/STATE/BACKLOG claiming "shipped."
- **`main` has multiple concurrent writers** — the cloud routines *and* any local
  session. A cloud `git push` can be rejected because origin moved during its run.
  Without rebase-and-retry, the run would do all the work and then fail to ship it.

## How to apply

- Make all file changes (code + tests + ticket/STATE/INBOX/BACKLOG bookkeeping)
  **before** committing, then make exactly one commit. (Skill reordered to enforce
  this.)
- On `git push` rejection: `git pull --rebase origin main`, re-run `/eval`,
  regenerate `BACKLOG.md` if it drifted, push again — repeat until
  `git log origin/main..HEAD` is empty. Enshrined in the `implement-ticket` skill
  and both routine prompts. See [[policies]] · [[feedback-002-always-commit-and-push]].
