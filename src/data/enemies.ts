import type { Species } from "../core/types";
import { TargetType } from "../core/types";

// World 1: Basement Levels - Goob enemies

export const GOOB: Species = {
  id: "goob",
  name: "Goob",
  description: "A gray blob that mindlessly attacks whatever is in front of it",
  baseStats: {
    maxHp: 600, // Massive HP pool to survive extended battles
    speed: 8, // Matches player speed for fair initiative
    attackPower: 50, // High damage to threaten player survival
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
    maxHp: 1500, // Extreme durability - nearly impossible without upgrades
    speed: 7, // Slower than player but fast enough to act
    attackPower: 100, // Devastating damage that can wipe unprepared squads
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
