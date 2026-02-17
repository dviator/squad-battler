# System Design: Genetics & Breeding

The core unique mechanic of Squad Battler.

---

## Overview

Every creature has a genetic blueprint that determines its potential. Breeding two creatures produces an offspring that inherits a blend of both parents' genetics — sometimes better than either parent, sometimes worse. Over many generations of careful selection, players can cultivate creatures that far exceed the starting units.

---

## Genetic Grades

Each stat has a **Genetic Grade** (F through S) that determines the range of values the stat can take.

### Grade Table

| Grade | Stat Range (multiplier on base) | Interpretation |
|-------|--------------------------------|----------------|
| F | 50–70% of base | Significantly below average |
| D | 65–85% of base | Below average |
| C | 80–100% of base | Average (starting units) |
| B | 95–115% of base | Above average |
| A | 110–130% of base | Significantly above average |
| S | 125–150% of base | Elite — requires deliberate breeding |

### Stat Draw

When a unit is created from breeding, each stat is drawn randomly within its grade's range. Starting units are C-grade across all stats (average). Breeding aims to push grades up toward B, A, and eventually S.

**Example:**
A Tiger with Speed grade A draws from 110–130% of base speed (12). That's 13.2–15.6, rounded to 13–15.

---

## Breeding Mechanics

### Basic Breeding

Select two creatures as parents. The offspring inherits grades from both parents.

**Inheritance Algorithm (per stat):**

```
For each stat (maxHp, speed, attackPower):
  1. Roll: 40% chance inherit higher parent's grade
            40% chance inherit lower parent's grade
            15% chance inherit one grade above higher parent
            5%  chance inherit one grade below lower parent
```

This means:
- Breeding two A-grade Speed creatures: 15% chance of S, 80% chance of A, 5% chance of B
- Breeding an A + C grade: 40% chance A, 40% chance C, 15% chance B, 5% chance D
- Progress is possible but not guaranteed — creates tension and stakes

### Directed Breeding (Requires Advanced Incubator)

Pay extra DNA (25 instead of 10) to focus on one stat. That stat uses:

```
Roll: 55% chance inherit higher parent's grade
      30% chance inherit lower parent's grade
      15% chance inherit one grade above higher parent
      0%  chance of downgrade
```

This significantly accelerates advancement in a chosen stat at the cost of resources.

### Species Constraints (Basic vs. Cross-Species)

**Basic breeding (same species):** Both parents must be the same species. Offspring is same species. Full stat inheritance.

**Cross-species breeding (Requires Genetic Splice Chamber):**
- Parents can be different species
- Offspring species determined 50/50 from parents
- Attack set inherited: offspring gets one attack from each parent's species kit, plus draws one from either
- Creates unique hybrids with mixed attack profiles
- Stat inheritance works the same way

---

## Mutations

Mutations are special heritable traits that modify a creature's behavior beyond stats.

### Existing Mutations

| Mutation ID | Effect | How to Acquire |
|-------------|--------|----------------|
| `thick_hide` | +20 max HP | Shop item, or inherit from parent |
| `swift_reflexes` | +5 speed | Shop item, or inherit from parent |
| `powerful_muscles` | +8 attack | Shop item, or inherit from parent |
| `enhanced_ferocity` | +15 attack (permanent) | Ferocity Enhancement item (5% proc) |
| `enhanced_resilience` | +30 max HP (permanent) | Resilience Enhancement item (5% proc) |
| `enhanced_agility` | +5 speed (permanent) | Agility Enhancement item (5% proc) |

### Planned Mutations (to design)

Consider mutations that affect combat behavior, not just stats:
- `pack_hunter` — Deals +20% damage when an ally already attacked this target this tick
- `berserker` — Deals +5% damage for each 10% HP missing
- `regenerator` — Recovers 5 HP per combat tick (passive)
- `first_strike` — First attack each combat has +50% damage multiplier
- `resilient` — Cannot be reduced below 1 HP more than once per combat

### Mutation Inheritance

When breeding, each parent's mutations may pass to offspring:
- Each mutation: **50% inheritance chance** per parent
- If both parents have the same mutation: **75% chance** offspring inherits it
- Maximum mutations per creature: **3** (prevents stacking becoming game-breaking)
- If inheritance would exceed 3: player chooses which mutations to keep

### Acquiring New Mutations

1. **Shop items** — Mutation Serums add a specific mutation permanently
2. **Enhancement items** — 5% chance to convert a run-scoped boost to a permanent mutation
3. **Breeding** — Inherit from parents
4. **Mutation Lab** (late unlock) — Spend DNA to add a specific mutation deliberately

---

## Generation & Lineage

Every creature tracks its generation and parentage.

```typescript
unit.generation  // 1 = starting unit, 2 = first bred generation, etc.
unit.parentIds   // [parentAId, parentBId] — empty for gen 1
```

**Generation matters for:**
- Display (players see "Gen 4 Tiger (Ferocity Line)")
- Pride/attachment (your creatures have a history)
- Potentially: very high generation unlocks flavor text or cosmetic distinction

**Lineage display in UI:**
```
Tiger "Fang" (Gen 6)
  Parents: Tiger "Claw" × Tiger "Storm"
  Grades: HP:B SPD:A ATK:S
  Mutations: swift_reflexes, powerful_muscles
```

---

## Genetic Potential Cap

The genetic system has a hard ceiling: S-grade. Even perfect breeding cannot exceed S-grade. This ensures:
- There is always a clear ceiling to work toward
- Players know when a stat is "done"
- Power scaling is bounded and balanced

An S-grade creature is genuinely elite but not infinitely more powerful than a C-grade. The multipliers cap at 1.5× base stats.

---

## Balance Targets

**Time to first S-grade (any stat):**
- Optimal play, one stat focus: ~8–12 breeds (15–25 runs)
- Casual play, mixed focus: ~20–30 breeds (40–60 runs)

**Full S-grade squad:**
- Optimal play: ~100 breeds across all stats
- Casual play: ~200+ breeds

**Mutations: full catalog:**
- ~30–50 runs to accumulate 1–2 desired mutations per creature

---

## Breeding UI Flow

```
Lab Menu → "Breed Creatures"
  ↓
Select Parent A (from stable)
  ↓
Select Parent B (from stable, different creature)
  ↓
Preview screen:
  - Parent A grades: HP:C SPD:A ATK:B
  - Parent B grades: HP:B SPD:B ATK:A
  - Offspring grade ranges (with probabilities if Scanner unlocked):
      HP: B-C (40%B, 40%C, 15%A, 5%D)
      SPD: A-B (40%A, 40%B, 15%S, 5%C)
      ATK: A-B (40%A, 40%B, 15%S, 5%B)
  - Mutation preview: "May inherit: swift_reflexes (50%)"
  - Cost: 10 DNA
  ↓
Confirm → Pay DNA → Offspring created → Added to stable
(If stable full: must release a creature first)
```

---

## Design Principles for Genetics

1. **Visible progress** — Players should see grade improvements over generations
2. **Bounded RNG** — Grades never drop more than one below worst parent (5% chance)
3. **Informed decisions** — Players can see grade ranges before breeding
4. **Attachment** — Lineage tracking makes creatures feel valuable and irreplaceable
5. **Not a slot machine** — Directed Breeding exists so players aren't purely at RNG's mercy
6. **Accessible entry** — Basic breeding (pick two, pay DNA) is immediately understandable
7. **Deep endgame** — Mutation combinations and cross-species hybrids add depth for advanced players
