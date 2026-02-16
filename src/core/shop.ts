import { upgradeGeneticGrade } from "./genetics";
import type { ConsumableItem, Currency, GeneticModItem, ShopItem, Species, Unit } from "./types";
import { ConsumableEffect, ItemCategory } from "./types";
import { recalculateStatsFromMutations } from "./unit";

// Item rarity for shop generation
export enum ItemRarity {
  Common = "common", // Always available (healing potions)
  Uncommon = "uncommon", // Frequently available
  Rare = "rare", // 1-2 per world
  VeryRare = "very_rare", // 1 per world max
}

// Extended shop item with rarity
export interface ShopItemDefinition extends ShopItem {
  rarity: ItemRarity;
}

// Define available shop items
export const SHOP_ITEMS: ShopItemDefinition[] = [
  // === HEALING POTIONS (Always Available) ===
  {
    id: "health_potion_small",
    name: "Minor Healing Vial",
    description: "Restores 20 HP (10-20% for most units) - Poor value",
    category: ItemCategory.Consumable,
    cost: 3,
    rarity: ItemRarity.Common,
    effect: { type: ConsumableEffect.HealHealth, amount: 20 },
  },
  {
    id: "health_potion_medium",
    name: "Healing Elixir",
    description: "Restores 60 HP (~40-60% for most units) - Good value",
    category: ItemCategory.Consumable,
    cost: 6,
    rarity: ItemRarity.Common,
    effect: { type: ConsumableEffect.HealHealth, amount: 60 },
  },
  {
    id: "health_potion_large",
    name: "Greater Restorative",
    description: "Restores 120 HP (~80% for large units) - Best value",
    category: ItemCategory.Consumable,
    cost: 10,
    rarity: ItemRarity.Common,
    effect: { type: ConsumableEffect.HealHealth, amount: 120 },
  },

  // === TEMPORARY COMBAT BOOSTS (Uncommon) ===
  {
    id: "haste_serum",
    name: "Haste Serum",
    description: "Reduces all attack cooldowns by 1 for the rest of this world",
    category: ItemCategory.Consumable,
    cost: 8,
    rarity: ItemRarity.Uncommon,
    effect: { type: ConsumableEffect.ReduceCooldowns, amount: 1, duration: "permanent" },
  },
  {
    id: "adrenaline_shot",
    name: "Adrenaline Shot",
    description: "Reduces all attack cooldowns by 2 for the next battle only",
    category: ItemCategory.Consumable,
    cost: 5,
    rarity: ItemRarity.Uncommon,
    effect: { type: ConsumableEffect.ReduceCooldowns, amount: 2, duration: "next_battle" },
  },

  // === MUTATION ENHANCEMENTS (Uncommon) ===
  {
    id: "ferocity_enhancement",
    name: "Ferocity Enhancement",
    description: "+15 Attack Power for this run (5% chance to become permanent mutation)",
    category: ItemCategory.Consumable,
    cost: 12,
    rarity: ItemRarity.Uncommon,
    effect: {
      type: ConsumableEffect.BoostStats,
      stats: { attackPower: 15 },
      duration: "permanent",
    },
  },
  {
    id: "resilience_enhancement",
    name: "Resilience Enhancement",
    description: "+30 Max HP for this run (5% chance to become permanent mutation)",
    category: ItemCategory.Consumable,
    cost: 12,
    rarity: ItemRarity.Uncommon,
    effect: { type: ConsumableEffect.BoostStats, stats: { maxHp: 30 }, duration: "permanent" },
  },
  {
    id: "agility_enhancement",
    name: "Agility Enhancement",
    description: "+5 Speed for this run (5% chance to become permanent mutation)",
    category: ItemCategory.Consumable,
    cost: 12,
    rarity: ItemRarity.Uncommon,
    effect: { type: ConsumableEffect.BoostStats, stats: { speed: 5 }, duration: "permanent" },
  },

  // === MUTATION SERUMS (Rare) ===
  {
    id: "mutation_thick_hide",
    name: "Mutation Serum: Thick Hide",
    description: "PERMANENT: Adds Thick Hide mutation (+20 HP)",
    category: ItemCategory.GeneticMod,
    cost: 25,
    rarity: ItemRarity.Rare,
    effect: { type: "add_mutation", mutationId: "thick_hide" },
  },
  {
    id: "mutation_swift_reflexes",
    name: "Mutation Serum: Swift Reflexes",
    description: "PERMANENT: Adds Swift Reflexes mutation (+5 Speed)",
    category: ItemCategory.GeneticMod,
    cost: 25,
    rarity: ItemRarity.Rare,
    effect: { type: "add_mutation", mutationId: "swift_reflexes" },
  },
  {
    id: "mutation_powerful_muscles",
    name: "Mutation Serum: Powerful Muscles",
    description: "PERMANENT: Adds Powerful Muscles mutation (+8 Attack)",
    category: ItemCategory.GeneticMod,
    cost: 25,
    rarity: ItemRarity.Rare,
    effect: { type: "add_mutation", mutationId: "powerful_muscles" },
  },

  // === GENE BOOSTS (Very Rare - 1 per world max) ===
  {
    id: "gene_boost_hp",
    name: "Genetic Enhancer: Vitality",
    description: "PERMANENT: Upgrades HP potential by one grade (F→D, D→C, etc.)",
    category: ItemCategory.GeneticMod,
    cost: 50,
    rarity: ItemRarity.VeryRare,
    effect: { type: "boost_potential", stat: "maxHp", amount: 1 },
  },
  {
    id: "gene_boost_speed",
    name: "Genetic Enhancer: Agility",
    description: "PERMANENT: Upgrades Speed potential by one grade",
    category: ItemCategory.GeneticMod,
    cost: 50,
    rarity: ItemRarity.VeryRare,
    effect: { type: "boost_potential", stat: "speed", amount: 1 },
  },
  {
    id: "gene_boost_attack",
    name: "Genetic Enhancer: Power",
    description: "PERMANENT: Upgrades Attack Power potential by one grade",
    category: ItemCategory.GeneticMod,
    cost: 50,
    rarity: ItemRarity.VeryRare,
    effect: { type: "boost_potential", stat: "attackPower", amount: 1 },
  },

  // === EQUIPMENT (Uncommon - Lasts for the run) ===
  {
    id: "bubble_shield",
    name: "Prototype Bubble Shield",
    description: "RUN ONLY: Blocks the first attack against you in each combat",
    category: ItemCategory.Equipment,
    cost: 7,
    rarity: ItemRarity.Uncommon,
    effect: { type: "block_first_attack" },
  },
  {
    id: "laser_pointer",
    name: "Enemy Confuser Mk-II",
    description: "RUN ONLY: 30% chance enemies attack wrong target each turn",
    category: ItemCategory.Equipment,
    cost: 6,
    rarity: ItemRarity.Uncommon,
    effect: { type: "attack_redirect", chance: 0.3 },
  },
  {
    id: "cutting_edge_boots",
    name: "Cutting-Edge Speed Boots",
    description: "RUN ONLY: +3 Speed in all combats",
    category: ItemCategory.Equipment,
    cost: 8,
    rarity: ItemRarity.Uncommon,
    effect: { type: "initiative_boost", amount: 3 },
  },
  {
    id: "mind_reader_headset",
    name: "Mind Reader Headset",
    description: "RUN ONLY: Dodge one attack per combat (predict enemy moves)",
    category: ItemCategory.Equipment,
    cost: 9,
    rarity: ItemRarity.Uncommon,
    effect: { type: "perfect_dodge" },
  },
  {
    id: "spike_armor",
    name: "Retaliation Spike Armor",
    description: "RUN ONLY: Deal 10 damage back to attackers when hit",
    category: ItemCategory.Equipment,
    cost: 7,
    rarity: ItemRarity.Uncommon,
    effect: { type: "retaliation_spikes", damage: 10 },
  },

  // === EQUIPMENT (Rare - Team effects) ===
  {
    id: "team_shield_generator",
    name: "Experimental Shield Generator",
    description: "RUN ONLY: Reduces all damage taken by your entire squad by 20%",
    category: ItemCategory.Equipment,
    cost: 20,
    rarity: ItemRarity.Rare,
    effect: { type: "team_damage_reduction", percent: 20 },
  },
  {
    id: "squad_haste_field",
    name: "Squad-Wide Haste Field",
    description: "RUN ONLY: +2 Speed for all squad members in all combats",
    category: ItemCategory.Equipment,
    cost: 18,
    rarity: ItemRarity.Rare,
    effect: { type: "initiative_boost", amount: 2 },
  },
];

// Generate a strategic shop with varied items
export function generateShop(encountersInWorld: number = 0): ShopItem[] {
  const shopItems: ShopItem[] = [];

  // Always include all 3 healing potions (common items)
  const healingPotions = SHOP_ITEMS.filter((item) => item.rarity === ItemRarity.Common);
  shopItems.push(...healingPotions);

  // Add 2-3 uncommon items (combat boosts, mutation enhancements, equipment)
  const uncommonItems = SHOP_ITEMS.filter((item) => item.rarity === ItemRarity.Uncommon);
  const uncommonCount = 2 + Math.floor(Math.random() * 2); // 2-3 items

  for (let i = 0; i < uncommonCount && uncommonItems.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * uncommonItems.length);
    const selectedItem = uncommonItems[randomIndex];
    if (selectedItem) {
      shopItems.push(selectedItem);
    }
    uncommonItems.splice(randomIndex, 1); // No duplicates
  }

  // Add rare items occasionally (mutation serums, team equipment)
  if (Math.random() < 0.5) {
    // 50% chance
    const rareItems = SHOP_ITEMS.filter((item) => item.rarity === ItemRarity.Rare);
    if (rareItems.length > 0) {
      const randomIndex = Math.floor(Math.random() * rareItems.length);
      const selectedItem = rareItems[randomIndex];
      if (selectedItem) {
        shopItems.push(selectedItem);
      }
    }
  }

  // Add very rare items sparingly (gene boosts - max 1-2 per world)
  // Only appear after a few encounters (not in first shop)
  if (encountersInWorld >= 3 && Math.random() < 0.3) {
    // 30% chance after 3+ encounters
    const veryRareItems = SHOP_ITEMS.filter((item) => item.rarity === ItemRarity.VeryRare);
    if (veryRareItems.length > 0) {
      const randomIndex = Math.floor(Math.random() * veryRareItems.length);
      const selectedItem = veryRareItems[randomIndex];
      if (selectedItem) {
        shopItems.push(selectedItem);
      }
    }
  }

  return shopItems;
}

// Purchase an item from the shop
export function purchaseItem(
  currency: Currency,
  item: ShopItem,
): { success: boolean; newCurrency: Currency; error?: string } {
  if (currency.gold < item.cost) {
    return {
      success: false,
      newCurrency: currency,
      error: "Not enough gold",
    };
  }

  return {
    success: true,
    newCurrency: {
      gold: currency.gold - item.cost,
      materials: currency.materials,
    },
  };
}

// Map enhancement items to their permanent mutation IDs
const ENHANCEMENT_TO_MUTATION: Record<string, string> = {
  ferocity_enhancement: "enhanced_ferocity",
  resilience_enhancement: "enhanced_resilience",
  agility_enhancement: "enhanced_agility",
};

// Apply a consumable item effect to a unit
export function applyConsumableToUnit(
  unit: Unit,
  item: ConsumableItem,
  species: Species,
): { unit: Unit; permanentMutation?: string } {
  const effect = item.effect;

  // Healing potions
  if (effect.type === ConsumableEffect.HealHealth) {
    return {
      unit: {
        ...unit,
        stats: {
          ...unit.stats,
          currentHp: Math.min(unit.stats.maxHp, unit.stats.currentHp + effect.amount),
        },
      },
    };
  }

  // Stat boost consumables (mutation enhancements)
  if (effect.type === ConsumableEffect.BoostStats && effect.stats) {
    const boostedStats = { ...unit.stats };

    // Apply temporary boosts
    if (effect.stats.maxHp !== undefined) {
      boostedStats.maxHp += effect.stats.maxHp;
      boostedStats.currentHp += effect.stats.maxHp; // Also increase current HP
    }
    if (effect.stats.speed !== undefined) {
      boostedStats.speed += effect.stats.speed;
    }
    if (effect.stats.attackPower !== undefined) {
      boostedStats.attackPower += effect.stats.attackPower;
    }

    let finalUnit = {
      ...unit,
      stats: boostedStats,
    };

    // 5% chance to make the boost permanent (add mutation)
    const mutationId = ENHANCEMENT_TO_MUTATION[item.id];
    if (mutationId && Math.random() < 0.05) {
      // Add the permanent mutation
      if (!finalUnit.mutations.includes(mutationId)) {
        finalUnit = {
          ...finalUnit,
          mutations: [...finalUnit.mutations, mutationId],
        };

        // Recalculate stats with the new mutation
        finalUnit = recalculateStatsFromMutations(finalUnit, species);
      }

      return {
        unit: finalUnit,
        permanentMutation: mutationId,
      };
    }

    return { unit: finalUnit };
  }

  // Other consumable effects (cooldown reduction) will be applied during battle
  return { unit };
}

// Apply a genetic mod item to a unit (permanent)
// Note: Requires species to recalculate stats when adding mutations
export function applyGeneticModToUnit(unit: Unit, item: GeneticModItem, species: Species): Unit {
  const effect = item.effect;

  if (effect.type === "add_mutation") {
    // Add mutation if not already present
    if (!unit.mutations.includes(effect.mutationId)) {
      const withMutation = {
        ...unit,
        mutations: [...unit.mutations, effect.mutationId],
      };
      // Recalculate stats with the new mutation
      return recalculateStatsFromMutations(withMutation, species);
    }
  }

  if (effect.type === "boost_potential") {
    const currentGrade = unit.geneticPotential[effect.stat];
    const newGrade = upgradeGeneticGrade(currentGrade);

    return {
      ...unit,
      geneticPotential: {
        ...unit.geneticPotential,
        [effect.stat]: newGrade,
      },
    };
  }

  return unit;
}

// Award gold for completing a combat
export function awardGold(currency: Currency, amount: number): Currency {
  return {
    ...currency,
    gold: currency.gold + amount,
  };
}
