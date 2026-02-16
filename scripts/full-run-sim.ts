#!/usr/bin/env bun

import { simulateBattle } from "../src/core/battle";
import { applyConsumableToUnit, applyGeneticModToUnit } from "../src/core/shop";
import type { ConsumableItem, GeneticModItem, Unit } from "../src/core/types";
import { ConsumableEffect, ItemCategory, Position } from "../src/core/types";
import { createUnit } from "../src/core/unit";
import { GOOB, MEGA_GOOB } from "../src/data/enemies";
import { BEAR, EAGLE, TIGER } from "../src/data/species";

const SIMULATIONS = 100;

// Shop items
const HEALTH_POTION_SMALL: ConsumableItem = {
  id: "health_potion_small",
  name: "Minor Healing Vial",
  description: "Restores 20 HP",
  category: ItemCategory.Consumable,
  cost: 3,
  effect: { type: ConsumableEffect.HealHealth, amount: 20 },
};

const HEALTH_POTION_MEDIUM: ConsumableItem = {
  id: "health_potion_medium",
  name: "Healing Elixir",
  description: "Restores 60 HP",
  category: ItemCategory.Consumable,
  cost: 6,
  effect: { type: ConsumableEffect.HealHealth, amount: 60 },
};

const HEALTH_POTION_LARGE: ConsumableItem = {
  id: "health_potion_large",
  name: "Greater Restorative",
  description: "Restores 120 HP",
  category: ItemCategory.Consumable,
  cost: 10,
  effect: { type: ConsumableEffect.HealHealth, amount: 120 },
};

const HASTE_SERUM: ConsumableItem = {
  id: "haste_serum",
  name: "Haste Serum",
  description: "Reduces cooldowns by 1",
  category: ItemCategory.Consumable,
  cost: 8,
  effect: { type: ConsumableEffect.ReduceCooldowns, amount: 1, duration: "permanent" },
};

const ADRENALINE_SHOT: ConsumableItem = {
  id: "adrenaline_shot",
  name: "Adrenaline Shot",
  description: "Reduces cooldowns by 2",
  category: ItemCategory.Consumable,
  cost: 12,
  effect: { type: ConsumableEffect.ReduceCooldowns, amount: 2, duration: "permanent" },
};

const FEROCITY_ENHANCEMENT: ConsumableItem = {
  id: "ferocity_enhancement",
  name: "Ferocity Enhancement",
  description: "+15 Attack Power",
  category: ItemCategory.Consumable,
  cost: 12,
  effect: {
    type: ConsumableEffect.BoostStats,
    stats: { attackPower: 15 },
    duration: "permanent",
  },
};

const RESILIENCE_ENHANCEMENT: ConsumableItem = {
  id: "resilience_enhancement",
  name: "Resilience Enhancement",
  description: "+30 Max HP",
  category: ItemCategory.Consumable,
  cost: 12,
  effect: { type: ConsumableEffect.BoostStats, stats: { maxHp: 30 }, duration: "permanent" },
};

const MUTATION_THICK_HIDE: GeneticModItem = {
  id: "mutation_thick_hide",
  name: "Mutation Serum: Thick Hide",
  description: "Adds Thick Hide mutation (+20 HP)",
  category: ItemCategory.GeneticMod,
  cost: 25,
  effect: { type: "add_mutation", mutationId: "thick_hide" },
};

// Simulate a full run with different strategies
interface RunResult {
  wins: number;
  totalDamage: number;
  totalGoldSpent: number;
  survivedToBoss: number;
  defeatedBoss: number;
}

function simulateRun(
  strategy: "no_items" | "healing_only" | "haste_focus" | "balanced" | "whale",
): RunResult {
  const result: RunResult = {
    wins: 0,
    totalDamage: 0,
    totalGoldSpent: 0,
    survivedToBoss: 0,
    defeatedBoss: 0,
  };

  for (let sim = 0; sim < SIMULATIONS; sim++) {
    // Create fresh squad
    let squad = [
      createUnit(BEAR, Position.Left),
      createUnit(EAGLE, Position.Center),
      createUnit(TIGER, Position.Right),
    ];

    let gold = 10; // Starting gold
    let encountersWon = 0;

    // Encounter 1: 2 Goobs
    const enemies1 = [createUnit(GOOB, Position.Left), createUnit(GOOB, Position.Right)];

    // Pre-battle shop (Encounter 1)
    switch (strategy) {
      case "healing_only":
        // Save gold for healing after battles
        break;
      case "haste_focus":
        // Buy Haste for all units if possible
        if (gold >= 24) {
          squad = squad.map(
            (u, idx) => applyConsumableToUnit(u, HASTE_SERUM, [BEAR, EAGLE, TIGER][idx]!).unit,
          );
          gold -= 24;
          result.totalGoldSpent += 24;
        }
        break;
      case "balanced":
        // Buy one Haste and save rest
        if (gold >= 8) {
          squad[0] = applyConsumableToUnit(squad[0]!, HASTE_SERUM, BEAR).unit;
          gold -= 8;
          result.totalGoldSpent += 8;
        }
        break;
      case "whale":
        // Buy everything
        if (gold >= 24) {
          squad = squad.map(
            (u, idx) => applyConsumableToUnit(u, HASTE_SERUM, [BEAR, EAGLE, TIGER][idx]!).unit,
          );
          gold -= 24;
          result.totalGoldSpent += 24;
        }
        break;
    }

    const battle1 = simulateBattle(
      squad.map((u) => ({ ...u, stats: { ...u.stats } })),
      enemies1,
      200,
    );

    if (battle1.winner !== "player") {
      continue; // Lost early
    }

    encountersWon++;
    squad = battle1.playerUnits;
    gold += 5; // Gold reward

    // Calculate damage taken
    const damage1 = squad.reduce((sum, u, idx) => {
      const maxHp = [BEAR, EAGLE, TIGER][idx]!.baseStats.maxHp;
      return sum + (maxHp - u.stats.currentHp);
    }, 0);
    result.totalDamage += damage1;

    // Post-battle healing
    switch (strategy) {
      case "healing_only": {
        // Heal most damaged unit if needed
        const mostDamaged = squad.reduce(
          (worst, u, idx) => {
            const hpPercent = u.stats.currentHp / u.stats.maxHp;
            return hpPercent < worst.percent ? { idx, percent: hpPercent, unit: u } : worst;
          },
          { idx: -1, percent: 1, unit: squad[0]! },
        );

        if (mostDamaged.percent < 0.7 && gold >= 6) {
          const healed = applyConsumableToUnit(
            mostDamaged.unit,
            HEALTH_POTION_MEDIUM,
            [BEAR, EAGLE, TIGER][mostDamaged.idx]!,
          );
          squad[mostDamaged.idx] = healed.unit;
          gold -= 6;
          result.totalGoldSpent += 6;
        }
        break;
      }
      case "balanced": {
        // Heal if someone is low
        const critical = squad.find((u) => u.stats.currentHp / u.stats.maxHp < 0.5);
        if (critical && gold >= 6) {
          const idx = squad.indexOf(critical);
          squad[idx] = applyConsumableToUnit(
            critical,
            HEALTH_POTION_MEDIUM,
            [BEAR, EAGLE, TIGER][idx]!,
          ).unit;
          gold -= 6;
          result.totalGoldSpent += 6;
        }
        break;
      }
      case "whale":
        // Buy stat boosts
        if (gold >= 12) {
          squad[0] = applyConsumableToUnit(squad[0]!, FEROCITY_ENHANCEMENT, BEAR).unit;
          gold -= 12;
          result.totalGoldSpent += 12;
        }
        break;
    }

    // Encounter 2: 2 Goobs
    const enemies2 = [createUnit(GOOB, Position.Left), createUnit(GOOB, Position.Right)];

    const battle2 = simulateBattle(
      squad.map((u) => ({ ...u, stats: { ...u.stats } })),
      enemies2,
      200,
    );

    if (battle2.winner !== "player") {
      continue;
    }

    encountersWon++;
    squad = battle2.playerUnits;
    gold += 5;

    const damage2 = squad.reduce((sum, u, idx) => {
      const maxHp = [BEAR, EAGLE, TIGER][idx]!.baseStats.maxHp;
      return sum + (maxHp - u.stats.currentHp);
    }, 0);
    result.totalDamage += damage2;

    // Pre-boss healing
    if (strategy !== "no_items") {
      for (let i = 0; i < squad.length; i++) {
        const unit = squad[i]!;
        const missing = unit.stats.maxHp - unit.stats.currentHp;
        if (missing > 60 && gold >= 10) {
          squad[i] = applyConsumableToUnit(
            unit,
            HEALTH_POTION_LARGE,
            [BEAR, EAGLE, TIGER][i]!,
          ).unit;
          gold -= 10;
          result.totalGoldSpent += 10;
        } else if (missing > 20 && gold >= 6) {
          squad[i] = applyConsumableToUnit(
            unit,
            HEALTH_POTION_MEDIUM,
            [BEAR, EAGLE, TIGER][i]!,
          ).unit;
          gold -= 6;
          result.totalGoldSpent += 6;
        }
      }
    }

    result.survivedToBoss++;

    // Boss Fight: Mega Goob
    const boss = [createUnit(MEGA_GOOB, Position.Center)];

    const bossBattle = simulateBattle(
      squad.map((u) => ({ ...u, stats: { ...u.stats } })),
      boss,
      200,
    );

    if (bossBattle.winner === "player") {
      result.wins++;
      result.defeatedBoss++;

      const damageBoss = bossBattle.playerUnits.reduce((sum, u, idx) => {
        const maxHp = [BEAR, EAGLE, TIGER][idx]!.baseStats.maxHp;
        return sum + (maxHp - u.stats.currentHp);
      }, 0);
      result.totalDamage += damageBoss;
    }
  }

  return result;
}

console.log("=".repeat(70));
console.log("                    FULL RUN SIMULATION");
console.log("=".repeat(70));
console.log(`Running ${SIMULATIONS} full runs per strategy...`);
console.log("Each run: 2 regular encounters + 1 boss fight\n");

const strategies = [
  { name: "No Items", key: "no_items" as const },
  { name: "Healing Only", key: "healing_only" as const },
  { name: "Haste Focus", key: "haste_focus" as const },
  { name: "Balanced", key: "balanced" as const },
  { name: "Whale (All Items)", key: "whale" as const },
];

const results = strategies.map((strat) => ({
  strategy: strat.name,
  result: simulateRun(strat.key),
}));

for (const { strategy, result } of results) {
  const winRate = (result.wins / SIMULATIONS) * 100;
  const avgDamage = result.totalDamage / SIMULATIONS;
  const avgGoldSpent = result.totalGoldSpent / SIMULATIONS;
  const bossReachRate = (result.survivedToBoss / SIMULATIONS) * 100;
  const bossWinRate =
    result.survivedToBoss > 0 ? (result.defeatedBoss / result.survivedToBoss) * 100 : 0;

  console.log(`\n📊 ${strategy.toUpperCase()}`);
  console.log(`  Boss Reach Rate: ${bossReachRate.toFixed(1)}%`);
  console.log(`  Boss Win Rate: ${bossWinRate.toFixed(1)}%`);
  console.log(`  Overall Win Rate: ${winRate.toFixed(1)}%`);
  console.log(`  Avg Damage Taken: ${avgDamage.toFixed(1)} HP`);
  console.log(`  Avg Gold Spent: ${avgGoldSpent.toFixed(1)}g`);
  console.log(
    `  Gold Efficiency: ${(avgDamage / Math.max(1, avgGoldSpent)).toFixed(2)} damage per gold spent`,
  );
}

console.log("\n" + "=".repeat(70));
console.log("ANALYSIS:");

// Find best strategy
const best = results.reduce((best, curr) => {
  return curr.result.wins > best.result.wins ? curr : best;
});

const noItems = results.find((r) => r.strategy === "No Items")!;
const bestImprovement =
  ((best.result.wins - noItems.result.wins) / Math.max(1, noItems.result.wins)) * 100;

console.log(`\n🏆 Best Strategy: ${best.strategy}`);
console.log(`   Win Rate: ${((best.result.wins / SIMULATIONS) * 100).toFixed(1)}%`);
console.log(`   Improvement: ${bestImprovement.toFixed(1)}% over no items`);

// Check if game is too hard/easy
const avgWinRate =
  (results.reduce((sum, r) => sum + r.result.wins, 0) / results.length / SIMULATIONS) * 100;
if (avgWinRate < 30) {
  console.log("\n⚠️  TOO HARD - Average win rate below 30%");
} else if (avgWinRate > 90) {
  console.log("\n⚠️  TOO EASY - Average win rate above 90%");
} else {
  console.log("\n✅ GOOD DIFFICULTY - Average win rate in sweet spot (30-90%)");
}

console.log("=".repeat(70) + "\n");
