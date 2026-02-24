import { AttackSpecialEffect, type Species, TargetType } from "../core/types";

export const BEAR: Species = {
  id: "bear",
  name: "Bear",
  description: "Powerful AOE attacker with high HP",
  baseStats: {
    maxHp: 180,
    speed: 8,
    attackPower: 20,
  },
  attacks: [
    {
      id: "bear_maul",
      name: "Crushing Maul",
      baseCooldown: 3,
      targetType: TargetType.OppositeEnemy,
      damageMultiplier: 1.5,
      isAoe: false,
    },
    {
      id: "bear_roar",
      name: "Terrifying Roar",
      baseCooldown: 5,
      targetType: TargetType.AllEnemies,
      damageMultiplier: 0.8,
      isAoe: true,
    },
    {
      id: "bear_hug",
      name: "Bear Hug",
      baseCooldown: 4,
      targetType: TargetType.RandomEnemy,
      damageMultiplier: 2.0,
      isAoe: false,
    },
  ],
};

export const EAGLE: Species = {
  id: "eagle",
  name: "Eagle",
  description: "Fast striker that targets weak enemies",
  baseStats: {
    maxHp: 130,
    speed: 15,
    attackPower: 25,
  },
  attacks: [
    {
      id: "eagle_dive",
      name: "Dive Bomb",
      baseCooldown: 2,
      targetType: TargetType.OppositeEnemy,
      damageMultiplier: 1.3,
      isAoe: false,
    },
    {
      id: "eagle_talon",
      name: "Talon Slash",
      baseCooldown: 3,
      targetType: TargetType.LowestHpEnemy,
      damageMultiplier: 1.8,
      isAoe: false,
    },
    {
      id: "eagle_strafe",
      name: "Wing Strafe",
      baseCooldown: 4,
      targetType: TargetType.RightEnemy,
      damageMultiplier: 1.5,
      isAoe: false,
    },
  ],
};

export const TIGER: Species = {
  id: "tiger",
  name: "Tiger",
  description: "Balanced fighter with consistent damage",
  baseStats: {
    maxHp: 160,
    speed: 12,
    attackPower: 30,
  },
  attacks: [
    {
      id: "tiger_pounce",
      name: "Pounce",
      baseCooldown: 2,
      targetType: TargetType.OppositeEnemy,
      damageMultiplier: 1.2,
      isAoe: false,
    },
    {
      id: "tiger_bite",
      name: "Savage Bite",
      baseCooldown: 4,
      targetType: TargetType.RandomEnemy,
      damageMultiplier: 2.5,
      isAoe: false,
    },
    {
      id: "tiger_rake",
      name: "Rake",
      baseCooldown: 3,
      targetType: TargetType.LeftEnemy,
      damageMultiplier: 1.4,
      isAoe: false,
    },
  ],
};

export const WOLF: Species = {
  id: "wolf",
  name: "Wolf",
  description: "Pack hunter that deals bonus damage to focused targets and fights harder when alone",
  baseStats: {
    maxHp: 145,
    speed: 13,
    attackPower: 22,
  },
  attacks: [
    {
      id: "wolf_bite",
      name: "Pack Bite",
      baseCooldown: 2,
      targetType: TargetType.OppositeEnemy,
      damageMultiplier: 1.3,
      isAoe: false,
      specialEffect: AttackSpecialEffect.SwarmStrike,
    },
    {
      id: "wolf_howl",
      name: "Howling Strike",
      baseCooldown: 4,
      targetType: TargetType.LowestHpEnemy,
      damageMultiplier: 1.8,
      isAoe: false,
    },
    {
      id: "wolf_lunge",
      name: "Lunge",
      baseCooldown: 3,
      targetType: TargetType.RandomEnemy,
      damageMultiplier: 1.5,
      isAoe: false,
    },
  ],
};

export const ALL_SPECIES: Species[] = [BEAR, EAGLE, TIGER, WOLF];

export const SPECIES_BY_ID: Record<string, Species> = {
  bear: BEAR,
  eagle: EAGLE,
  tiger: TIGER,
  wolf: WOLF,
};
