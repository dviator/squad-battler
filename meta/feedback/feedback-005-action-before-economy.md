---
id: feedback-005-action-before-economy
kind: steering
created: 2026-06-27
ticket: ticket-007-shop-sequence-combat-first
sentiment:
tags: [game-design, pacing, run-loop, shop, economy, ui-continuity]
---

# Feedback: action before economy — the run opens on combat, the shop is earned

## What was said

Reworking the level loop, Dan: "No shop before the first level, this slows down the
action and prevents you from getting your team into the mix. The item choice is more
interesting after you've seen them perform out of the box, and it provides a
meaningful constraint, as well as proving the conceit of needing resources to shop."

He set the loop: first fight → shop after every fight → next node (linear, lightly
randomized) → repeat to the boss. And the UI principle: the squad's character cards
**stay in the same frame from combat to shop** — for continuity and to avoid
designing redundant screens.

## Why it matters

This is a durable pacing rule, not a one-off. Putting a shop/prep menu *before* the
player's first fight does three bad things: (1) it delays the core fantasy — you
want the squad into the mix immediately; (2) it asks for an uninformed decision —
item choices are far more meaningful once you've watched units perform out of the
box; (3) it gives away the economy — the shop should be a real constraint (spend
only what you earned), which also sells the resources→shop conceit. Generalize:
**front-load the core fantasy; gate preparatory/secondary systems behind first
engagement; make choices informed by experience and constrained by earned
resources.** The code contradicted this (shop fired before every combat, including
the first) even though `DESIGN_FRAMEWORK` already implied combat-first.

A second durable lesson: **keep the player's squad on screen across phases.** Reuse
one persistent character-card frame for combat and shop instead of separate screens
— more continuity, fewer screens to design, one source of truth per unit.

## How to apply

- When designing or reviewing a run/level loop: the run **opens on combat, never a
  shop**. The shop is unlocked by a win and recurs after fights — never preceding
  the first one. Apply the same "act first, then offer the menu" instinct to any new
  preparatory system.
- Prefer a **persistent frame** that keeps the squad's cards visible across phases
  over bespoke per-phase screens.
- Loop economy (gold per fight vs. item cost) should keep "spend only what you
  earned" a real constraint; tune to `DESIGN_FRAMEWORK` balance targets.
- See [[policies]] · [[design-004-level-loop-and-squad-frame]] ·
  enshrined in `ticket-007`.
