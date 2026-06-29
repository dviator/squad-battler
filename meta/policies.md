# Policies — distilled steering (always loaded)

Short, durable lessons learned from the user's feedback. This file is loaded into
every autonomous session, so keep it tight — one line per lesson, link to the
full feedback file for context. `/capture-feedback` maintains this.

When a lesson here conflicts with a one-off instruction in a ticket, the ticket
wins for that ticket; update this file only for durable, repeatable guidance.

## How to work

- Do exactly one bounded unit per `/dev-tick`, then stop and persist state. Never
  chain multiple tickets in one fire — it blows the usage budget.
- Merge directly to main behind the `/eval` gate. No PRs. Fix-forward; revert only
  on hard-gate failure.
- **Verification never gates development.** `/eval` (automated checks) is the *only*
  thing that gates pushing to the repo. Never hold a shipped ticket for Dan's
  playtest/verification or any human sign-off — his verification is for steering,
  error-correction, and evolving game design, and runs *in parallel* with continued
  work. Shipped ≠ approved. If shipped code ever lands the app in a bad state, harden
  the push gates (add a check/test) and fix-forward — don't add a human approval
  step. A concurrent writer moving `origin/main` is a routine rebase, not a reason to
  hold. [[feedback-006-verification-never-gates]]
- **Always commit AND `git push origin main`.** A change isn't shipped until it's
  pushed — an unpushed commit leaves the remote and every cloud routine (which
  clones from GitHub) stale. End every unit of work pushed. [[feedback-002-always-commit-and-push]]
- **One ticket = one commit** (code + tests + bookkeeping together; bookkeeping
  before committing). [[feedback-003-one-commit-and-push-races]]
- **Work on a feature branch, never directly on `main`.** Branch off latest
  `origin/main` (local: in a `git worktree`; cloud: a plain branch in its clone),
  do everything on the branch, `/eval`, then `rebase origin/main` → `merge --ff-only`
  → push. The merge to main is the one integration gate for concurrent writers.
  Recipe: "Branch & worktree workflow" in `meta/PIPELINE.md`. [[feedback-004-feature-branch-per-session]]
- When a design is `needs-input`, carve out any fully-decided, creative-input-free
  slice (usually the engineering/structural foundation) into its own actionable
  `todo` ticket so the loop keeps producing while human creative input is pending.
  [[feedback-001-carve-actionable-slices]]

## Game design

- Never guess on game feel, balance, or new content (species/mutations/items).
  Surface a `[NEEDS-INPUT]` instead. Humans provide creativity; Claude provides
  engineering. (See `docs/DESIGN_FRAMEWORK.md`.)
- **Action before economy.** A run/level loop **opens on combat, never a shop.** The
  shop is *earned* — it first appears after the first win and recurs after fights,
  never before the first one. Item choices are more meaningful once you've seen units
  perform, and the shop should be a real constraint (spend only what you earned).
  Generalize: front-load the core fantasy; gate preparatory/secondary systems behind
  first engagement. [[feedback-005-action-before-economy]]
- **Persistent squad frame.** Keep the squad's character cards on screen across
  phases (combat ↔ shop) in one shared frame; don't design redundant per-phase
  screens that drop the units from view. The character card (portrait, HP, attack
  icon, attack-turn timer) is the single source of truth per unit. [[feedback-005-action-before-economy]]

## Feedback log

- [[feedback-001-carve-actionable-slices]] — carve the decided engineering slice
  out of a `needs-input` design into an actionable ticket.
- [[feedback-002-always-commit-and-push]] — always commit and push to main; a
  change isn't shipped until it's on the remote.
- [[feedback-003-one-commit-and-push-races]] — one ticket = one commit; rebase-and-
  retry when a concurrent writer moved main.
- [[feedback-004-feature-branch-per-session]] — work on a feature branch (worktree
  locally) merged to main; never commit feature work directly to main.
- [[feedback-005-action-before-economy]] — the run opens on combat, never a shop;
  the shop is earned. Keep the squad on screen in one persistent frame across phases.
- [[feedback-006-verification-never-gates]] — `/eval` is the only push gate; never
  hold shipped work for human verification. Harden gates instead of gating on review.
