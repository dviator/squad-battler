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

**Tick auto-battle** (current web runtime):
- Units fire on independent cooldown timers; 3 positions affect targeting
- Each player species has 1 starting attack; `additionalAttacks[]` pools 2 more for future level-up system
- Enemy species keep all attacks active at all times
- Damage: `attackPower × damageMultiplier`; battles end when one side reaches 0 HP

**Card combat engine** (core complete; UI pending design-007 Q1–Q6):
- Draw 3 cards per turn; choose top face (attack) or bottom face (defend/move/utility) per card
- Shared squad life total — no per-unit board HP
- Enemy intents telegraphed before player picks faces
- Directional targeting via existing `TargetType`; greedy cards (strong top, risky bottom)
- `GreedyPolicy` resolves headlessly for sim/balance; `simulateCardBattle` wired into `test:sim`
- `cardCombatSession.ts` phase machine + `useCardCombat` hook ready; wires into the player-facing UI once design-007 UX questions are answered

**Feeds into:** HP state after battle, gold earned, run progression
**Fed by:** Squad genetics, run-scoped items, equipment, card decks

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
**What it does:** Structures each run into escalating encounters across 10 floors.

- **10 floors** declared in `FLOOR_CATALOG` (9 regular + 1 bonus boss floor)
- Floor 1 (Goob campaign) is fully playable; floors 2–10 are structural placeholders
- Each floor carries a number, name, and theme tag; ends in a boss slot
- `getFloorProgress` returns current floor + overall progress; UI shows "Floor X / 10"
- Per-floor enemy compositions, mini-boss, and boss encounters not yet authored (pending design-003)

**Feeds into:** Player resources, run pacing, unlock triggers
**Fed by:** `FLOOR_CATALOG` data, per-floor content (human-authored)
**Detailed in:** `docs/systems/world-progression.md`

---

### 6. Web UI
**What it does:** Renders the full game experience in the browser. Mobile-first at ≥360px; responsive up to desktop.

- **Clinical Bright Lab design system** — semantic color tokens (`paper`/`panel`/`ink`/`accent`/`bio`/`danger`); all 5 views (menu, campaign, battle, shop, lab) share the palette
- **`CharacterCard`** — the single source of truth per unit: portrait (species-tinted art panel + emoji glyph, art-ready), HP bar, attack-turn timer bar, `SPEC-###` tag, grade badge, attack name; compact mode for horizontal strips; drives both combat state (live timer) and idle/shop state (cooldown preview label)
- **`SquadFrame`** — persistent squad strip kept on screen across combat and shop so units never disappear between phases; `highlightAll` prop pulses all alive cards when an item needs a target selection
- **Battle arena** — left↔right face-off (squad vs enemies), responsive, directional lunge animations on attack/hit
- **Battle log** — every attack line ends with `→ TargetName` or `→ A, B` (AoE), making targeting legible without separate UI treatment
- **Floor progress** — "Floor X / 10" in CampaignView header

**Feeds into:** Player-facing all systems
**Fed by:** All game systems via `gameStore`

---

## Key Cross-System Interactions

### Web UI × All Systems
All game state flows through `gameStore`; the UI renders it. Combat, economy, progression, and lab states all have dedicated views. UI changes are presentational — they never modify core system logic.

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
| Combat (tick auto-battle) | ✅ Implemented | — |
| Combat (positioning) | ✅ Implemented | — |
| Combat (attack variety — single starting attack + additionalAttacks pool) | ✅ Implemented | — |
| Combat (card engine: draw/choose/resolve, shared HP, intents, policy) | ✅ Implemented (core) | — |
| Combat (card combat UI) | ❌ Not implemented (blocked on design-007 UX decisions) | High |
| Economy (shop/gold) | ✅ Implemented | — |
| Economy (three-tier items) | ⚠️ Partial (run+combat, missing permanent) | High |
| Genetics (potential grades) | ✅ Implemented | — |
| Genetics (mutations) | ⚠️ Partial (exists, not integrated) | High |
| Breeding | ❌ Not implemented | Critical |
| Meta Progression | ❌ Not implemented | Critical |
| World Progression (structure) | ⚠️ Partial (10-floor FLOOR_CATALOG; only floor 1 has content) | High |
| Lab Hub | ⚠️ Partial (healing only) | High |
| Unlock System | ❌ Not implemented | Medium |
| Equipment effects (combat) | ❌ Not implemented | Medium |
| Web UI (design system) | ✅ Implemented (Clinical Bright Lab tokens, mobile-first) | — |
| Web UI (unit display) | ✅ Implemented (CharacterCard + SquadFrame persistent across phases) | — |
| Web UI (battle layout) | ✅ Implemented (left↔right face-off, animations, battle log with targets) | — |
| Web UI (shop layout) | ✅ Implemented (rebuilt around SquadFrame; tap-to-select buying flow) | — |
