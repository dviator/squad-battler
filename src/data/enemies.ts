import type { Species } from "../core/types";
import { TargetType } from "../core/types";

// World 1: Basement Levels - Goob enemies

export const GOOB: Species = {
  id: "goob",
  name: "Goob",
  description: "A gray blob that mindlessly attacks whatever is in front of it",
  baseStats: {
    // 200 HP: fast to kill (~3 ticks with focused player DPS), so each Goob
    // fires only 1-2 times before dying. Two Goobs deal ~40-60 HP total per
    // encounter — meaningful attrition across 10 encounters without being lethal.
    maxHp: 200,
    speed: 8,
    // 38 attack: slap (30) hits Bear/Tiger via OppositeEnemy, tackle (38) is
    // random. Creates the attrition needed so enc 1-5 filter ~40% of no-items runs.
    attackPower: 38,
  },
  attacks: [
    {
      id: "goob_slap",
      name: "Gooey Slap",
      baseCooldown: 3,
      targetType: TargetType.OppositeEnemy,
      damageMultiplier: 0.8,
      isAoe: false,
    },
    {
      id: "goob_tackle",
      name: "Blob Tackle",
      baseCooldown: 4,
      targetType: TargetType.RandomEnemy,
      damageMultiplier: 1.0,
      isAoe: false,
    },
  ],
};

export const MEGA_GOOB: Species = {
  id: "mega_goob",
  name: "Mega Goob",
  description: "A massive blob with tremendous durability",
  baseStats: {
    // 700 HP: at ~8 ticks to kill with a fresh 470-HP squad. Allows Slam+Wave+Crush
    // to fire once each, dealing ~130-160 HP total — very threatening to a
    // depleted mid-run squad, but survivable for a healed whale-strategy squad.
    maxHp: 700,
    speed: 7,
    // 38 attack: Slam (57) + Crush (76) + Wave (38 to all). At ~6-7 ticks to kill,
    // fires Slam at tick 4 and Crush at tick 5; Wave at tick 6 sometimes fires.
    // Creates meaningful RNG variance: depleted squads (32% HP) win ~25-35%,
    // healed squads (70% HP) win ~55-70%. Balances mini-boss difficulty.
    attackPower: 38,
  },
  attacks: [
    {
      id: "mega_slam",
      name: "Mega Slam",
      baseCooldown: 4,
      targetType: TargetType.OppositeEnemy,
      damageMultiplier: 1.5,
      isAoe: false,
    },
    {
      id: "mega_wave",
      name: "Tidal Wave",
      baseCooldown: 6,
      targetType: TargetType.AllEnemies,
      damageMultiplier: 1.0,
      isAoe: true,
    },
    {
      id: "mega_crush",
      name: "Crushing Weight",
      baseCooldown: 5,
      targetType: TargetType.RandomEnemy,
      damageMultiplier: 2.0,
      isAoe: false,
    },
  ],
};

export const HEAVY_GOOB: Species = {
  id: "heavy_goob",
  name: "Heavy Goob",
  description: "A dense, armored blob that hits slow but crushes hard",
  baseStats: {
    // 260 HP — tankier than a Goob (200), takes an extra 1-2 player attack cycles
    // to kill. Two Heavy Goobs create sustained pressure without being instant-kill.
    maxHp: 260,
    speed: 6,
    // 28 attack: Stomping Crash (50 damage) fires every 6 ticks — meaningful
    // single-target threat. Two Heavy Goobs in enc 7 apply sustained pressure.
    attackPower: 28,
  },
  attacks: [
    {
      id: "heavy_stomp",
      name: "Stomping Crash",
      baseCooldown: 6,
      targetType: TargetType.OppositeEnemy,
      damageMultiplier: 1.8,
      isAoe: false,
    },
  ],
};

// Enemy pools by world
export const WORLD_1_ENEMIES = [GOOB, HEAVY_GOOB];
export const WORLD_1_MINI_BOSS = MEGA_GOOB;
export const WORLD_1_BOSS = MEGA_GOOB;

// Future worlds (placeholders)
export const WORLD_2_ENEMIES = [GOOB]; // TODO: Add research lab enemies
export const WORLD_3_ENEMIES = [GOOB]; // TODO: Add corporate security enemies
