#!/usr/bin/env bun

import { createGameState } from "../src/core/gameState";
import {
  addToStable,
  collectOffspring,
  isBreedingComplete,
  recruitUnit,
  startBreeding,
} from "../src/core/lab";
import { simulateRun } from "../src/core/runSimulator";
import { applyGeneticModToUnit, SHOP_ITEMS } from "../src/core/shop";
import type { Unit } from "../src/core/types";
import { GeneticGrade, ItemCategory, Position } from "../src/core/types";
import { canBreed, createUnit } from "../src/core/unit";
import { createGoobCampaign } from "../src/core/world";
import { GOOB, MEGA_GOOB } from "../src/data/enemies";
import { BEAR, EAGLE, TIGER } from "../src/data/species";

const PLAYER_SPECIES = [BEAR, EAGLE, TIGER];

console.log("=== FULL ROGUELIKE META-PROGRESSION DEMO ===\n");
console.log("🏢 Setting: Evil Corporate Lab - Basement Levels");
console.log("🎯 Goal: Breed and evolve your squad to escape!");
console.log("👾 Enemies: Goobs (gray blobs) and Mega Goobs\n");

// Persistent state across runs
let persistentGold = 0;
let persistentMaterials = 0;
let roster: Unit[] = [];
const unlockedStations = ["healing", "recruiting"];

// Initialize starting roster (3 basic units with poor genetics)
console.log("📦 STARTING ROSTER (Poor Genetics):");
const initialSquad = [
  createUnit(BEAR, Position.Left, {
    potential: { maxHp: GeneticGrade.F, speed: GeneticGrade.F, attackPower: GeneticGrade.F },
  }),
  createUnit(EAGLE, Position.Center, {
    potential: { maxHp: GeneticGrade.F, speed: GeneticGrade.D, attackPower: GeneticGrade.F },
  }),
  createUnit(TIGER, Position.Right, {
    potential: { maxHp: GeneticGrade.F, speed: GeneticGrade.F, attackPower: GeneticGrade.D },
  }),
];

roster = [...initialSquad];

initialSquad.forEach((unit, i) => {
  console.log(
    `  ${i + 1}. ${unit.speciesId.padEnd(6)} | HP: ${unit.stats.maxHp.toString().padStart(3)} | Atk: ${unit.stats.attackPower.toString().padStart(2)} | Gen Pot: ${unit.geneticPotential.maxHp}${unit.geneticPotential.speed}${unit.geneticPotential.attackPower}`,
  );
});

console.log("\n" + "=".repeat(70) + "\n");

// Simulate multiple runs with full meta-progression
const maxRuns = 15;
let successfulRun = false;

for (let runNumber = 1; runNumber <= maxRuns && !successfulRun; runNumber++) {
  console.log(`🎮 RUN #${runNumber}`);
  console.log("─".repeat(70));

  // Select best 3 units from roster for this run
  const availableUnits = roster
    .filter((u) => u.stats.currentHp === u.stats.maxHp && u.lifeStage !== "dead")
    .sort((a, b) => {
      const scoreA = a.stats.maxHp + a.stats.attackPower + a.level * 10;
      const scoreB = b.stats.maxHp + b.stats.attackPower + b.level * 10;
      return scoreB - scoreA;
    });

  if (availableUnits.length < 3) {
    console.log("⚠️  Not enough healthy units! Recruiting...");

    while (roster.length < 6) {
      const newUnit = recruitUnit(PLAYER_SPECIES[roster.length % 3], Position.Left);
      roster.push(newUnit);
    }

    continue;
  }

  const squadForRun = availableUnits.slice(0, 3).map((u, i) => ({ ...u, position: i as Position }));

  console.log("\n📋 Squad:");
  squadForRun.forEach((unit, i) => {
    console.log(
      `  ${i + 1}. ${unit.speciesId.padEnd(6)} Lvl ${unit.level.toString().padStart(2)} | HP: ${unit.stats.maxHp.toString().padStart(3)} | Atk: ${unit.stats.attackPower.toString().padStart(2)} | Pot: ${unit.geneticPotential.maxHp}${unit.geneticPotential.speed}${unit.geneticPotential.attackPower}`,
    );
  });

  // Run the campaign
  const gameState = createGameState(squadForRun, []);
  const campaign = createGoobCampaign(GOOB, MEGA_GOOB, PLAYER_SPECIES);
  const result = simulateRun(gameState, campaign, PLAYER_SPECIES);

  console.log(`\n📊 ${result.success ? "✅ ESCAPED!" : "💀 Defeated"}`);
  console.log(
    `   Combats: ${result.combatsCompleted} | Gold: +${result.goldEarned} | Materials: +${result.materialsEarned}`,
  );

  persistentGold += result.goldEarned;
  persistentMaterials += result.materialsEarned;

  console.log(`   💰 Total: ${persistentGold}g, ${persistentMaterials}m`);

  if (result.success) {
    console.log("\n🎉 VICTORY! You escaped the basement!");
    successfulRun = true;
    break;
  }

  // Update roster with survivors (who gained XP/levels)
  const survivors = result.finalSquad.filter((u) => u.stats.currentHp > 0);
  survivors.forEach((survivor) => {
    const index = roster.findIndex((u) => u.id === survivor.id);
    if (index !== -1) {
      roster[index] = survivor;
    }
  });

  console.log(`\n🧬 LAB PHASE (${survivors.length} survivors):`);

  // Shop: Buy genetic mods if we have gold
  if (persistentGold >= 20) {
    const geneBoost = SHOP_ITEMS.find((item) => item.id === "gene_boost_hp");
    if (geneBoost) {
      // Find unit with worst HP potential
      const worstHpUnit = roster
        .filter((u) => u.geneticPotential.maxHp !== GeneticGrade.S)
        .sort((a, b) => {
          const gradeOrder = { F: 0, D: 1, C: 2, B: 3, A: 4, S: 5 };
          return gradeOrder[a.geneticPotential.maxHp] - gradeOrder[b.geneticPotential.maxHp];
        })[0];

      if (worstHpUnit) {
        const oldGrade = worstHpUnit.geneticPotential.maxHp;
        const speciesData = PLAYER_SPECIES.find((s) => s.id === worstHpUnit.speciesId)!;
        const upgraded = applyGeneticModToUnit(worstHpUnit, geneBoost as any, speciesData);

        const index = roster.findIndex((u) => u.id === worstHpUnit.id);
        roster[index] = upgraded;

        persistentGold -= 20;
        console.log(
          `   💉 Gene Boost: ${worstHpUnit.speciesId} HP potential ${oldGrade} → ${upgraded.geneticPotential.maxHp} (-20g)`,
        );
      }
    }
  }

  // Breeding: Breed the two best survivors
  if (unlockedStations.includes("breeding")) {
    const breedableUnits = survivors.filter(canBreed).sort((a, b) => {
      const scoreA =
        a.stats.maxHp +
        a.stats.attackPower +
        (a.geneticPotential.maxHp === GeneticGrade.A ? 50 : 0);
      const scoreB =
        b.stats.maxHp +
        b.stats.attackPower +
        (b.geneticPotential.maxHp === GeneticGrade.A ? 50 : 0);
      return scoreB - scoreA;
    });

    if (breedableUnits.length >= 2) {
      const parent1 = breedableUnits[0];
      const parent2 = breedableUnits[1];

      const breedingSlot = startBreeding(parent1, parent2, 0);
      const completed = { ...breedingSlot, daysRemaining: 0 };

      if (isBreedingComplete(completed)) {
        const speciesData = PLAYER_SPECIES.find((s) => s.id === parent1.speciesId)!;
        const offspring = collectOffspring(completed, speciesData, Position.Left);
        roster.push(offspring);

        console.log(
          `   🧬 Bred: ${parent1.speciesId}(${parent1.geneticPotential.maxHp}${parent1.geneticPotential.speed}${parent1.geneticPotential.attackPower}) + ${parent2.speciesId}(${parent2.geneticPotential.maxHp}${parent2.geneticPotential.speed}${parent2.geneticPotential.attackPower}) → offspring(${offspring.geneticPotential.maxHp}${offspring.geneticPotential.speed}${offspring.geneticPotential.attackPower})`,
        );
      }
    } else {
      console.log("   ⚠️  Not enough breedable survivors");
    }
  }

  // Heal all units
  roster = roster.map((unit) => ({
    ...unit,
    stats: {
      ...unit.stats,
      currentHp: unit.stats.maxHp,
    },
  }));

  console.log(`   🏥 All units healed | Roster: ${roster.length} units\n`);
}

console.log("\n" + "=".repeat(70));
console.log("\n📈 FINAL STATS:");
console.log(`   Runs: ${successfulRun ? maxRuns : "Did not escape"}`);
console.log(`   Success: ${successfulRun ? "YES" : "NO"}`);
console.log(`   Resources: ${persistentGold}g, ${persistentMaterials}m`);
console.log(`   Roster: ${roster.length} units`);

console.log("\n🏆 TOP 10 UNITS:");
roster
  .sort((a, b) => {
    const scoreA = a.stats.maxHp + a.stats.attackPower + a.level * 5;
    const scoreB = b.stats.maxHp + b.stats.attackPower + b.level * 5;
    return scoreB - scoreA;
  })
  .slice(0, 10)
  .forEach((unit, i) => {
    console.log(
      `  ${(i + 1).toString().padStart(2)}. ${unit.speciesId.padEnd(6)} Lvl ${unit.level.toString().padStart(2)} | HP: ${unit.stats.maxHp.toString().padStart(3)} | Atk: ${unit.stats.attackPower.toString().padStart(2)} | Age: ${unit.age.toFixed(1)}d | Pot: ${unit.geneticPotential.maxHp}${unit.geneticPotential.speed}${unit.geneticPotential.attackPower}`,
    );
  });

console.log("\n✅ DEMO COMPLETE\n");
