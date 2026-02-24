#!/usr/bin/env bun

import { createGameState } from "../src/core/gameState";
import { simulateCombat, simulateMultipleRuns, simulateRun } from "../src/core/runSimulator";
import { Position } from "../src/core/types";
import { createUnit } from "../src/core/unit";
import { createCampaign, generateNormalEncounter } from "../src/core/world";
import { BEAR, EAGLE, TIGER, WOLF } from "../src/data/species";

const SPECIES_POOL = [BEAR, EAGLE, TIGER, WOLF];

console.log("=== GENETIC ROGUELIKE DEMO ===\n");

// 1. Show a single combat in detail
console.log("1. SINGLE COMBAT SIMULATION");
console.log("─".repeat(50));

const playerSquad = [
  createUnit(BEAR, Position.Left),
  createUnit(EAGLE, Position.Center),
  createUnit(TIGER, Position.Right),
];

console.log("\n📋 Player Squad:");
playerSquad.forEach((unit) => {
  console.log(
    `  ${unit.speciesId.padEnd(6)} | HP: ${unit.stats.currentHp}/${unit.stats.maxHp} | Speed: ${unit.stats.speed} | Attack: ${unit.stats.attackPower} | Level: ${unit.level}`,
  );
  console.log(
    `           Potential: HP=${unit.geneticPotential.maxHp} Speed=${unit.geneticPotential.speed} Attack=${unit.geneticPotential.attackPower}`,
  );
});

const encounter = generateNormalEncounter("demo_combat", SPECIES_POOL, 1, 3);

console.log("\n⚔️  Enemy Squad:");
encounter.enemies.forEach((unit) => {
  console.log(
    `  ${unit.speciesId.padEnd(6)} | HP: ${unit.stats.currentHp}/${unit.stats.maxHp} | Speed: ${unit.stats.speed} | Attack: ${unit.stats.attackPower} | Level: ${unit.level}`,
  );
});

const combatResult = simulateCombat(playerSquad, encounter);

console.log(`\n🏆 Result: ${combatResult.victory ? "VICTORY!" : "DEFEAT"}`);
console.log(`   Gold earned: ${combatResult.goldEarned}`);
console.log(`   Materials earned: ${combatResult.materialsEarned}`);
console.log(`   Combat lasted: ${combatResult.battleState.tick} ticks`);
console.log(`   Survivors: ${combatResult.survivors.length}`);

if (combatResult.victory) {
  console.log("\n💪 Surviving Units:");
  combatResult.survivors.forEach((unit) => {
    console.log(
      `  ${unit.speciesId.padEnd(6)} | HP: ${unit.stats.currentHp}/${unit.stats.maxHp} (${Math.round((unit.stats.currentHp / unit.stats.maxHp) * 100)}%)`,
    );
  });
}

// 2. Show a full campaign run
console.log("\n\n2. FULL CAMPAIGN RUN");
console.log("─".repeat(50));

const freshSquad = [
  createUnit(BEAR, Position.Left),
  createUnit(EAGLE, Position.Center),
  createUnit(TIGER, Position.Right),
];

const gameState = createGameState(freshSquad, []);
const campaign = createCampaign(SPECIES_POOL);

console.log("\n🎮 Starting campaign...");
console.log(`   Worlds: ${campaign.worlds.length}`);
console.log(`   Starting gold: ${gameState.currency.gold}`);

const runResult = simulateRun(gameState, campaign, SPECIES_POOL);

console.log(`\n📊 Campaign Result: ${runResult.success ? "✅ SUCCESS" : "❌ FAILED"}`);
console.log(`   Reason: ${runResult.reason}`);
console.log(`   Combats completed: ${runResult.combatsCompleted}`);
console.log(`   Levels completed: ${runResult.levelsCompleted}`);
console.log(`   Worlds completed: ${runResult.worldsCompleted}`);
console.log(`   Gold earned: ${runResult.goldEarned}`);
console.log(`   Materials earned: ${runResult.materialsEarned}`);
console.log(`   Time elapsed: ${runResult.timeElapsed.toFixed(2)} days`);

console.log("\n🦸 Final Squad:");
runResult.finalSquad.forEach((unit) => {
  console.log(
    `  ${unit.speciesId.padEnd(6)} | Level ${unit.level} | HP: ${unit.stats.currentHp}/${unit.stats.maxHp} | Age: ${unit.age.toFixed(1)}d | Stage: ${unit.lifeStage}`,
  );
});

// 3. Run balance analysis
console.log("\n\n3. BALANCE ANALYSIS (100 runs)");
console.log("─".repeat(50));

const createInitialState = () => {
  const squad = [
    createUnit(BEAR, Position.Left),
    createUnit(EAGLE, Position.Center),
    createUnit(TIGER, Position.Right),
  ];
  return createGameState(squad, []);
};

const createCamp = () => createCampaign(SPECIES_POOL);

console.log("\n⏳ Running 100 simulations...");
const metrics = simulateMultipleRuns(100, createInitialState, createCamp, SPECIES_POOL);

console.log("\n📈 Results:");
console.log(`   Total runs: ${metrics.totalRuns}`);
console.log(
  `   Successful: ${metrics.successfulRuns} (${Math.round((metrics.successfulRuns / metrics.totalRuns) * 100)}%)`,
);
console.log(`   Avg combats completed: ${metrics.averageCombatsCompleted.toFixed(1)}`);
console.log(`   Max combats in one run: ${metrics.maxCombatsCompleted}`);
console.log(`   Avg gold earned: ${metrics.averageGoldEarned.toFixed(1)}`);
console.log(`   Avg materials earned: ${Math.round(metrics.averageGoldEarned * 0.1)}`);
console.log(`   Avg levels completed: ${metrics.averageLevelsCompleted.toFixed(1)}`);
console.log(`   Avg time elapsed: ${metrics.averageTimeElapsed.toFixed(2)} days`);

if (Object.keys(metrics.failureReasons).length > 0) {
  console.log("\n💀 Failure Reasons:");
  Object.entries(metrics.failureReasons).forEach(([reason, count]) => {
    console.log(`   ${reason}: ${count} times (${Math.round((count / metrics.totalRuns) * 100)}%)`);
  });
}

console.log("\n✅ DEMO COMPLETE\n");
