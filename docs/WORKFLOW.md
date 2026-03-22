# Squad Battler — Pipeline Workflow

How ideas become features, and how all the documents fit together.

---

## Pipeline Overview

```
Discord #design
  ↓  friends post ideas in natural language
Claude Code (persistent session)
  ↓  converses to refine idea against DESIGN_FRAMEWORK.md
  ↓  asks clarifying questions in #design if needed
  ↓  commits design doc to docs/design/queue/
  ↓  finishes in-progress work first, then picks up next doc
  ↓  implements in a git worktree
  ↓  tests must pass (hard gate)
  ↓  merges to main → posts to #build
Vercel (auto-deploy on main push)  ← PREREQUISITE: not yet configured
  ↓  playtesters play and give feedback in #playtest
```

---

## Document Map

| File | Purpose | Who reads it |
|---|---|---|
| `CLAUDE.md` | Claude's operating instructions — conventions, autonomy rules, pipeline behavior | Claude Code |
| `docs/DESIGN_FRAMEWORK.md` | Game design constitution — evaluate ideas, what's in scope, current system state | Claude + contributors |
| `docs/WORKFLOW.md` | This file — how the pipeline works | Everyone |
| `docs/design/TEMPLATE.md` | Template for new design docs | Claude when creating docs |
| `docs/design/queue/` | Ideas refined and ready for implementation | Claude |
| `docs/design/in-progress/` | Feature currently being implemented | Claude |
| `docs/design/implemented/` | Completed features (historical record) | Everyone |
| `docs/VISION.md` | Full game vision and design pillars | Design reference |
| `docs/SYSTEMS.md` | System interaction overview and implementation status | Design reference |
| `docs/systems/` | Detailed design per system | Design reference |

---

## Design Doc Lifecycle

```
#design conversation
  ↓ Claude creates doc using TEMPLATE.md
docs/design/queue/          ← Status: queued
  ↓ Claude picks up doc (after finishing in-progress work)
docs/design/in-progress/    ← Status: in-progress
  ↓ Implementation complete, tests pass, merged to main
docs/design/implemented/    ← Status: implemented
```

Only one doc should be in `in-progress/` at a time. Complete and merge before picking up the next.

---

## Discord Channels

| Channel | Purpose | Who posts |
|---|---|---|
| `#design` | Post ideas, refine with Claude, resolve open questions | Contributors + Claude |
| `#playtest` | Bug reports, balance feedback, "this felt off" | Playtesters |
| `#architecture` | Architecture notes and refactor direction | Dan |
| `#build` | Status updates at each pipeline transition | Claude |

**Claude posts to `#build` at:** design doc committed · implementation started · merged · deploy live

---

## Roles

**Contributors (non-technical friends):**
- Post game ideas in `#design` in plain language
- Answer Claude's clarifying questions
- Playtest and report feedback in `#playtest`
- Design the creative content — species, mutation names, item concepts

**Dan:**
- Playtest
- Drop architecture notes in `#architecture`
- Review output of scheduled refactor sessions
- Not a gate on design approval or code review in the hot path

**Claude Code:**
- Refine ideas into design docs
- Implement features from design docs
- Write tests
- Maintain code quality (autonomously)
- Run scheduled maintenance sessions

---

## Scheduled Maintenance

**Refactor session** (weekly):
- Review recent commits for drift, duplication, or shortcuts
- Clean up without changing observable behavior
- Post summary in `#build`

**Doc-sync session** (after every ~5 features):
- Read current codebase
- Update `docs/DESIGN_FRAMEWORK.md` and `docs/SYSTEMS.md` to reflect what actually shipped
- Flag any design docs in `implemented/` that no longer match reality
- Post summary in `#build`

---

## Prerequisites to Go Live

The following must be completed before the pipeline is fully operational:

- [ ] **Web frontend** — a playable browser interface (currently CLI-only). Will be the first design doc through the pipeline.
- [ ] **Vercel deployment** — connect repo to Vercel with auto-deploy on main push
- [ ] **Discord plugin** — install `plugin:discord@claude-plugins-official` and configure channel access
- [ ] **Discord channels** — create `#design`, `#playtest`, `#architecture`, `#build`
- [ ] **Scheduled tasks** — configure cron for refactor and doc-sync sessions
- [ ] **End-to-end test** — run one dummy idea through the full pipeline before going live

---

## Launch Command

```bash
claude --channels plugin:discord@claude-plugins-official --dangerously-skip-permissions
```

Run in a persistent tmux session. If on a VPS, ensure the session survives SSH disconnection.
