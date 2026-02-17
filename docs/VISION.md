# Squad Battler: Vision Document

## Elevator Pitch

A strategic squad battler where players escape the bottom floor of an evil corporate science lab by breeding increasingly powerful creatures across hundreds of runs. Combine genetic breeding mechanics with roguelike progression: manipulate genetic potential, crossbreed exotic species, and build the ultimate squad to defeat a gauntlet of corporate-engineered monsters.

**Comparable to:** *Slay the Spire* meta-depth × *Pokemon breeding* genetics × *Into the Breach* tactical positioning.

---

## Story Context

You are a rogue scientist in the basement of MegaCorp Labs. The corporation has been engineering dangerous creatures for profit and power. Your only way out is up — through 9-10 floors of increasingly dangerous corporate experiments, run by run, breeding and evolving your own creatures from whatever specimens you can find at the bottom.

**World 1 — Basement Levels:** Primitive Goob experiments, poorly engineered blobs.
**World 2+** — TBD, escalating corporate creature tiers.

Every run you push further. Every defeat is data. Eventually, you escape.

---

## Design Pillars

### 1. Long-Term Strategic Planning
Success comes from understanding breeding mechanics, identifying synergies, and making trade-offs between immediate power and future genetic potential. This is a game of optimization across dozens of runs, not reflexes within a single battle.

### 2. Meaningful Failure
Every run should feel valuable, even losses. Defeat provides:
- Genetics Points earned based on floors reached
- Knowledge of enemy patterns and strategies
- Sometimes: unlocks from mini-boss/boss kills carried across runs
- The squad stays — defeated creatures can be bred from in the lab

### 3. Emergent Squad Dynamics
Combat revolves around the interplay between squad composition and encounter design. Units combine their latent genetic potential with run-acquired items. No single unit wins — the squad wins together.

### 4. Meaningful Choice Architecture
Every decision presents real trade-offs:
- **Spend now** (items for this run) vs **invest later** (genetics for future runs)
- **Specialized breeding** (one perfect unit) vs **versatile teams** (balanced coverage)
- **Progress further this run** (unlock mini-boss species) vs **survive longer** (heal and prepare)

No choice should feel obviously correct.

---

## Core Gameplay Loop

### Meta Loop (Between Runs — The Lab)
```
Finish Run (win or lose)
  ↓
Earn Genetics Points based on progress
  ↓
Lab Phase:
  - Heal / revive creatures
  - Breed creatures (select parents → produce offspring)
  - Manage stable (store up to N creatures)
  - Apply unlocked lab equipment
  - Select squad for next run
  ↓
Begin new run with improved squad
```

### Run Loop (During a Run)
```
Run begins with selected squad
  ↓
[Repeat 9-10 times:]
  Combat Encounter
    ↓
  Shop Phase (after each combat)
    - Buy run-scoped items
    - Buy combat-scoped items
    - Occasionally: permanent items (rare)
  ↓
Mini-Boss Encounter (mid-world)
  ↓
Final Boss Encounter (end of world)
  ↓
Return to lab (win or lose)
```

---

## Progression Scale

- **50–200 runs** to complete a full escape (all worlds)
- **Most runs end in defeat** — this is expected and designed for
- **First run:** Player should reach at least the mini-boss, possibly defeat it with good play
- **Runs 2–10:** Learning genetics, first boss kills, unlocking species
- **Runs 10–50:** Mastering breeding, optimizing squads
- **Runs 50–200:** Completing full escape, attempting harder challenges

---

## The "Aha!" Moment

> "My 8th-generation Tiger just solo-carried the mini-boss fight. It inherited the Ferocity mutation from its grandmother, the Speed genes from its father, and picked up Haste Serum this run. I built this creature across a dozen careful breeding decisions. Now I'm planning its offspring to be even better..."

The moment players realize **they're creating a genetic legacy** — not just playing units — is when the game becomes unforgettable.

---

## Feel & Rhythm

### Session Rhythm
| Phase | Duration | Feel |
|-------|----------|------|
| Lab Phase | 2–5 min | Calm, strategic, sciencey |
| Combat Sequence (9-10 fights) | 10–20 min | Escalating tension |
| Shop Phases | 30–60 sec each | Quick tactical decisions |
| Mini-Boss | 1–3 min | Spike of challenge |
| Boss Encounter | 2–5 min | Climactic test |
| Return to Lab | Variable | Relief, reflection, planning |

### How It Should Feel
**Thoughtful, not frantic.** Players are mad scientists experimenting with genetics.
**Discovery-driven.** Joy from finding powerful genetic combinations and synergies.
**Progression despite defeat.** Every run is an investment, not a waste.

---

## Design Principles

1. **Respect Player Agency** — Choices matter; avoid pure RNG outcomes
2. **Depth Over Complexity** — Simple systems with interesting interactions
3. **Multiple Paths to Victory** — No single "correct" breeding strategy
4. **Meaningful Failure** — Defeat teaches and unlocks, doesn't just punish
5. **Balanced Immediate vs. Long-Term** — Shop decisions always have real trade-offs
6. **Genetic Accessibility** — Feel approachable but reveal depth to experts

---

## Success Metrics

### Simulation Targets
| Scenario | Target |
|----------|--------|
| First run mini-boss reach rate | 40–70% |
| First run boss reach rate | 10–30% |
| First run boss win rate | 0–10% |
| Run 5 boss win rate | 15–35% |
| Run 10+ boss win rate | 40–70% |
| Average run duration | 15–30 min |
| Average damage per encounter | 20–40% of squad HP |

### Qualitative Targets
- Players name/remember specific creatures by lineage
- "Just one more run" addictiveness
- Losses feel fair and instructive, not frustrating
- Players feel clever when a genetic plan succeeds

---

## Open Questions

### Priority Design Decisions
- [ ] Final squad size (currently 3 — keep or increase to 4-5?)
- [ ] Number of worlds (3? 5? 7?)
- [ ] Exact species unlock progression (which mini-boss unlocks which?)
- [ ] Lab equipment unlock tree (which boss unlocks what?)
- [ ] Genetic inheritance rules (see genetics-breeding.md)

### Systems Needing Detailed Design
- [ ] Combat status effects (stun, poison, bleed?)
- [ ] Enemy design philosophy per world
- [ ] Difficulty scaling mechanics
- [ ] Save system architecture

---

*See `/docs/SYSTEMS.md` for system interaction overview.*
*See `/docs/systems/` for detailed designs per system.*
