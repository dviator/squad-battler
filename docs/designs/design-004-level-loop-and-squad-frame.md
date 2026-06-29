---
id: design-004-level-loop-and-squad-frame
status: ready # core loop decided; card visual-design language is the one needs-input slice (ticket-009)
priority: 1
created: 2026-06-27
updated: 2026-06-27
feedback_refs: [feedback-005-action-before-economy]
---

# Design: Level Loop & Persistent Squad Frame

## Summary

Define the moment-to-moment loop a player runs through a floor, and the UI frame
that loop lives in. Two coupled decisions:

1. **Action before economy.** The run opens on combat — never a shop. The shop is
   *earned*: it first appears after the first win and recurs after every fight. This
   front-loads the core fantasy (get your squad into the mix), makes item choices
   meaningful (you've now seen your units perform out of the box), and turns the
   shop into a real constraint (you can only spend what you earned), which sells the
   resources→shop conceit.
2. **One persistent squad frame.** Combat and shop share a single frame so the
   squad's character cards never leave the screen. Fewer screens to design, more
   continuity, and the character card becomes the single source of truth for "what
   is this unit right now." That shared frame is where we build the considered
   character card: big portrait, HP bar, attack-icon placeholder, and an
   attack-turn countdown timer.

This is the **micro** loop (within a floor). The **macro** floor structure/themes
live in [[design-003-overall-level-design]].

## Player Experience

You drop straight into your first fight — squad into the mix immediately, zero menu
friction. You watch your units perform out of the box. You win, the same frame
hands you your earnings and slides into a shop where you spend what you took —
choices now informed by what you just saw and constrained by your take. You pick
the next node, fight, shop again. Your squad cards are a constant companion; only
the surrounding context changes — enemies + live attack timers in combat, shop
offers at rest.

## The Loop (decided with Dan, 2026-06-27)

```
[Run start]
   │
   ▼
 Combat 1 ──win──▶ Reward ──▶ Shop (= squad screen)
   │ lose → run ends                  │ pick next node
   └──────────────◀───── Combat 2 ◀───┘
                            │  …repeat Combat → Shop…
                            ▼
                       Boss (final node)
```

- **No shop before the first fight.** A new run lands on the first combat.
- **Shop after every win.** Combat → reward (gold / materials / scrap-tech) → shop.
  The first shop a player ever sees is after their first win.
- **Shop → next node.** Nodes are **linear for now** with **light randomization** of
  the next encounter (enemy layout / minor difficulty variation). Branching node
  maps are explicitly later.
- **Boss is the final node.** The shop after the last pre-boss fight is your boss
  prep — no separate pre-boss shop beat for now.
- **HP persists across the floor; no mid-run heal except bought consumables**
  (status quo — attrition is the tension). Items are run-scoped.

## Persistent Squad Frame

- One shared frame hosts the squad's character cards across **Combat** and **Shop**.
- **Combat:** squad cards sit opposite the enemy cards (the ticket-004 face-off);
  HP bars and attack-turn timers live-update tick by tick.
- **Shop:** the *same* cards are the interaction surface for buying/equipping; shop
  offers render around/below them. Buying updates the card in place (a potion fills
  the HP bar; equipment adds an icon).
- Goal: continuity + fewer redundant screens. Build on the existing
  `SpecimenCard`/`UnitCard`/`BattleUnitCard` (ticket-003) and `BattleArena`
  face-off (ticket-004) rather than a new card family.

## Character Card (the considered build-out)

Elements, ranked by what makes the game readable and fun:

1. **Big character portrait** — the species-tinted art panel + glyph placeholder
   already in `SpecimenArt`; real portrait art drops straight into that slot.
2. **Health bar** — current/max, animates on change (`HpBar` exists).
3. **Attack-icon placeholder** — the unit's attack/ability, an art-ready slot.
4. **Attack-turn countdown timer** — the unit's cooldown to its next attack; the
   key combat-readability element. *In combat:* a live radial/bar counting down per
   tick. *At rest (shop/roster):* a static preview derived from the unit's
   speed/cooldown ("attacks every N ticks").
5. Existing chrome — SPEC-### tag, genetic-grade badge, position.

**Card states:** *Live* (combat) — HP + timer animate, dead units dim; *Idle*
(shop/roster) — timer shows the stat preview, card is interactive (purchase target).

## Acceptance Criteria

For the decided structural slice:

- [ ] A new run goes straight to the first combat — **no shop is shown before any
      fight** (`runSimulator.simulateRun` + `gameStore.startNewGame`).
- [ ] After every combat win a shop appears before the next node; the first shop a
      player ever sees is after their first win.
- [ ] Combat and shop render the **same** squad character-card component (one shared
      component, not duplicated markup).
- [ ] The character card surfaces portrait, HP bar, attack-icon placeholder, and an
      attack-turn countdown timer — live in combat, stat-preview at rest.
- [ ] Nodes advance linearly with light randomization of the next encounter.
- [ ] `bun run test` + `bun run test:balance` stay green; `simulateRun` reflects the
      combat-first ordering (no balance regression).

The card's **visual design language** (timer treatment, hierarchy, what to
show/hide, the "fun" of it) is a Dan-led decision — see Open Questions / ticket-009.

## Implementation Notes

- **Loop ordering** lives in two places:
  - `src/core/runSimulator.ts:180` — move the shop phase to *after* a combat win;
    skip it before the first combat.
  - `src/web/store/gameStore.ts:170` — `startNewGame` must land on the first-fight
    screen, not `view: "shop"`; drop the pre-fight `generateShop(0)`. The post-win
    shop in `afterBattleWin` (already `view: "shop"`) is correct and stays.
- **Shared frame** — extract a `SquadFrame` / consolidated `CharacterCard` used by
  `BattleView`/`BattleArena` and `ShopView`. Keep core pure: the card *renders*
  combat state, no game logic in the component.
- **Attack-turn timer** reads the existing tick/cooldown model in
  `src/core/battle.ts` (per-attack cooldowns). Combat animates from the replay/tick
  state; idle derives "every N ticks" from speed/cooldown.
- **Light randomization** — `generateNormalEncounter` already varies enemies by
  difficulty; wire light variation into node generation.
- Calibrate the shop economy so "spend only what you earned" is a real constraint —
  tune gold-per-fight vs. item cost against `docs/DESIGN_FRAMEWORK.md` balance
  targets and `scripts/balance-check.ts`.

## Out of Scope

- Branching node maps (linear for now — Dan said "for now").
- New species / mutations / items, and final portrait/attack art (placeholders now).
- Floor macro structure / themes ([[design-003-overall-level-design]]).
- Mid-run healing changes (status quo: HP persists, no heal but consumables).

## Open Questions (need Dan — do not decide autonomously)

1. **Character-card visual design language** — how the attack-turn timer reads
   (radial ring vs. depleting bar vs. pip countdown), information hierarchy, what to
   show/hide, the polish that makes it "fun." Drives ticket-009.
2. **Shop economy feel** — how tight should "spend only what you earned" be? (Can be
   tuned to balance targets, but the intended *constraint feel* is Dan's call.)
3. **Node randomization feel** — how light is "light"? Enemy layout only, or minor
   difficulty variation too?
4. **Pre-boss treatment** — is the normal post-fight shop before the boss enough, or
   does the boss deserve a distinct prep beat? (Currently: normal post-fight shop.)

## Tickets

- **ticket-007** — Shop sequence change (combat-first loop). *Actionable now; the
  first bug.* Pure structural, no creative input.
- **ticket-008** — Persistent squad frame + character-card layout (shared component
  across battle + shop; timer wired to live/idle state). *Actionable.*
- **ticket-009** — Character card visual design. *Needs-input* — blocked on Dan's
  design direction (Open Q1).
- **ticket-010** — Shop screen layout on the persistent frame. *Depends on 007 + 008.*
