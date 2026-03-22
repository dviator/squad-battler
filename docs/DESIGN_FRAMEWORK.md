# Squad Battler — Design Framework

This is the game design constitution. The autonomous pipeline uses this to evaluate incoming ideas, decide what's in scope, and know when an idea needs more refinement before implementation begins.

---

## Game Concept & Tone

**Elevator pitch:** A strategic squad battler where players escape the bottom floor of an evil corporate science lab by breeding increasingly powerful creatures across hundreds of runs.

**Comparable to:** *Slay the Spire* meta-depth × *Pokémon breeding* genetics × *Into the Breach* tactical positioning.

**Tone:** Thoughtful, sciencey, discovery-driven. Players are rogue scientists experimenting with genetics — not action heroes. Calm lab phases contrast with escalating combat tension.

**Story context:** You're a rogue scientist trapped in MegaCorp Labs' basement. The only way out is up — through 9–10 floors of corporate-engineered experiments, run by run, building your genetic legacy.

---

## Design Pillars

1. **Long-term strategic planning** — success comes from optimizing breeding across dozens of runs, not reflexes in a single fight
2. **Meaningful failure** — every loss provides Genetics Points, knowledge, and sometimes unlocks; the squad persists
3. **Emergent squad dynamics** — squad composition creates interesting interactions; no single unit should carry
4. **Meaningful choice architecture** — every decision has real trade-offs; no choice should feel obviously correct

---

## Core Loops

### Meta Loop (The Lab)
```
Finish Run → Earn Genetics Points → Lab Phase (heal, breed, manage stable) → Begin new run
```

### Run Loop
```
Squad enters → [Combat → Shop] × 9–10 → Mini-Boss → Boss → Return to Lab
```

HP persists between combats within a run. Items from shop are run-scoped (expire at run end).

---

## Existing Systems

### Combat ✅ Implemented
- Tick-based auto-battle: each attack has an independent cooldown timer
- 3 positions: Left / Center / Right — affect targeting
- Speed determines execution order on tie ticks
- Damage: `attackPower × damageMultiplier`

### Species ✅ Implemented (3 species)
| Species | HP | Speed | Attack | Role |
|---|---|---|---|---|
| Bear | 180 | 8 | 20 | Tanky AOE |
| Eagle | 130 | 15 | 25 | Fast finisher |
| Tiger | 160 | 12 | 30 | Balanced DPS |

Additional species are designed by humans and unlocked via mini-boss defeats.

### Mutations ✅ Implemented (8 mutations)
| Mutation | Effect |
|---|---|
| Thick Hide | +30 max HP |
| Swift Reflexes | +3 speed |
| Powerful Muscles | +8 attack power |
| Adrenaline Rush | -1 to all cooldowns |
| Berserker | +15 attack, -20 HP |
| Enhanced Ferocity | +15 attack (permanent lab upgrade) |
| Enhanced Resilience | +30 HP (permanent lab upgrade) |
| Enhanced Agility | +5 speed (permanent lab upgrade) |

### Genetic Potential Grades ✅ Implemented
Grades F → S determine stat ranges at unit creation. Higher grade = higher possible stats.

### Genetics / Breeding ❌ Not yet implemented
- Combine two same-species units to produce offspring
- Offspring inherits mutations probabilistically (50% per parent mutation)
- Small chance for random new mutations
- Generation counter tracks lineage depth

### Shop / Economy ⚠️ Partial
- Three item tiers: Consumable (single use), Equipment (run-scoped), GeneticMod (permanent genome)
- Resources: Gold (per encounter) and Genetics Points / DNA (per run)
- Permanent items not yet implemented

### Meta Progression ❌ Not yet implemented
- Genetics Points earned based on floors reached
- Lab upgrades unlocked by boss defeats
- Species unlocks triggered by mini-boss defeats

### World Progression ⚠️ Partial
- Campaign structure exists but not at full 9–10 encounter scale
- Mini-boss and boss encounters not fully integrated

### Lab Hub ⚠️ Partial
- Healing implemented; breeding, equipment management not yet

---

## Design Principles

1. **Respect player agency** — choices matter; avoid pure RNG outcomes
2. **Depth over complexity** — simple systems with interesting interactions
3. **Multiple paths to victory** — no single correct breeding strategy
4. **Meaningful failure** — defeat teaches and unlocks, doesn't just punish
5. **Balance immediate vs. long-term** — shop decisions always have real trade-offs
6. **Genetic accessibility** — approachable feel that reveals depth to experts

---

## Balance Targets

| Scenario | Target |
|---|---|
| First run mini-boss reach rate | 40–70% |
| First run boss reach rate | 10–30% |
| First run boss win rate | 0–10% |
| Run 5 boss win rate | 15–35% |
| Run 10+ boss win rate | 40–70% |
| Average run duration | 15–30 min |
| Average damage per encounter | 20–40% of squad HP |

Use simulation tests (`bun run test:sim`) to validate against these targets after any balance change.

---

## Out of Scope

The following are explicitly excluded regardless of how good the idea sounds:

- **Real-time player input during combat** — combat must stay fully simulatable for automated testing and balance validation
- **Multiplayer** (PvP, co-op, async)
- **Microtransactions or monetization mechanics**
- **Off-theme content** — must fit the corporate lab / genetic experimentation setting
- **Mechanics that break simulation-first testing** — if it can't be tested headlessly, it doesn't belong in core

---

## Idea Evaluation Criteria

An idea is **ready to action** (create a design doc) when:
- It fits the game's tone and design pillars
- It's not on the out-of-scope list
- It has a clear player experience ("what does this feel like to play?")
- It has at least one concrete acceptance criterion
- Any new species/mutations/items have been designed by a human, not inferred

An idea **needs more refinement** when:
- The game feel is unclear ("make combat more interesting" needs specifics)
- It requires new species/mutations/items but none have been named or described
- It conflicts with an existing system without resolving how
- It touches open design questions (see below)

---

## Required Questions Before Creating a Design Doc

Ask these in `#design` before writing the doc:

1. What does this feel like to play — what's the moment-to-moment experience?
2. What problem does this solve, or what new experience does it create?
3. Does this require new species, mutations, or items? If so, what are they (humans must provide this)?
4. How does this interact with existing systems (breeding, shop, world progression)?
5. What's explicitly out of scope for this feature (to prevent scope creep)?
6. Any balance targets or constraints?

---

## Open Design Questions

These require human input before work can begin on affected systems:

- [ ] Final squad size (currently 3 — keep or increase to 4–5?)
- [ ] Number of worlds (3? 5? 7?)
- [ ] Species unlock progression — which mini-boss unlocks which species?
- [ ] Lab equipment unlock tree — which boss unlocks what?
- [ ] Genetic inheritance rules — exact probability tuning
- [ ] Combat status effects — stun, poison, bleed? (if any)
- [ ] Enemy design philosophy per world

---

*This document should be updated after every doc-sync session to reflect the current state of the codebase.*
*See `docs/VISION.md` for the full vision doc. See `docs/SYSTEMS.md` for system interaction overview.*
