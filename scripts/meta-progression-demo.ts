#!/usr/bin/env bun

import { createGameState } from "../src/core/gameState";
import { addToStable, collectOffspring, isBreedingComplete, startBreeding } from "../src/core/lab";
import { simulateRun } from "../src/core/runSimulator";
import type { Unit } from "../src/core/types";
import { GeneticGrade, Position } from "../src/core/types";
import { canBreed, createUnit } from "../src/core/unit";
import { createCampaign } from "../src/core/world";
import { BEAR, EAGLE, TIGER, WOLF } from "../src/data/species";

const SPECIES_POOL = [BEAR, EAGLE, TIGER, WOLF];

console.log("=== ROGUELIKE META-PROGRESSION DEMO ===\n");
console.log("Theme: You're trapped in an evil corporate lab.");
console.log("Goal: Breed stronger units across runs to eventually escape!\n");

// Persistent state across runs
let persistentGold = 0;
let persistentMaterials = 0;
let roster: Unit[] = [];

// Initialize starting roster (3 basic units)
console.log("📦 STARTING ROSTER:");
const initialSquad = [
  createUnit(BEAR, Position.Left, {
    potential: { maxHp: GeneticGrade.D, speed: GeneticGrade.D, attackPower: GeneticGrade.F },
  }),
  createUnit(EAGLE, Position.Center, {
    potential: { maxHp: GeneticGrade.D, speed: GeneticGrade.D, attackPower: GeneticGrade.F },
  }),
  createUnit(TIGER, Position.Right, {
    potential: { maxHp: GeneticGrade.D, speed: GeneticGrade.D, attackPower: GeneticGrade.F },
  }),
];

roster = [...initialSquad];

initialSquad.forEach((unit) => {
  console.log(
    `  ${unit.speciesId.padEnd(6)} | Level ${unit.level} | Potential: ${unit.geneticPotential.maxHp}/${unit.geneticPotential.speed}/${unit.geneticPotential.attackPower}`,
  );
});

console.log("\n" + "=".repeat(60) + "\n");

// Simulate multiple runs with meta-progression
const maxRuns = 10;
let successfulRun = false;

for (let runNumber = 1; runNumber <= maxRuns && !successfulRun; runNumber++) {
  console.log(`🎮 RUN #${runNumber}`);
  console.log("─".repeat(60));

  // Select best 3 units from roster for this run
  const availableUnits = roster.filter((u) => u.stats.currentHp === u.stats.maxHp);

  if (availableUnits.length < 3) {
    console.log("⚠️  Not enough healthy units! Need to heal/breed more.");
    break;
  }

  // Sort by stats and pick top 3
  const squadForRun = availableUnits
    .sort((a, b) => b.stats.maxHp + b.stats.attackPower - (a.stats.maxHp + a.stats.attackPower))
    .slice(0, 3)
    .map((u, i) => ({ ...u, position: i as Position }));

  console.log("\n📋 Squad for this run:");
  squadForRun.forEach((unit) => {
    console.log(
      `  ${unit.speciesId.padEnd(6)} | Level ${unit.level} | HP: ${unit.stats.maxHp} | Attack: ${unit.stats.attackPower} | Potential: ${unit.geneticPotential.maxHp}/${unit.geneticPotential.speed}/${unit.geneticPotential.attackPower}`,
    );
  });

  // Run the campaign
  const gameState = createGameState(squadForRun, []);
  const campaign = createCampaign(SPECIES_POOL);
  const result = simulateRun(gameState, campaign, SPECIES_POOL);

  console.log(`\n📊 Result: ${result.success ? "✅ ESCAPED!" : "💀 Defeated"}`);
  console.log(
    `   Combats: ${result.combatsCompleted} | Gold: +${result.goldEarned} | Materials: +${result.materialsEarned}`,
  );

  // Update persistent resources
  persistentGold += result.goldEarned;
  persistentMaterials += result.materialsEarned;

  console.log(`   💰 Total Resources: ${persistentGold} gold, ${persistentMaterials} materials`);

  if (result.success) {
    console.log("\n🎉 VICTORY! You escaped the lab!");
    successfulRun = true;
    break;
  }

  // Meta-progression: breed survivors to create stronger offspring
  console.log("\n🧬 Lab Phase:");

  // Add survivors back to roster (with their XP/levels)
  const survivors = result.finalSquad.filter((u) => u.stats.currentHp > 0);
  console.log(`   Survivors: ${survivors.length}`);

  // Update roster with leveled-up survivors
  survivors.forEach((survivor) => {
    const index = roster.findIndex((u) => u.id === survivor.id);
    if (index !== -1) {
      roster[index] = survivor;
    }
  });

  // Breed the two best survivors if possible
  const breedableUnits = survivors.filter(canBreed).sort((a, b) => {
    const scoreA =
      a.stats.maxHp + a.stats.attackPower + (a.geneticPotential.maxHp === GeneticGrade.S ? 100 : 0);
    const scoreB =
      b.stats.maxHp + b.stats.attackPower + (b.geneticPotential.maxHp === GeneticGrade.S ? 100 : 0);
    return scoreB - scoreA;
  });

  if (breedableUnits.length >= 2) {
    const parent1 = breedableUnits[0];
    const parent2 = breedableUnits[1];

    console.log(
      `   Breeding: ${parent1.speciesId} (Lvl ${parent1.level}) + ${parent2.speciesId} (Lvl ${parent2.level})`,
    );

    const breedingSlot = startBreeding(parent1, parent2, 0); // Instant breeding for demo
    const completed = { ...breedingSlot, daysRemaining: 0 };

    if (isBreedingComplete(completed)) {
      const offspring = collectOffspring(completed, SPECIES_POOL[0], Position.Left);
      roster.push(offspring);

      console.log(
        `   ✨ Offspring created! Potential: ${offspring.geneticPotential.maxHp}/${offspring.geneticPotential.speed}/${offspring.geneticPotential.attackPower}`,
      );
    }
  }

  // Heal all units for next run (instant for demo)
  roster = roster.map((unit) => ({
    ...unit,
    stats: {
      ...unit.stats,
      currentHp: unit.stats.maxHp,
    },
  }));

  console.log(`   🏥 All units healed`);
  console.log(`   👥 Roster size: ${roster.length} units\n`);
}

console.log("\n" + "=".repeat(60));
console.log("\n📈 META-PROGRESSION SUMMARY:");
console.log(`   Total runs: ${Math.min(maxRuns, successfulRun ? maxRuns : maxRuns)}`);
console.log(`   Success: ${successfulRun ? "YES" : "Not yet"}`);
console.log(`   Final roster: ${roster.length} units`);
console.log(`   Resources: ${persistentGold} gold, ${persistentMaterials} materials`);

console.log("\n🔬 Final Roster Genetics:");
roster
  .sort((a, b) => b.stats.maxHp + b.stats.attackPower - (a.stats.maxHp + a.stats.attackPower))
  .slice(0, 10)
  .forEach((unit, i) => {
    console.log(
      `  ${(i + 1).toString().padStart(2)}. ${unit.speciesId.padEnd(6)} | Lvl ${unit.level} | HP: ${unit.stats.maxHp.toString().padStart(3)} | Atk: ${unit.stats.attackPower.toString().padStart(2)} | Pot: ${unit.geneticPotential.maxHp}${unit.geneticPotential.speed}${unit.geneticPotential.attackPower}`,
    );
  });

console.log("\n✅ DEMO COMPLETE\n");
