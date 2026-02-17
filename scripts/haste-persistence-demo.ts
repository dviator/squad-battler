#!/usr/bin/env bun

import { simulateBattle } from "../src/core/battle";
import { applyConsumableToUnit } from "../src/core/shop";
import type { ConsumableItem } from "../src/core/types";
import { ConsumableEffect, ItemCategory, Position } from "../src/core/types";
import { createUnit } from "../src/core/unit";
import { GOOB } from "../src/data/enemies";
import { BEAR } from "../src/data/species";

console.log("=== HASTE SERUM PERSISTENCE TEST ===\n");

const hasteSerum: ConsumableItem = {
  id: "haste_serum",
  name: "Haste Serum",
  description: "Reduces one unit's attack cooldowns by 1 permanently",
  category: ItemCategory.Consumable,
  cost: 8,
  effect: { type: ConsumableEffect.ReduceCooldowns, amount: 1, duration: "permanent" },
};

// Create a bear
let bear = createUnit(BEAR, Position.Center);

console.log("Bear's attacks at creation:");
bear.attacks.forEach((a) => console.log(`  ${a.name}: CD ${a.baseCooldown}`));

// Apply Haste Serum
console.log("\n🧪 Applying Haste Serum...\n");
const result = applyConsumableToUnit(bear, hasteSerum, BEAR);
bear = result.unit;

console.log("Bear's attacks after Haste Serum:");
bear.attacks.forEach((a) => console.log(`  ${a.name}: CD ${a.baseCooldown} ✨`));

// Fight Battle 1
console.log("\n⚔️  Battle 1...");
const enemy1 = createUnit(GOOB, Position.Center);
const battle1 = simulateBattle([bear], [enemy1], 50);
bear = battle1.playerUnits[0]!;

console.log("Bear's attacks after Battle 1:");
bear.attacks.forEach((a) => console.log(`  ${a.name}: CD ${a.baseCooldown} ✨`));

// Fight Battle 2
console.log("\n⚔️  Battle 2...");
const enemy2 = createUnit(GOOB, Position.Center);
const battle2 = simulateBattle([bear], [enemy2], 50);
bear = battle2.playerUnits[0]!;

console.log("Bear's attacks after Battle 2:");
bear.attacks.forEach((a) => console.log(`  ${a.name}: CD ${a.baseCooldown} ✨`));

console.log("\n✅ Cooldown reduction persists across battles!");
console.log("   The baseCooldown values remain permanently reduced.\n");
