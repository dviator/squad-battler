---
id: design-005-battle-legibility
status: needs-input
priority: 2
created: 2026-07-06
updated: 2026-07-06
feedback_refs: []
---

# Design: Battle Legibility & Combat Readability

## Summary

The tick-based auto-battle is mechanically interesting but visually hard to parse.
Playtesting surfaced three specific asks: a visible initiative order (who acts next),
graphical targeting indicators (who attacks whom), and tighter fight pacing. This
design doc captures what's decided, identifies the three open visual-treatment
questions, and carves out one engineering slice that can ship now without those answers.

Refines #3.

## Player Experience

You watch two squads fight and you *understand* it: you know which unit is about to
fire next, you can see where the attack is aimed before it lands, and the fight
resolves at a pace that keeps you engaged rather than waiting. When you lose, you
know *why* — which attack hit whom in what sequence. When you win, you felt the
tension build toward the decisive moment.

## What Is Already There

- Each character card shows an **attack-turn timer bar** (0 → 1 as cooldown refills,
  turns warning-yellow at ≥ 85%). The data for "next to fire" is fully present.
- `AttackExecuted` events already carry `targetIds: string[]` — the target(s) of
  each attack are tracked from the moment the battle engine runs.
- The replay paces events at 600 ms per action at 1× speed (300 ms at 2×); a Fast/
  Skip toggle is already in the UI.

## Three Components

### 1. Initiative Order (next-to-fire indicator)

Show the player who fires next. Data source: `unitTimerProgress` (already computed
per unit; highest progress = closest to firing). Decision needed on visual treatment.

### 2. Attack Targeting Indicators

Show the player who each unit will target. The `targetIds` are available on every
`AttackExecuted` event; showing them *before* the attack lands (a telegraph) vs.
*during* the lunge animation are different UX approaches with different mobile constraints.

### 3. Fight Pacing / Length

The combat system doc targets 8–14 ticks per regular battle. Current average from
simulation: ~6.6 ticks (within range). "Shorter fights" feedback may be about
*perceived* pace (animation speed, event density) more than tick count. Decision
needed on which lever to pull.

## Acceptance Criteria

- [ ] Player can see which unit fires next without reading the battle log.
- [ ] Player can identify which enemy a unit is targeting at or before the moment
      of attack.
- [ ] Battle log shows "Attacker → Target" on every attack line.
- [ ] A regular encounter resolves in under 25 s at default speed, or the player
      has intuitive controls to pace it as they prefer.
- [ ] All functionality works correctly at 360 px viewport width.

## Implementation Notes

**Carve-out ticket (no open questions):**
- Enhance battle log: append "→ TargetName" (or "→ TargetA, TargetB" for AoE) to
  every `AttackExecuted` log line in `useBattleReplay.ts`. Uses the existing
  `targetIds` field; only needs `getUnitName` for each id. 3–5 line change.
  Acceptance: every attack line in the log ends with "→ [target]".

**Initiative indicator (blocked on Open Q1):**
- Once the visual treatment is decided, implementation is straightforward: derive
  sorted order from `unitTimerProgress` (`useBattleReplay` already returns this)
  and render the chosen treatment in `BattleArena` or on the `CharacterCard`.

**Targeting indicators (blocked on Open Q2):**
- For a pre-attack telegraph: on `AttackExecuted` event, set `pendingTargetIds` for
  ~300 ms before the `Damage` event fires, then clear. This adds one state variable
  to the replay hook.
- For a persistent arrow: derive each unit's typical target from its `targetType`
  and current enemy HP state. Render as an SVG overlay or CSS positioned element.
  Mobile-constraint: arrows across the VS divider at 360 px are very tight.

**Pacing (blocked on Open Q3):**
- If the lever is *default replay speed*: change `useState(1)` to `useState(2)` in
  `useBattleReplay`. Single-line change.
- If the lever is *animation emphasis*: add a brief pause/emphasis beat on UnitDied
  and BattleEnd events (already have a 1.2× / 1.5× multiplier in `getEventDelay`).
- If the lever is *mechanics (fewer ticks)*: tune damage multipliers; current tick
  target (8–14) is already being hit. Not recommended without re-running balance.

## Out of Scope

- Real-time player input into combat targeting (violates simulation-first rule)
- Status effect indicators (a separate future system)
- Post-battle replay / rewind
- Enemy-side initiative details (enemies are intentionally less legible to maintain
  tension; the player tracks *their own* squad's readiness)

## Open Questions

> Claude must NOT resolve these — they are game-feel and UX decisions for Dan.

**Q1 — Initiative tracker visual treatment:**
Options include:
- (a) Dedicated "next-to-fire" rail or row above/below the arena listing units in
  order with small portraits or initials.
- (b) On-card annotation: a "NEXT" badge or position number (1st/2nd/3rd) on the
  character card of the unit(s) about to fire.
- (c) Rely on the existing timer bar color change (already turns warning-yellow
  at ≥ 85% charge) — is this already sufficient, or does it need more emphasis?
- (d) Show full turn order (all 6 units sorted) vs. just "next one to fire."

*What visual treatment makes the combat feel most readable and exciting?*

**Q2 — Attack targeting icons:**
Options include:
- (a) Flash telegraph: ~300 ms before the attack lands, briefly highlight the
  target card(s) with an arrow or glow, then resolve into the hit animation.
- (b) Persistent arrows/lines from each unit to their current likely target
  (updated each tick as targeting resolves). Could be cluttered at 360 px.
- (c) No separate icon — just make the battle log more prominent so the text
  "Eagle → Goob (Left)" is the targeting signal.

*Which approach makes targeting legible on mobile (360 px) without cluttering the layout?*

**Q3 — "Shorter fights" lever:**
The current average fight length (6.6 ticks at simulation) is within the 8–14 tick
design target. The feedback is likely about *perceived* pace:
- (a) Raise default replay speed to 2× (half the current animation duration).
- (b) Keep 1× default but add a visual "pulse" on big hits / deaths to make each
  moment feel more impactful (dense + exciting vs. long + slow).
- (c) Both — faster default + impact emphasis.

*What makes the combat feel tense and exciting without feeling rushed or hard to follow?*
