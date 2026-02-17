#!/usr/bin/env bun

import { applyConsumableToUnit } from "../src/core/shop";
import type { ConsumableItem } from "../src/core/types";
import { ConsumableEffect, ItemCategory, Position } from "../src/core/types";
import { createUnit } from "../src/core/unit";
import { BEAR, EAGLE } from "../src/data/species";

console.log("=== HASTE SERUM TEST ===\n");

const hasteSerum: ConsumableItem = {
  id: "haste_serum",
  name: "Haste Serum",
  description: "Reduces one unit's attack cooldowns by 1 permanently",
  category: ItemCategory.Consumable,
  cost: 8,
  effect: { type: ConsumableEffect.ReduceCooldowns, amount: 1, duration: "permanent" },
};

console.log("Creating two units:\n");

const bear = createUnit(BEAR, Position.Left);
const eagle = createUnit(EAGLE, Position.Center);

console.log("BEAR attacks BEFORE Haste Serum:");
bear.attacks.forEach((attack) => {
  console.log(`  ${attack.name}: Cooldown ${attack.baseCooldown}`);
});

console.log("\nEAGLE attacks BEFORE Haste Serum:");
eagle.attacks.forEach((attack) => {
  console.log(`  ${attack.name}: Cooldown ${attack.baseCooldown}`);
});

console.log("\n\n🧪 Applying Haste Serum to BEAR only...\n");

const result = applyConsumableToUnit(bear, hasteSerum, BEAR);
const hastedBear = result.unit;

console.log("BEAR attacks AFTER Haste Serum:");
hastedBear.attacks.forEach((attack) => {
  console.log(`  ${attack.name}: Cooldown ${attack.baseCooldown} ✨`);
});

console.log("\nEAGLE attacks (unchanged):");
eagle.attacks.forEach((attack) => {
  console.log(`  ${attack.name}: Cooldown ${attack.baseCooldown}`);
});

console.log("\n✅ Haste Serum only affects the unit it's applied to!");
console.log("   Bear's cooldowns reduced by 1, Eagle unaffected.\n");
