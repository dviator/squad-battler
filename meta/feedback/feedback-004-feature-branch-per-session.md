---
id: feedback-004-feature-branch-per-session
kind: steering
created: 2026-06-27
ticket:
sentiment:
tags: [pipeline, git, concurrency, worktree, workflow]
---

# Feedback: feature branch (+ worktree) per session, merged to main

## What was said

After the first live cloud run exposed concurrent-writer divergence on `main`
(cloud routine + multiple local sessions all committing directly), Dan: "Let's
encode the regular use of work trees in each new session to avoid conflicts
proactively with feature branches then merged to main."

## Why it matters

Committing every unit of work directly to a shared `main` makes `main` the place
where concurrent writers collide — divergences need manual rebase reconciliation,
and two sessions can clobber each other's working tree. Moving each unit onto its
own short-lived feature branch (in a worktree, locally) makes the **merge to main**
the single, explicit integration gate. Conflicts surface at merge time on one
branch instead of as tangled divergent histories. This is the proactive version of
the reactive push-race handling in [[feedback-003-one-commit-and-push-races]].

## How to apply

Each unit of work: branch off the latest `origin/main`, do everything on the branch
(code + tests + bookkeeping), `/eval` on the branch, keep it to **one commit**, then
`git rebase origin/main` → `git merge --ff-only` into main → push (linear,
revert-safe). Local sessions use a worktree (`git worktree add -b …`) so parallel
sessions get isolated checkouts; the cloud's ephemeral clone is already isolated, so
a plain branch suffices. Never commit feature work directly to `main`. Full recipe:
"Branch & worktree workflow" in `meta/PIPELINE.md`. See [[policies]].
