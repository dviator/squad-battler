# Systems Overview

How all major systems in Squad Battler interconnect. Each system has its own detailed doc in `/docs/systems/`.

---

## System Map

```
┌─────────────────────────────────────────────────────────────────┐
│                         THE LAB (Meta Hub)                       │
│  Healing → Breeding → Squad Management → Equipment Management    │
└────────────────────────┬────────────────────────────────────────┘
                         │ produces/improves
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                          THE SQUAD                               │
│  Units with: Base Stats, Genetic Potential, Mutations, Species   │
└────────────────────────┬────────────────────────────────────────┘
                         │ enters
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                           THE RUN                                │
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Combat 1 │───▶│  Shop 1  │───▶│ Combat 2 │───▶│  Shop 2  │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│        ▲                                               │         │
│        │ (x9-10 encounters)                            ▼         │
│  ┌──────────┐                                    ┌──────────┐   │
│  │Mini-Boss │◀───────────────────────────────────│  ...     │   │
│  └──────────┘                                    └──────────┘   │
│        │                                                         │
│        ▼                                                         │
│  ┌──────────┐                                                    │
│  │  Boss    │                                                    │
│  └──────────┘                                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │ results feed back
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      META PROGRESSION                            │
│  Genetics Points → Lab Unlocks → Species Unlocks → Equipment     │
└─────────────────────────────────────────────────────────────────┘
```

---

## System Responsibilities

### 1. Genetics & Breeding
**What it does:** Determines unit base stats and enables improvement across runs.

- Units have **genetic potential grades** (F → S) per stat
- Grades determine stat ranges at creation
- **Breeding** combines two units' genetics to produce offspring
- **Mutations** are heritable special traits
- This is the primary long-term progression system

**Feeds into:** Squad quality, combat outcomes
**Fed by:** Lab Phase, run rewards (DNA Points)
**Detailed in:** `docs/systems/genetics-breeding.md`

---

### 2. Combat
**What it does:** Resolves encounters between player squad and enemy groups.

- **Auto-battle:** Units attack automatically on cooldown timers
- **Positioning:** 3 positions (Left/Center/Right) affect targeting
- **Attack variety:** Each species has 3 unique attacks with different target types
- **Damage system:** attackPower × damageMultiplier vs flat HP
- Battles end when one side is fully defeated

**Feeds into:** HP state after battle, gold earned, run progression
**Fed by:** Squad genetics, run-scoped items, equipment
**Detailed in:** `docs/systems/combat.md`

---

### 3. Economy & Items
**What it does:** Governs resources and how players spend them.

**Three-tier item structure:**
- **Permanent items** — persist across all future runs (expensive, rare)
- **Run-scoped items** — last for current run only (moderate cost)
- **Combat-scoped items** — single-use tactical tools (cheap)

**Resources:**
- **Gold** — earned per encounter, spent in shop
- **Genetics Points** (DNA) — earned per run, spent in lab on breeding/upgrades

**Feeds into:** Unit stats, run outcomes, lab capabilities
**Fed by:** Combat victories, boss kills
**Detailed in:** `docs/systems/economy.md`

---

### 4. Meta Progression
**What it does:** Provides meaningful advancement between runs.

- **Genetics Points** earned based on run progress
- **Lab upgrades** unlocked by boss defeats (permanent capabilities)
- **Species unlocks** triggered by mini-boss defeats
- Creatures and their genetics persist in the stable between runs

**Key design goal:** Every run contributes to long-term progress, even losses.

**Feeds into:** Lab capabilities, available species, breeding options
**Fed by:** Run outcomes (floors reached, bosses killed)
**Detailed in:** `docs/systems/meta-progression.md`

---

### 5. World Progression
**What it does:** Structures each run into escalating encounters.

- **9–10 encounters per world** (regular → mini-boss → boss)
- Each encounter has a **type** (regular, elite, mini-boss, boss)
- **Enemy compositions** scale in difficulty
- **Gold rewards** and **drop rates** vary by encounter type

**Feeds into:** Player resources, run pacing, unlock triggers
**Fed by:** World design, difficulty scaling
**Detailed in:** `docs/systems/world-progression.md`

---

## Key Cross-System Interactions

### Genetics × Combat
The primary feedback loop. Better genetics → better combat outcomes → more resources → better breeding → better genetics.

### Economy × Meta-Progression
The strategic tension. Spend gold on THIS run (items) vs earn DNA Points to improve FUTURE runs. Neither should obviously dominate.

### Unlock System × Species Diversity
Defeating mini-bosses unlocks new species for breeding. This expands genetic diversity and opens new strategic possibilities. Early unlocks are intentionally limited to create appreciation for new options.

### Items × Run Length
Shop items are run-scoped — they don't carry over. This means later encounters in a run are fought with accumulated buffs from multiple shop phases, creating escalating power curves within each run.

---

## Implementation Status

| System | Status | Priority |
|--------|--------|----------|
| Combat (core) | ✅ Implemented | — |
| Combat (positioning) | ✅ Implemented | — |
| Combat (attack variety) | ✅ Implemented | — |
| Economy (shop/gold) | ✅ Implemented | — |
| Economy (three-tier items) | ⚠️ Partial (run+combat, missing permanent) | High |
| Genetics (potential grades) | ✅ Implemented | — |
| Genetics (mutations) | ⚠️ Partial (exists, not integrated) | High |
| Breeding | ❌ Not implemented | Critical |
| Meta Progression | ❌ Not implemented | Critical |
| World Progression (structure) | ⚠️ Partial (campaign exists, wrong scale) | High |
| Lab Hub | ⚠️ Partial (healing only) | High |
| Unlock System | ❌ Not implemented | Medium |
| Equipment effects (combat) | ❌ Not implemented | Medium |
