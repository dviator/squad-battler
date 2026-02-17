# System Design: Combat

How battles work and how to make them strategically interesting.

---

## Overview

Combat is auto-battle: units fight automatically without player input. The player's decisions happen *before* combat (positioning, items, squad composition) and *after* (shop phase). During combat, the player watches the outcome unfold.

This design means:
- Battles should be **readable** — players understand why they won or lost
- **Pre-battle decisions are the skill expression**, not in-battle reactions
- Combat should feel exciting to watch, not arbitrary

---

## Combat Flow

### Initialization
1. Player squad (3 units) placed at Left/Center/Right positions
2. Enemy squad placed at opposing positions
3. Each unit's attack timers initialized to their `baseCooldown` values
4. Equipment states initialized (shields, dodge charges, etc.)

### Each Tick
1. All timers tick down by 1
2. Any unit whose timer reaches 0 executes an attack:
   - Resolve targets (based on `targetType`)
   - Calculate damage: `attackPower × damageMultiplier`
   - Apply equipment effects (shields, retaliations, dodges)
   - Apply damage to target
   - Reset attacker's timer to `baseCooldown - cooldownReduction`
3. Remove units with HP ≤ 0
4. Check win condition (all enemies dead = player wins, all players dead = player loses)
5. Repeat until win condition or tick limit

### Tick Limit
Maximum 200 ticks per battle. If reached, it counts as a player loss (enemies regenerate endlessly). In practice this should rarely trigger if numbers are balanced.

---

## Positioning

Three positions: `Left (0) | Center (1) | Right (2)`

Positioning affects targeting. Key targeting rules:

| Target Type | Behavior |
|-------------|----------|
| `OppositeEnemy` | Attack the enemy at the same position index |
| `LowestHpEnemy` | Attack whichever enemy has the lowest current HP % |
| `RandomEnemy` | Random living enemy |
| `AllEnemies` | Hit all living enemies (AoE, lower damage) |
| `RightEnemy` | Attack enemy one position to the right; fallback to opposite |
| `LeftEnemy` | Attack enemy one position to the left; fallback to opposite |
| `LeftAlly` | Attack ally to the left (support abilities) |
| `RightAlly` | Attack ally to the right (support abilities) |

**Positioning strategy examples:**
- Put your tankiest unit (Bear) at Left position to absorb `OppositeEnemy` attacks from the first Goob
- Put Eagle at Center to leverage `LowestHpEnemy` targeting on weakened Goobs
- Put Tiger at Right to use `LeftEnemy` rake on the leftmost Goob

---

## Damage Formula

```
damage = floor(attackPower × damageMultiplier)
```

No defense stat currently. Damage is pure and readable. If defense is added later, keep it simple: `final = max(1, damage - armor)`.

---

## Species Attack Profiles

### Bear
| Attack | Cooldown | Target | Multiplier | AoE |
|--------|----------|--------|------------|-----|
| Crushing Maul | 3 | Opposite | 1.5× | No |
| Terrifying Roar | 5 | All Enemies | 0.8× | Yes |
| Bear Hug | 4 | Random | 2.0× | No |

Bear identity: Slow, powerful single hits + occasional AoE. The squad's damage anchor.

### Eagle
| Attack | Cooldown | Target | Multiplier | AoE |
|--------|----------|--------|------------|-----|
| Dive Bomb | 2 | Opposite | 1.3× | No |
| Talon Slash | 3 | Lowest HP | 1.8× | No |
| Wing Strafe | 4 | Right Enemy | 1.5× | No |

Eagle identity: Fast attacks, finish-off weakened enemies, directional control.

### Tiger
| Attack | Cooldown | Target | Multiplier | AoE |
|--------|----------|--------|------------|-----|
| Pounce | 2 | Opposite | 1.2× | No |
| Savage Bite | 4 | Random | 2.5× | No |
| Rake | 3 | Left Enemy | 1.4× | No |

Tiger identity: High variance damage, directional attacks, burst potential.

---

## Equipment Effects in Combat

Equipment items are purchased in the shop and apply effects during combat. **Currently implemented as items but NOT yet active in battle.** This is a key Phase 4 implementation task.

| Equipment | Trigger | Effect |
|-----------|---------|--------|
| Bubble Shield | When first attacked | Block the hit (0 damage), shield consumed |
| Spike Armor | When hit by any attack | Deal 10 damage back to attacker |
| Speed Boots | Passive | +3 Speed (already works via initiative) |
| Mind Reader | Once per combat | Perfectly dodge one attack |
| Enemy Confuser | Per enemy attack | 30% chance enemy retargets randomly |
| Shield Generator | Passive (team) | All incoming damage ×0.8 |

### Implementation Notes
- Equipment state should be tracked per-unit per-combat (not permanent)
- Reset at the start of each combat
- Shield/dodge are "use once" — consumed after triggering
- Log equipment triggers clearly in combat log ("Shield absorbs 42 damage!")

---

## Combat Readability

The combat log (`src/cli/combatLog.ts`) displays turn-by-turn events. It must convey:
- Which unit attacked which
- What attack was used
- How much damage was dealt
- Whether any equipment triggered
- When a unit dies

**Good combat log format:**
```
Tick 3:
  Eagle uses Dive Bomb → Goob (Left)
    💥 Goob takes 33 damage! (187/250 HP)

  Goob uses Gooey Slap → Eagle
    🛡️ Bubble Shield absorbs 16 damage! (Shield consumed)
    Eagle takes 0 damage (80/80 HP)

Tick 4:
  Bear uses Crushing Maul → Goob (Left)
    💥 Goob takes 30 damage! (157/250 HP)

  Goob uses Blob Tackle → Tiger
    💥 Tiger takes 20 damage! (80/100 HP)
```

**Loss readability:** When a player unit dies, the log must make it clear *how* — which attack over what sequence of hits.

---

## Future Combat Depth (Phase 7+)

These are planned but not in current scope:

### Status Effects
- **Slow:** Increase a unit's cooldown by 1–2 (reduces attack frequency)
- **Poison:** Deal N damage per tick for K ticks
- **Stun:** Skip next attack (once)
- **Bleed:** Multiplicative damage over time

Status effects would add tactical layers — certain mutations could grant resistance, certain attacks could apply status, positioning could affect spread.

### Multi-Phase Bosses
Boss has 50% HP threshold trigger: enters second phase with new attacks or abilities.

### Terrain/Environmental Effects
Certain encounters have environmental modifiers (e.g., "Unstable Floor: AoE attacks hit allies too"). Adds variety to encounters without requiring new enemy designs.

---

## Balance Targets

| Metric | Target |
|--------|--------|
| Average battle duration (regular) | 8–14 ticks |
| Average HP lost per regular encounter | 15–30% of squad total |
| Average HP lost per elite encounter | 25–40% of squad total |
| Average HP lost vs mini-boss | 40–60% of squad total |
| Items improving win rate (1 Haste) | +5–15% vs regular |
| Items improving win rate (all Haste) | +20–40% vs regular |

These targets should be validated and maintained in `docs/balance/simulation-results.md` after each enemy tuning pass.
