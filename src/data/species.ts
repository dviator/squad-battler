import { Species, TargetType } from "../core/types";

export const BEAR: Species = {
  id: "bear",
  name: "Bear",
  description: "Powerful AOE attacker with high HP",
  baseStats: {
    maxHp: 150,
    speed: 8,
    attackPower: 20,
  },
  attacks: [
    {
      id: "bear_swipe",
      name: "Swipe",
      baseCooldown: 4,
      targetType: TargetType.AllEnemies,
      damageMultiplier: 1.0,
      isAoe: true,
    },
  ],
};

export const EAGLE: Species = {
  id: "eagle",
  name: "Eagle",
  description: "Fast striker that targets weak enemies",
  baseStats: {
    maxHp: 80,
    speed: 15,
    attackPower: 25,
  },
  attacks: [
    {
      id: "eagle_snipe",
      name: "Snipe",
      baseCooldown: 3,
      targetType: TargetType.LowestHpEnemy,
      damageMultiplier: 1.2,
      isAoe: false,
    },
  ],
};

export const TIGER: Species = {
  id: "tiger",
  name: "Tiger",
  description: "Balanced fighter with consistent damage",
  baseStats: {
    maxHp: 100,
    speed: 12,
    attackPower: 30,
  },
  attacks: [
    {
      id: "tiger_maul",
      name: "Maul",
      baseCooldown: 2,
      targetType: TargetType.OppositeEnemy,
      damageMultiplier: 1.0,
      isAoe: false,
    },
  ],
};

export const ALL_SPECIES: Species[] = [BEAR, EAGLE, TIGER];

export const SPECIES_BY_ID: Record<string, Species> = {
  bear: BEAR,
  eagle: EAGLE,
  tiger: TIGER,
};
