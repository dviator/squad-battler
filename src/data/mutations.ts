import type { Mutation } from "../core/types";

export const THICK_HIDE: Mutation = {
  id: "thick_hide",
  name: "Thick Hide",
  description: "Increased maximum health",
  statModifiers: {
    maxHp: 30,
  },
};

export const SWIFT_REFLEXES: Mutation = {
  id: "swift_reflexes",
  name: "Swift Reflexes",
  description: "Increased speed",
  statModifiers: {
    speed: 3,
  },
};

export const POWERFUL_MUSCLES: Mutation = {
  id: "powerful_muscles",
  name: "Powerful Muscles",
  description: "Increased attack power",
  statModifiers: {
    attackPower: 8,
  },
};

export const ADRENALINE_RUSH: Mutation = {
  id: "adrenaline_rush",
  name: "Adrenaline Rush",
  description: "Faster attack cooldowns",
  attackModifiers: [
    {
      attackId: "*",
      cooldownModifier: -1,
    },
  ],
};

export const BERSERKER: Mutation = {
  id: "berserker",
  name: "Berserker",
  description: "High damage but reduced defenses",
  statModifiers: {
    attackPower: 15,
    maxHp: -20,
  },
};

// Permanent enhancement mutations (from mutation enhancements)
export const ENHANCED_FEROCITY: Mutation = {
  id: "enhanced_ferocity",
  name: "Enhanced Ferocity",
  description: "Permanent attack boost from Ferocity Enhancement",
  statModifiers: {
    attackPower: 15,
  },
};

export const ENHANCED_RESILIENCE: Mutation = {
  id: "enhanced_resilience",
  name: "Enhanced Resilience",
  description: "Permanent HP boost from Resilience Enhancement",
  statModifiers: {
    maxHp: 30,
  },
};

export const ENHANCED_AGILITY: Mutation = {
  id: "enhanced_agility",
  name: "Enhanced Agility",
  description: "Permanent speed boost from Agility Enhancement",
  statModifiers: {
    speed: 5,
  },
};

export const ALL_MUTATIONS: Mutation[] = [
  THICK_HIDE,
  SWIFT_REFLEXES,
  POWERFUL_MUSCLES,
  ADRENALINE_RUSH,
  BERSERKER,
  ENHANCED_FEROCITY,
  ENHANCED_RESILIENCE,
  ENHANCED_AGILITY,
];

export const MUTATIONS_BY_ID: Record<string, Mutation> = {
  thick_hide: THICK_HIDE,
  swift_reflexes: SWIFT_REFLEXES,
  powerful_muscles: POWERFUL_MUSCLES,
  adrenaline_rush: ADRENALINE_RUSH,
  berserker: BERSERKER,
  enhanced_ferocity: ENHANCED_FEROCITY,
  enhanced_resilience: ENHANCED_RESILIENCE,
  enhanced_agility: ENHANCED_AGILITY,
};
