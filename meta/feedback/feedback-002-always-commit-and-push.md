---
id: feedback-002-always-commit-and-push
kind: steering
created: 2026-06-27
ticket:
sentiment:
tags: [pipeline, git, release, cloud]
---

# Feedback: always commit AND push

## What was said

During the automated-work validation pass, a clean clone of `origin/main` was a
commit behind local — a finished commit (`b4c27d8`) had been committed but not
pushed. Dan: "let's encode the guidance to always commit and push changes."

## Why it matters

The cloud routines (`dev-tick`, `post-merge-eval`) run in ephemeral environments
that **clone from GitHub**. They see `origin/main`, never the local working tree. An
unpushed commit is invisible to them and to any other clone — so the next scheduled
run would build on stale code, and shipped work would silently fail to propagate.
"Committed" is not "shipped"; only "pushed" is.

## How to apply

End every unit of work with `git push origin main` (after the commit, behind the
`/eval` gate). Don't leave commits sitting locally. When in doubt, check
`git log --oneline origin/main..HEAD` — it should be empty before you consider the
work done. See [[policies]] · enshrined in the `implement-ticket` skill.
