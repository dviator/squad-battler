#!/usr/bin/env bun

import { displayCombatLog, displayCombatSummary } from "../src/cli/combatLog";
import { simulateBattle } from "../src/core/battle";
import { Position } from "../src/core/types";
import { createUnit } from "../src/core/unit";
import { GOOB, MEGA_GOOB } from "../src/data/enemies";
import { BEAR, EAGLE, TIGER } from "../src/data/species";

console.log("=".repeat(70));
console.log("                      COMBAT LOG DEMO");
console.log("=".repeat(70));

console.log("\n🎯 Player Squad:");
const playerSquad = [
  createUnit(BEAR, Position.Left),
  createUnit(EAGLE, Position.Center),
  createUnit(TIGER, Position.Right),
];

playerSquad.forEach((unit) => {
  console.log(
    `  ${unit.speciesId.toUpperCase()} - ${unit.stats.maxHp} HP, ${unit.stats.speed} SPD, ${unit.stats.attackPower} ATK`,
  );
  console.log(`    Attacks: ${unit.attacks.map((a) => a.name).join(", ")}`);
});

console.log("\n⚔️  Enemy Squad:");
const enemySquad = [createUnit(GOOB, Position.Left), createUnit(MEGA_GOOB, Position.Center)];

enemySquad.forEach((unit) => {
  console.log(
    `  ${unit.speciesId.toUpperCase()} - ${unit.stats.maxHp} HP, ${unit.stats.speed} SPD, ${unit.stats.attackPower} ATK`,
  );
  console.log(`    Attacks: ${unit.attacks.map((a) => a.name).join(", ")}`);
});

console.log("\n" + "=".repeat(70));
console.log("                      BATTLE START!");
console.log("=".repeat(70));

const battleState = simulateBattle(playerSquad, enemySquad, 100);

displayCombatLog(battleState);
displayCombatSummary(battleState);

console.log("\n" + "=".repeat(70));
console.log(battleState.winner === "player" ? "🎉 PLAYER VICTORY!" : "💀 ENEMY VICTORY!");
console.log("=".repeat(70) + "\n");
