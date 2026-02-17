import type { Species } from "../core/types";
import { TargetType } from "../core/types";

// World 1: Basement Levels - Goob enemies

export const GOOB: Species = {
  id: "goob",
  name: "Goob",
  description: "A gray blob that mindlessly attacks whatever is in front of it",
  baseStats: {
    // 275 HP keeps battles at ~6-7 ticks — long enough for 2 dedicated attacks per Goob
    // but short enough that players survive with ~150 HP of total damage per encounter.
    // Two Goobs at 275 HP sit well below the squad total of 330 HP.
    maxHp: 275,
    speed: 8,
    // 45 attack: slap hits for ~36, tackle hits for 45 — threatening but rarely lethal
    // in isolation. The danger comes from cumulative damage across 2 encounters.
    attackPower: 45,
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
    // 895 HP places the boss at a DPS cliff: fresh players kill it in ~9 ticks,
    // just before its second Tidal Wave can fire at tick 12. RNG in targeting
    // creates meaningful variance — ~14-21% fresh-squad win rate with no items.
    maxHp: 895,
    speed: 7,
    // 38 attack: Mega Slam (57) threatens Eagle (80 HP), Crushing Weight (76)
    // threatens Tiger (100 HP). Tidal Wave (38 to all) punishes low-HP squads.
    // With items/haste, players burst boss before its waves stack up.
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

// Enemy pools by world
export const WORLD_1_ENEMIES = [GOOB];
export const WORLD_1_MINI_BOSS = MEGA_GOOB;
export const WORLD_1_BOSS = MEGA_GOOB;

// Future worlds (placeholders)
export const WORLD_2_ENEMIES = [GOOB]; // TODO: Add research lab enemies
export const WORLD_3_ENEMIES = [GOOB]; // TODO: Add corporate security enemies
