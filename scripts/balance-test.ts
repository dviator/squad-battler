#!/usr/bin/env bun

import { simulateBattle } from "../src/core/battle";
import { applyConsumableToUnit } from "../src/core/shop";
import type { ConsumableItem } from "../src/core/types";
import { ConsumableEffect, ItemCategory, Position } from "../src/core/types";
import { createUnit } from "../src/core/unit";
import { GOOB, MEGA_GOOB } from "../src/data/enemies";
import { BEAR, EAGLE, TIGER } from "../src/data/species";

const SIMULATIONS = 100;

const hasteSerum: ConsumableItem = {
  id: "haste_serum",
  name: "Haste Serum",
  description: "Reduces cooldowns by 1",
  category: ItemCategory.Consumable,
  cost: 8,
  effect: { type: ConsumableEffect.ReduceCooldowns, amount: 1, duration: "permanent" },
};

function runSimulation(playerUnits: any[], enemyUnits: any[]) {
  const results = {
    wins: 0,
    totalDamageTaken: 0,
    totalBattleTicks: 0,
    averageDamageTaken: 0,
    averageBattleTicks: 0,
    winRate: 0,
  };

  for (let i = 0; i < SIMULATIONS; i++) {
    // Fresh copies each simulation
    const players = playerUnits.map((u) => ({ ...u, stats: { ...u.stats } }));
    const enemies = enemyUnits.map((u) => ({ ...u, stats: { ...u.stats } }));

    const battle = simulateBattle(players, enemies, 200);

    if (battle.winner === "player") {
      results.wins++;
    }

    // Calculate damage taken
    const damageTaken = players.reduce((sum, unit, idx) => {
      const startHp = playerUnits[idx].stats.maxHp;
      const endHp = battle.playerUnits[idx]?.stats.currentHp || 0;
      return sum + (startHp - endHp);
    }, 0);

    results.totalDamageTaken += damageTaken;
    results.totalBattleTicks += battle.tick;
  }

  results.winRate = (results.wins / SIMULATIONS) * 100;
  results.averageDamageTaken = results.totalDamageTaken / SIMULATIONS;
  results.averageBattleTicks = results.totalBattleTicks / SIMULATIONS;

  return results;
}

console.log("=".repeat(70));
console.log("                      BALANCE SIMULATION");
console.log("=".repeat(70));
console.log(`Running ${SIMULATIONS} simulations per scenario...\n`);

// Scenario 1: No items
console.log("📊 SCENARIO 1: No Items (Baseline)");
const baseSquad = [
  createUnit(BEAR, Position.Left),
  createUnit(EAGLE, Position.Center),
  createUnit(TIGER, Position.Right),
];
const baseEnemies = [createUnit(GOOB, Position.Left), createUnit(GOOB, Position.Right)];

const baseline = runSimulation(baseSquad, baseEnemies);
console.log(`  Win Rate: ${baseline.winRate.toFixed(1)}%`);
console.log(`  Avg Damage Taken: ${baseline.averageDamageTaken.toFixed(1)} HP`);
console.log(`  Avg Battle Duration: ${baseline.averageBattleTicks.toFixed(1)} ticks`);

// Scenario 2: One unit with Haste
console.log("\n📊 SCENARIO 2: One Unit with Haste Serum (-1 CD)");
const hasteSquad1 = [
  createUnit(BEAR, Position.Left),
  createUnit(EAGLE, Position.Center),
  createUnit(TIGER, Position.Right),
];
hasteSquad1[0] = applyConsumableToUnit(hasteSquad1[0], hasteSerum, BEAR).unit;

const haste1 = runSimulation(hasteSquad1, baseEnemies);
console.log(`  Win Rate: ${haste1.winRate.toFixed(1)}%`);
console.log(`  Avg Damage Taken: ${haste1.averageDamageTaken.toFixed(1)} HP`);
console.log(`  Avg Battle Duration: ${haste1.averageBattleTicks.toFixed(1)} ticks`);
console.log(
  `  Damage Reduction: ${((1 - haste1.averageDamageTaken / baseline.averageDamageTaken) * 100).toFixed(1)}%`,
);

// Scenario 3: All units with Haste
console.log("\n📊 SCENARIO 3: All Units with Haste Serum (-1 CD each)");
const hasteSquad3 = [
  createUnit(BEAR, Position.Left),
  createUnit(EAGLE, Position.Center),
  createUnit(TIGER, Position.Right),
];
hasteSquad3[0] = applyConsumableToUnit(hasteSquad3[0], hasteSerum, BEAR).unit;
hasteSquad3[1] = applyConsumableToUnit(hasteSquad3[1], hasteSerum, EAGLE).unit;
hasteSquad3[2] = applyConsumableToUnit(hasteSquad3[2], hasteSerum, TIGER).unit;

const haste3 = runSimulation(hasteSquad3, baseEnemies);
console.log(`  Win Rate: ${haste3.winRate.toFixed(1)}%`);
console.log(`  Avg Damage Taken: ${haste3.averageDamageTaken.toFixed(1)} HP`);
console.log(`  Avg Battle Duration: ${haste3.averageBattleTicks.toFixed(1)} ticks`);
console.log(
  `  Damage Reduction: ${((1 - haste3.averageDamageTaken / baseline.averageDamageTaken) * 100).toFixed(1)}%`,
);

// Scenario 4: Mega Goob Boss Fight
console.log("\n📊 SCENARIO 4: Boss Fight (Mega Goob)");
const bossEnemies = [createUnit(MEGA_GOOB, Position.Center)];

const bossBaseline = runSimulation(baseSquad, bossEnemies);
console.log("  NO HASTE:");
console.log(`    Win Rate: ${bossBaseline.winRate.toFixed(1)}%`);
console.log(`    Avg Damage Taken: ${bossBaseline.averageDamageTaken.toFixed(1)} HP`);

const bossHaste = runSimulation(hasteSquad3, bossEnemies);
console.log("  ALL HASTE:");
console.log(`    Win Rate: ${bossHaste.winRate.toFixed(1)}%`);
console.log(`    Avg Damage Taken: ${bossHaste.averageDamageTaken.toFixed(1)} HP`);
console.log(
  `    Damage Reduction: ${((1 - bossHaste.averageDamageTaken / bossBaseline.averageDamageTaken) * 100).toFixed(1)}%`,
);

console.log("\n" + "=".repeat(70));
console.log("ANALYSIS:");
if (haste3.averageDamageTaken < baseline.averageDamageTaken * 0.3) {
  console.log("⚠️  SEVERELY OVERPOWERED - Reduces damage by >70%");
} else if (haste3.averageDamageTaken < baseline.averageDamageTaken * 0.5) {
  console.log("⚠️  OVERPOWERED - Reduces damage by >50%");
} else if (haste3.averageDamageTaken < baseline.averageDamageTaken * 0.7) {
  console.log("⚠️  STRONG - Reduces damage by >30%");
} else {
  console.log("✅ BALANCED - Reasonable power level");
}
console.log("=".repeat(70) + "\n");
