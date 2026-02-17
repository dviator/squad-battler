# System Design: Economy & Items

Resource flow and item design for Squad Battler.

---

## Overview

The economy creates the moment-to-moment strategic tension during a run. Players always have limited gold and imperfect information about what's coming. Every shop phase requires a real decision: spend on this encounter, or conserve for a harder one ahead?

---

## Resources

### Gold (Run Currency)
- Earned through combat, reset to starting amount each run
- Spent in shops during the run
- **Starting gold:** 10g
- **Per regular encounter:** 4–6g (randomized)
- **Per elite encounter:** 8–12g
- **Mini-boss clear:** 15g
- **Boss clear:** 30g

**Economy targets:**
- Average run total gold available: ~80–120g across 9–10 encounters
- Average item spend per shop: 8–15g
- Players should never feel gold-infinite — choices matter

### DNA Points (Meta Currency)
- Earned based on run progress, never reset
- Spent in the lab between runs
- See `docs/systems/meta-progression.md` for rates

### Materials (Future)
- Currently exists in types but unused
- Reserved for future crafting or lab resource system
- Not in scope until Phase 6+

---

## Three-Tier Item Structure

### Tier 1: Permanent Items
Persist across ALL future runs. These are the most impactful items and the rarest.

- **Availability:** Very rare in shop (appears only after 3+ encounters, 30% chance)
- **Cost:** 50g — substantial commitment
- **Effect:** Permanently modifies a unit's genetic grade (upgrades one grade level)
- **Examples:**
  - Genetic Enhancer: Vitality — Upgrades HP potential by one grade (F→D, D→C, etc.)
  - Genetic Enhancer: Agility — Upgrades Speed potential
  - Genetic Enhancer: Power — Upgrades Attack potential

**Design note:** Permanent items represent the bridge between run economy and meta economy. They're expensive enough to require sacrifice (can't also buy healing), but valuable enough to be worth considering.

### Tier 2: Run-Scoped Items
Last for the current run only. Reset between runs. Applied to specific units.

- **Availability:** Uncommon (2–3 per shop)
- **Cost:** 8–25g
- **Effect:** Significant combat buffs that compound across the run

**Run-scoped item catalog:**

| Item | Cost | Effect |
|------|------|--------|
| Haste Serum | 8g | -1 cooldown on all attacks for target unit |
| Adrenaline Shot | 12g | -2 cooldown on all attacks for target unit |
| Ferocity Enhancement | 12g | +15 Attack Power (5% chance: permanent mutation) |
| Resilience Enhancement | 12g | +30 Max HP (5% chance: permanent mutation) |
| Agility Enhancement | 12g | +5 Speed (5% chance: permanent mutation) |

**Equipment items (run-scoped, no unit target required):**

| Item | Cost | Effect |
|------|------|--------|
| Prototype Bubble Shield | 7g | Blocks first attack per combat (one unit) |
| Enemy Confuser Mk-II | 6g | 30% chance enemies retarget per attack |
| Cutting-Edge Speed Boots | 8g | +3 Speed for target unit |
| Mind Reader Headset | 9g | Dodge one attack per combat (one unit) |
| Retaliation Spike Armor | 7g | Deal 10 damage back to attackers (one unit) |
| Experimental Shield Generator | 20g | -20% all damage taken (entire squad) |
| Squad-Wide Haste Field | 18g | +2 Speed to entire squad |

### Tier 3: Combat-Scoped Items
Single combat or single use. Cheap tactical tools.

- **Availability:** Always in shop (common), 3 options always available
- **Cost:** 3–10g
- **Effect:** Immediate HP restoration

**Healing item catalog:**

| Item | Cost | Effect |
|------|------|--------|
| Minor Healing Vial | 3g | Restore 20 HP to one unit |
| Healing Elixir | 6g | Restore 60 HP to one unit |
| Greater Restorative | 10g | Restore 120 HP to one unit |

**Planned future combat-scoped items (not yet implemented):**
- Rage Tonic (3g): +50% damage for next attack only
- Smoke Bomb (4g): Enemy misses next attack against this unit
- Field Medkit (8g): Restore 30 HP to ALL squad members

---

## Shop Generation

Each shop is generated fresh after every encounter. The shop always contains:
- All 3 healing potions (Tier 3, always available)
- 2–3 randomly selected run-scoped items (Tier 2)
- 50% chance of one rare item (Genetic Mod or team equipment)
- After encounter 3+: 30% chance of a permanent item (Tier 1)

**Shop refresh:** The shop does NOT refresh between shops. What you see is what's available until the next encounter.

---

## Economic Tension Design

### The Core Tension
Every shop forces a choice between competing needs:

1. **Survival now** — Buy healing to survive the next encounter
2. **Power this run** — Buy Haste/enhancement to push further
3. **Future investment** — Buy a permanent genetic upgrade for long-term benefit

A well-balanced economy means none of these is obviously correct. The right choice depends on:
- Current HP of squad members
- Gold available
- Which encounter is coming next (regular vs. elite vs. boss)
- Long-term genetic goals

### Anti-Patterns to Avoid

**Gold inflation:** If players have too much gold, they buy everything and choices disappear. Keep encounter gold rewards moderate.

**Gold starvation:** If players never have enough gold, the shop is irrelevant. Minimum 10g per encounter so every shop has at least one purchase.

**Optimal path:** If healing always wins or Haste always wins, there's no tension. Calibrate so multiple approaches succeed.

### The "Save for Boss" Pattern
A key strategic pattern: players should sometimes deliberately skip purchases in early encounters to save gold for a big boss-fight investment. This requires:
- Boss encounter gold rewards to be significant (players recovered investment after winning)
- At least one impactful item that costs 15–20g (worth saving for)

---

## Balance Targets

| Metric | Target |
|--------|--------|
| Average gold spent per run (winning run) | 70–100g |
| Percentage of runs where player buys healing | 60–80% |
| Percentage of runs where player buys run-scoped item | 70–90% |
| Percentage of runs where player buys permanent item | 20–35% |
| Runs where all-healing strategy beats all-haste | Roughly equal |
