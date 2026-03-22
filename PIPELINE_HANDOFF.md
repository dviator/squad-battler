# Autonomous Game Dev Pipeline — Handoff Doc

## Project
Auto squad battler (working title). Existing repo with existing conventions. Goal is to expand the game using a fully autonomous development pipeline driven by Discord design sessions.

## What We're Building
A development pipeline where:
- Non-technical friends contribute design ideas via Discord
- A persistent Claude Code session handles everything from idea refinement to implementation
- Changes go straight to main, Vercel deploys automatically, playtesters judge results
- Code quality is maintained through scheduled refactor/doc-sync sessions and periodic architecture input from Dan

Dan's only role in the hot path is: playtesting, dropping architecture notes in Discord, and reviewing scheduled refactor output. He is explicitly **not** a gate on design approval or code review.

---

## Architecture

```
Discord (#design)
  ↓ friends post ideas in natural language
Claude Code (persistent session, --channels plugin:discord@claude-plugins-official)
  ↓ converses to refine idea against DESIGN_FRAMEWORK.md
  ↓ asks clarifying questions back in Discord if needed
  ↓ commits structured design doc to /docs/design/queue/
  ↓ finishes any in-progress work first, then picks up new doc
  ↓ implements in a git worktree
  ↓ tests must pass (hard gate — do not merge if failing)
  ↓ merges to main
Vercel (auto-deploy on main push)
  ↓ playtesters play and give feedback in Discord (#playtest)
```

If design idea volume ever gets high enough to warrant parallelism, use **git worktrees** — one per feature, implement in parallel, merge independently. The automated test gate makes this safe.

---

## Session States
- **Listening** — idle, watching Discord for new messages
- **Designing** — active conversation with a friend, refining an idea, doc not yet committed
- **Implementing** — working through a queued design doc in a worktree
- **Scheduled work** — running a refactor or doc-sync session

Transition rule: always finish current implementation and open a clean merge before picking up the next queued doc.

---

## Discord Channels
| Channel | Purpose |
|---|---|
| `#design` | Friends post ideas, Claude converses and refines |
| `#playtest` | Playtest feedback, bug reports |
| `#architecture` | Dan drops architecture notes, Claude queues as refactor tasks |
| `#build` | Claude posts status updates (doc committed, implementation started, merged, deploy live) |

Claude should post brief status updates in `#build` at each pipeline transition so everyone can see progress without asking.

---

## Key Files to Create

### `CLAUDE.md` (repo root)
The primary instruction set for the Claude Code session. Should cover:
- Game overview, core loop, tech stack
- What Claude is and isn't allowed to decide autonomously
- Coding conventions, file structure, naming
- Test requirements (tests must be written alongside implementation, must pass before merge)
- Merge policy (merge to main directly, no PRs, tests must pass)
- How to handle ambiguity (ask in Discord, don't guess on game feel decisions)
- Worktree usage instructions for parallel work

### `DESIGN_FRAMEWORK.md` (docs/)
The design constitution. Claude uses this to evaluate incoming ideas without Dan's input. Should cover:
- Game concept, tone, target experience
- Existing systems and mechanics (keep current with codebase)
- What is explicitly out of scope
- What constitutes a complete enough idea to action (vs. needs more refinement)
- Questions Claude should always ask before creating a design doc

### Design doc template (`docs/design/TEMPLATE.md`)
```markdown
# Feature: [Name]
**Status:** queued | in-progress | implemented
**Source:** #design (Discord thread link if available)
**Date:** 

## Summary
One paragraph plain-English description.

## Player Experience
What does this feel like to play? What problem does it solve?

## Acceptance Criteria
- [ ] Concrete, testable bullets
- [ ] Written so passing/failing is unambiguous

## Implementation Notes
Technical approach, affected systems, known constraints.

## Out of Scope
Explicit exclusions to prevent scope creep.

## Open Questions
Things Claude should NOT decide autonomously — post in #design before proceeding.
```

Docs move through: `docs/design/queue/` → `docs/design/in-progress/` → `docs/design/implemented/`

---

## Scheduled Sessions
Two recurring jobs (configure via Claude Code scheduled tasks or cron):

**Refactor session** (suggested: weekly)
- Review recent commits for drift, duplication, or shortcuts taken under implementation pressure
- Clean up without changing observable behavior
- Post summary in `#build`

**Doc sync session** (suggested: after every ~5 features)
- Read the current codebase
- Update `DESIGN_FRAMEWORK.md` to reflect what actually got built
- Flag any design docs in `implemented/` that no longer match reality
- Post summary in `#build`

---

## Quality Model
- **Automated tests** — the only merge gate. Claude writes tests with every feature.
- **Vercel previews** — feature branches get preview URLs for optional early playtesting before merge
- **Playtest feedback** — primary signal for game feel, bugs, and balance. Lives in `#playtest`.
- **Scheduled refactors** — prevent accumulated technical debt
- **Dan's architecture notes** — periodic high-level input via `#architecture`, queued as refactor tasks

No PR review in the hot path. Fix-forward. Speed of iteration is the priority.

---

## Setup Checklist
- [ ] Confirm repo name and location, read existing CLAUDE.md / conventions if present
- [ ] Install Discord plugin: `/plugin install discord@claude-plugins-official`
- [ ] Add friends' Discord user IDs to channel allowlist (`access.json`)
- [ ] Create `DESIGN_FRAMEWORK.md` based on existing game vision docs
- [ ] Create/update `CLAUDE.md` with pipeline instructions and coding conventions
- [ ] Create `docs/design/` folder structure with TEMPLATE.md
- [ ] Verify Vercel is connected to main branch with auto-deploy
- [ ] Write or verify baseline test suite exists
- [ ] Configure scheduled tasks for refactor and doc-sync sessions
- [ ] Create Discord channels: #design, #playtest, #architecture, #build
- [ ] Test full loop with one dummy design idea end-to-end before going live

---

## Launch Command
```bash
claude --channels plugin:discord@claude-plugins-official --dangerously-skip-permissions
```
Run in a persistent tmux session. If hosting on a VPS, ensure the session survives SSH disconnection.
