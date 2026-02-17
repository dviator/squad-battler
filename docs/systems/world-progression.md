# System Design: World Progression

How runs are structured and how encounters escalate.

---

## Overview

Each run progresses through a world with 9–10 encounters. The structure follows a designed cadence that creates tension, provides respite, and builds toward a climactic boss encounter. The shop phase after each encounter lets players adapt their strategy to what they've learned.

---

## World Structure

### Encounter Sequence (World 1 — Basement)

```
Encounter 1:  Regular  — 2× Goob          (Tutorial difficulty)
  → Shop Phase 1
Encounter 2:  Regular  — 2× Goob
  → Shop Phase 2
Encounter 3:  Regular  — 2× Goob + positioning variety
  → Shop Phase 3
Encounter 4:  Elite    — 2× Goob + 1× Heavy Goob
  → Shop Phase 4
Encounter 5:  Regular  — 2× Goob
  → Shop Phase 5
Encounter 6:  MINI-BOSS — Mega Goob       (First major challenge)
  → Shop Phase 6 (extra gold reward)
Encounter 7:  Regular  — 2× Heavy Goob
  → Shop Phase 7
Encounter 8:  Regular  — 3× Goob          (AoE threat)
  → Shop Phase 8
Encounter 9:  Elite    — 2× Goob + 1× Heavy Goob
  → Shop Phase 9
Encounter 10: BOSS     — [TBD Boss]       (Final challenge)
  → Run Complete
```

### Encounter Types

**Regular:** Standard enemy composition. Clearable with reasonable preparation.
**Elite:** Harder composition with at least one stronger enemy variant. ~40% harder than regular.
**Mini-Boss:** Mega Goob (or equivalent). Designed to be defeatable by most players who've survived this far with good item choices. First kill unlocks a new species.
**Boss:** End-of-world final encounter. Significantly harder than mini-boss. First kill unlocks lab equipment.

---

## Enemy Compositions by Encounter

### World 1 Enemy Roster

**Goob** — Basic enemy
- HP: ~200–350 (calibrated by simulation)
- Attack: Weak but persistent, fires every 3–4 ticks
- Role: Attrition damage, positioning pressure

**Heavy Goob** — Elite variant
- HP: ~300–400 (more durable)
- Attack: Slower but hits harder (every 5–6 ticks)
- Role: Forces players to deal with a tanky threat

**Mega Goob** — Mini-boss
- HP: ~600–800 (calibrated by simulation — survive multiple player burst windows)
- Attack: Multiple attack types including AoE
- Role: Tests squad durability, rewards strategic item use

**World 1 Boss** (TBD design)
- Should have a unique mechanic that distinguishes it from Mega Goob
- Ideas: Shield phase, summon adds, enrage timer
- HP: ~1000–1200

---

## Gold Economy by Encounter

| Encounter Type | Gold Reward |
|----------------|-------------|
| Regular (win) | 4–6g (random) |
| Elite (win) | 8–12g (random) |
| Mini-Boss (win) | 15g + DNA bonus |
| Boss (win) | 30g + DNA bonus |

Total gold available in a full winning run: ~80–110g

---

## Difficulty Scaling Within World 1

### HP Attrition Design
The encounter sequence is designed so that player HP is gradually depleted:

```
Full HP → Encounter 1 (lose 15-25%) → Encounter 2 (lose 15-25%) →
Encounter 3 (lose 10-20%) → Encounter 4 ELITE (lose 20-30%) → ...
```

By the mini-boss, players should typically be at 30–50% HP, making the mini-boss genuinely dangerous. The shop after mini-boss allows partial healing before the back half.

### Target HP at Each Stage

| Stage | Target Remaining HP (% of max) |
|-------|-------------------------------|
| After Encounter 3 | 45–65% |
| Arriving at Mini-Boss | 30–50% |
| After Mini-Boss | 15–35% (it's a tough fight) |
| Arriving at Boss | 20–40% (with good healing) |

---

## Random Events

Between combat encounters, there is a 20% chance of a random event. Events add variety and decision points without requiring combat.

### Example Events (to implement in Phase 7)

**The Lab Anomaly**
> "You find a discarded genetic sample. Inject it?"
> - Yes: Random unit gains a random mutation (could be good or bad)
> - No: Nothing

**Emergency Supplies**
> "A supply cache! Contents: 30 HP healing for one unit or 5g."
> - Take healing → Heals most injured unit
> - Take gold → +5g

**Genetic Distortion Field**
> "Strange radiation warps your creatures temporarily."
> - One random stat for one random unit +20% for this run
> - Or -15% (50/50 chance, only revealed after accepting)

**Corporate Intel**
> "You find enemy schematics. Preview the next encounter?"
> - View → Shows exact enemy composition for next fight
> - Ignore → Skip

**Breeding Opportunity**
> "A wild creature! You can capture it as a stable member."
> - Only offered if stable has space
> - Creature is a random species at C-grade (basic genetics)
> - Free — no gold or DNA cost

---

## World Progression Across Worlds

### World Count (TBD)
Target: 5–7 worlds. Each world introduces a new enemy faction with distinct abilities.

| World | Theme | Enemy Faction | Unique Mechanic Idea |
|-------|-------|---------------|---------------------|
| 1 | Basement Lab | Goobs (blobs) | Attrition, basic attacks |
| 2 | Research Wing | TBD | Status effects (slow?) |
| 3 | Security Level | TBD | Armor/damage reduction |
| 4 | Executive Floor | TBD | Shields, healing enemies |
| 5 | Director's Sanctum | TBD | Multi-phase boss |

### Inter-World Progression
Between worlds:
- Full lab phase (heal, breed, restock)
- World shop (larger selection, higher gold from boss reward)
- Difficulty scaling: Enemy HP and attack scale up per world

---

## Difficulty Calibration Targets

### First Run
| Metric | Target |
|--------|--------|
| Reach Encounter 3 | 80%+ |
| Reach Mini-Boss | 40–70% |
| Defeat Mini-Boss | 20–40% |
| Reach Boss | 10–30% |
| Defeat Boss | 5–15% |

### Run 10 (with genetic upgrades)
| Metric | Target |
|--------|--------|
| Reach Mini-Boss | 80%+ |
| Defeat Mini-Boss | 60–80% |
| Reach Boss | 50–70% |
| Defeat Boss | 30–50% |

These targets should be validated by simulation (`scripts/full-run-sim.ts`) before finalizing enemy stats.
