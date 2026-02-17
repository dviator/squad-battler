# Implementation Roadmap

A prioritized, phased implementation plan for Squad Battler. Each phase produces a playable milestone that can be tested and validated before the next phase begins. Phases are ordered by dependency and player experience impact.

Design specs live in `/docs/systems/`. Refer to the relevant spec before implementing each system.

---

## Phase 1: Full World Structure
**Goal:** Replace the 2-encounter stub with a real 9-10 encounter world
**Playable milestone:** A full run feels like a real game session

### Tasks

**1.1 Expand World Structure** (`src/core/world.ts`)
- Define 9-10 encounter template for World 1
- Add encounter types: `regular | elite | mini_boss | boss`
- Add `dnaReward` field to encounters
- Ensure shop phase triggers after every encounter (including after mini-boss)
- Encounters 1–3: 2× Goob
- Encounter 4 (Elite): 3× Goob or add Heavy Goob
- Encounter 5: 2× Goob
- Mini-Boss (slot 5–6): Mega Goob
- Encounters 6–8: 2× Goob (gradually harder compositions)
- Encounter 8 (Elite): harder composition
- Boss (slot 9–10): TBD — for now reuse Mega Goob with buffed stats

**1.2 Create Heavy Goob** (`src/data/enemies.ts`)
- HP: ~300, Speed: 7, Attack: 25
- Attacks: Mega Slam only (slower, harder hits)
- Used in elite encounters as difficulty spike

**1.3 Update Campaign System** (`src/core/world.ts`, `src/cli/game.ts`)
- Game loop must iterate through all 9-10 encounters before hitting boss
- Track `currentEncounterIndex` through full world
- Display encounter number to player ("Encounter 3/10")

**1.4 Update Balance Simulation** (`scripts/full-run-sim.ts`)
- Simulate all 9-10 encounters instead of just 2
- Track per-encounter win rates and HP attrition
- Validate total run difficulty against targets in `docs/systems/world-progression.md`

**Simulation target before moving to Phase 2:**
- First-run mini-boss reach rate: 40–70%
- First-run boss reach rate: 10–30%
- Average HP remaining at mini-boss: 40–60% of max

---

## Phase 2: DNA Currency & Lab Foundation
**Goal:** Earning DNA and spending it in the lab provides the first meta-progression experience
**Playable milestone:** First sense of persistent progress between runs

### Tasks

**2.1 Add DNA to Run Results** (`src/core/types.ts`, `src/core/world.ts`)
- Add `dnaReward: number` to Encounter type
- Track total DNA earned during run
- Display DNA earned on run end screen

**2.2 Persistent State** (`src/core/gameState.ts`)
- Add `dnaPoints: number` to persistent state (not reset on run end)
- Add `unlockedSpecies: string[]` (starts with Bear, Eagle, Tiger)
- Add `unlockedLabEquipment: string[]` (starts empty)
- Save/load between runs (currently resets — persist stable + DNA)

**2.3 Lab Phase UI** (`src/cli/phases.ts`, `src/cli/game.ts`)
- Trigger lab phase after run ends (win or lose), NOT during run
- Lab menu:
  - "Heal creatures" (5 DNA each)
  - "Manage stable" (view, release creatures)
  - "Select squad for next run"
- DNA cost display
- Confirm/start next run

**2.4 Stable Persistence**
- Creatures in stable survive between runs
- Squad members that die in combat are moved to stable (injured, not dead)
- Full stable persistence across runs

---

## Phase 3: Breeding System
**Goal:** Players can breed creatures in the lab to improve genetic grades
**Playable milestone:** First "bred" creature noticeably stronger than starting units

### Tasks

**3.1 Breeding Algorithm** (`src/core/genetics.ts`)
- Implement `inheritGrade(gradeA, gradeB): GeneticGrade`
  - Weighted distribution per spec in `docs/systems/genetics-breeding.md`
- Implement `inheritMutations(mutA, mutB): string[]`
  - Each mutation: 50% inheritance chance
- Implement `breedUnits(parentA, parentB): Unit`
  - New unit with inherited grades, drawn stats, inherited mutations
  - `generation` field incremented
  - `parentIds` tracked for lineage

**3.2 Breeding UI** (`src/cli/phases.ts`)
- Add "Breed creatures" to lab menu
- Select parent A from stable
- Select parent B from stable (different unit)
- Preview offspring grades (show ranges)
- Confirm breeding → pay 10 DNA → add offspring to stable
- If stable is full (6 slots): must release a creature first

**3.3 Stable Management UI**
- List all creatures in stable with stats, grades, mutations
- Release creature (with confirmation)
- Set active squad (pick 3 from stable)
- Mark creatures as "breeding stock" (cosmetic, for player organization)

**3.4 Simulation: Validate Breeding Ladder**
- Script: `scripts/sim-breeding.ts`
- Simulate 50 runs of breeding optimization
- Verify grade improvement cadence matches targets in spec

---

## Phase 4: Equipment Effects in Combat
**Goal:** Equipment items purchased in shops actually do things in combat
**Playable milestone:** Strategic item choices feel meaningful

### Tasks

**4.1 Equipment State Tracking** (`src/core/types.ts`)
- Add `combatEquipmentState` per unit (shields, dodges, etc.)
- Reset each combat start

**4.2 Implement Equipment Effects** (`src/core/battle.ts`)
Priority order per `docs/systems/combat.md`:
1. Bubble Shield (block first hit)
2. Spike Armor (retaliation damage)
3. Speed Boots (already works — verify)
4. Mind Reader (one dodge per combat)
5. Enemy Confuser (30% retarget chance)

**4.3 Combat Log Events**
- Add `ShieldBlocked`, `DodgeTriggered`, `RetaliationDamage` event types
- Display in combat log with distinct messages

**4.4 Simulation: Equipment Value**
- Add equipment scenarios to `scripts/balance-test.ts`
- Verify each item provides meaningful but not overwhelming benefit

---

## Phase 5: Species Unlocks
**Goal:** Defeating mini-boss unlocks a new species available for breeding
**Playable milestone:** First unlock moment — "I can breed with THIS now?"

### Tasks

**5.1 Design World 1 Unlock Species**
- Must fill a strategic gap in Bear/Eagle/Tiger roster
- Consider: tanky defender (Rhino? Turtle?), support/healer, speed striker
- Full species design: stats, 3 attacks with distinct identity

**5.2 Implement Unlock Trigger**
- On mini-boss first kill → add species to `unlockedSpecies` in persistent state
- Show unlock notification: "NEW SPECIES UNLOCKED: [Name]!"
- Species now available for breeding in lab (as parent or offspring)

**5.3 Add Unlock Species to Breeding UI**
- Show locked species as grayed-out in breeding menu with "Defeat Mini-Boss to unlock"
- After unlock: fully available, with its own stats and attacks

---

## Phase 6: Lab Equipment Unlocks (Tier 1)
**Goal:** Defeating the boss unlocks permanent lab capabilities
**Playable milestone:** Second major unlock — game meaningfully expands

### Tasks per spec in `docs/systems/meta-progression.md`:

**6.1 Genetic Scanner**
- After unlock: show exact grade letters (not ranges) for all creatures
- Before unlock: show grade ranges with uncertainty ("B-A range")

**6.2 Advanced Incubator**
- After unlock: breeding UI adds "Focus" option (reroll lower stat toward higher)
- Implement directed breeding logic in `breedUnits()`

**6.3 Expanded Stable**
- After unlock: stable capacity increases from 6 → 10
- UI shows new slots

---

## Phase 7: Polish & Depth
**Goal:** Game feels complete and well-paced for early playable demo
**Playable milestone:** Ready for external playtesting

### Tasks

**7.1 World 1 Boss Design**
- Design unique boss with distinct mechanics (not just buffed Mega Goob)
- Implement multi-phase or special mechanic

**7.2 Random Events**
- 1–2 random events per run between encounters
- Per spec in `docs/systems/world-progression.md`

**7.3 Display Improvements**
- Show run summary: encounters cleared, DNA earned, boss status
- Show lineage/generation in unit display
- Show genetic grade visualizations

**7.4 DNA Economy Tuning**
- Run simulation: 20 simulated "player sessions" over 50 runs each
- Verify DNA income vs. spend rates match spec
- Adjust costs or rewards based on results

**7.5 Difficulty Calibration Pass**
- Run full simulation suite with all systems in place
- Adjust enemy HP/attack to hit targets in `docs/systems/combat.md`
- Validate full difficulty curve: runs 1, 5, 10, 20, 50

---

## Phase 8: UI Layer (Future)
**Goal:** Replace CLI with proper game UI
**Note:** Do this AFTER all game logic is solid and validated

The CLI is a functional prototype. The game logic should be fully separated from the CLI layer already (it largely is, in `src/core/`). When the time comes, swap `src/cli/` for a proper UI framework without touching `src/core/`.

---

## Simulation Checkpoints

Run these simulations at each phase completion to verify balance:

| Phase | Simulation | Pass Criteria |
|-------|-----------|---------------|
| 1 | `scripts/full-run-sim.ts` (9-10 encounters) | Mini-boss reach 40-70% |
| 2 | Run with DNA tracking | DNA income feels meaningful |
| 3 | `scripts/sim-breeding.ts` | S-grade requires 20+ targeted breeds |
| 4 | `scripts/balance-test.ts` with equipment | Each item provides 10-30% improvement |
| 5 | Visual QA | Unlock moment feels satisfying |
| 6 | `scripts/sim-breeding.ts` with Scanner | Directed breeding meaningfully faster |
| 7 | Full suite | All difficulty targets hit |

---

## Implementation Principles

When implementing any system:
1. **Write simulation first** — Validate the design before building UI
2. **Core logic in `src/core/`** — Keep it decoupled from CLI
3. **No magic numbers** — Constants should be named and in data files
4. **Test the loop** — Each phase should produce a playable experience to test
5. **Refer to the spec** — If unsure about a design decision, check `docs/systems/`
6. **Don't design in code** — If the spec doesn't cover something, raise it before implementing

---

*Last updated: Phase 1 ready to begin. Balance agent completing enemy stat calibration.*
