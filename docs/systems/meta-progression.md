# System Design: Meta-Progression

How players grow stronger between runs.

---

## Overview

Meta-progression is what transforms Squad Battler from a game you play once into a game you play for 50–200 runs. Every run, whether victory or defeat, contributes meaningfully to long-term progress. This is achieved through two mechanisms: **DNA Points** (spendable currency) and **Unlocks** (permanent capability expansion).

---

## DNA Points (The Meta Currency)

DNA Points represent genetic material and research knowledge accumulated through combat. They are earned every run regardless of outcome, and spent in the lab between runs.

### Earning DNA

| Source | DNA Earned |
|--------|-----------|
| Per regular encounter cleared | 2 DNA |
| Per elite encounter cleared | 5 DNA |
| Mini-boss first kill | 20 DNA (bonus) |
| Mini-boss repeat kills | 10 DNA |
| Boss first kill | 40 DNA (bonus) |
| Boss repeat kills | 20 DNA |
| Minimum per run (0 encounters) | 5 DNA (participation reward) |

**Economy targets:**
- Average run yields 15–30 DNA
- A 10-run "session" yields 150–300 DNA
- First breeding unlock costs 10 DNA (achievable in one good run)
- Advanced upgrades cost 100–300 DNA (require multiple runs)

### Spending DNA

**Lab — Breeding:**
| Action | Cost |
|--------|------|
| Basic breed (random inheritance) | 10 DNA |
| Directed breed (focus a stat) | 25 DNA (requires Advanced Incubator) |
| Breed across species | 20 DNA (requires Genetic Splice Chamber) |

**Lab — Healing:**
| Action | Cost |
|--------|------|
| Heal one creature to full | 5 DNA |
| Revive defeated creature | 10 DNA |

**Lab — Permanent Upgrades (via equipment):**
These are unlocked by defeating bosses, not purchased. See Unlock System below.

---

## Unlocks

Unlocks are triggered by boss/mini-boss defeats, not purchased. They permanently expand what's possible in the lab and in runs.

### Mini-Boss Unlocks (Species)

Defeating a mini-boss for the first time unlocks a new species for breeding.

| World 1 Mini-Boss | Unlocks |
|-------------------|---------|
| Mega Goob | Species: [TBD — needs design] |

Design intent: The unlock species should offer a meaningfully different strategic profile than Bear/Eagle/Tiger. Consider a tanky defender or a support-style unit.

Unlocked species:
- Appear as available parents in the breeding UI
- Can be produced as offspring (one parent must be the species or a hybrid)
- Have unique attack set matching their identity

### Boss Unlocks (Lab Equipment)

Defeating a world boss for the first time unlocks permanent lab equipment.

| World 1 Boss | Unlocks |
|--------------|---------|
| [TBD Boss] | Genetic Scanner |

**Lab Equipment Progression (draft):**

**Tier 1 — World 1 Boss:**
- **Genetic Scanner** — Reveals exact grade letters (previously shown as ranges). Enables informed breeding decisions.

**Tier 2 — World 2 Boss:**
- **Advanced Incubator** — Adds "Directed Breeding" option. Pay extra DNA to bias inheritance toward a specific stat. (See genetics-breeding.md)

**Tier 3 — World 3 Boss:**
- **Genetic Splice Chamber** — Enables cross-species breeding. Offspring can inherit attack types from either parent species.

**Tier 4 — World 4 Boss:**
- **Mutation Lab** — Enables deliberate mutation cultivation. Spend DNA to add a specific mutation to a creature (previously random-only).

**Tier 5 — World 5 Boss:**
- **Expanded Stable** — Stable capacity increases from 6 to 12 creatures.

---

## The Stable

The stable is where non-active creatures are stored between runs.

### Rules
- **Capacity:** 6 creatures initially (upgradeable)
- **Persistence:** All stable creatures survive between runs, retaining their stats, mutations, and genetics
- **Squad selection:** At lab start, player picks 3 from their stable + squad survivors
- **Defeated creatures:** After a run where a creature dies, it moves to the stable (injured state). Must pay 10 DNA to revive, or 5 DNA to heal back to full if just damaged.
- **Releasing:** Player can release a creature to free a stable slot (permanent — no recovery)

### Starting State

Run 1 begins with the default squad (Bear/Eagle/Tiger) pre-loaded. These three creatures ARE the stable initially. After run 1, they return to the stable with their current HP, and the lab phase begins.

---

## Progression Pacing

### Early Game (Runs 1–10)
- Earning DNA, learning the shop meta
- First creature deaths (learning cost of healing/reviving)
- First mini-boss kill → first species unlock
- DNA spent primarily on healing, maybe first breed

### Mid Game (Runs 10–50)
- Active breeding program underway
- First S-grade stat achieved in a creature
- Multiple lab equipment unlocked
- Stable actively managed (which creatures to keep, release, breed)
- Strategic decisions about breeding for THIS run vs FUTURE potential

### Late Game (Runs 50+)
- Near-perfect genetic grades achieved
- Breeding for specific mutation combinations
- Cross-species hybrids possible
- Stable at full capacity, curated bloodlines
- Speed-running optimized squads

---

## Design Considerations

**Avoid grinding:** DNA income should feel fast enough that players aren't farming boring runs. Target: meaningful breeding every 1–2 runs.

**Avoid optimal-path lock-in:** Multiple breeding strategies should work. Speed-focused Tiger lines should be as viable as HP-focused Bear lines.

**Avoid "save scumming" temptation:** Breeding should have enough variance that players accept results rather than wanting to re-roll. The rerolling mechanic (Directed Breeding) exists for this but costs extra DNA.

**Preserve attachment:** Don't make releasing creatures feel required. Stable management should feel like curating a team, not executing beloved pets for slots.
