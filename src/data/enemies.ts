import type { Attack, Species } from "../core/types";
import { TargetType } from "../core/types";

// World 1: Basement Levels - Goob enemies

const goobBasicAttack: Attack = {
  id: "goob_slap",
  name: "Gooey Slap",
  baseCooldown: 3,
  targetType: TargetType.OppositeEnemy,
  damageMultiplier: 0.8,
  isAoe: false,
};

export const GOOB: Species = {
  id: "goob",
  name: "Goob",
  description: "A gray blob that mindlessly attacks whatever is in front of it",
  baseStats: {
    maxHp: 60,
    speed: 5,
    attackPower: 15,
  },
  attacks: [goobBasicAttack],
};

const megaGoobSlam: Attack = {
  id: "mega_slam",
  name: "Mega Slam",
  baseCooldown: 4,
  targetType: TargetType.OppositeEnemy,
  damageMultiplier: 1.2,
  isAoe: false,
};

export const MEGA_GOOB: Species = {
  id: "mega_goob",
  name: "Mega Goob",
  description: "A massive blob with tremendous durability",
  baseStats: {
    maxHp: 300, // 5x normal Goob
    speed: 4, // Slower than normal
    attackPower: 25, // Stronger
  },
  attacks: [megaGoobSlam],
};

// Enemy pools by world
export const WORLD_1_ENEMIES = [GOOB];
export const WORLD_1_MINI_BOSS = MEGA_GOOB;
export const WORLD_1_BOSS = MEGA_GOOB;

// Future worlds (placeholders)
export const WORLD_2_ENEMIES = [GOOB]; // TODO: Add research lab enemies
export const WORLD_3_ENEMIES = [GOOB]; // TODO: Add corporate security enemies
