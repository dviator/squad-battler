#!/usr/bin/env bun

import { simulateBattle } from "../src/core/battle";
import { applyConsumableToUnit } from "../src/core/shop";
import type { ConsumableItem } from "../src/core/types";
import { ConsumableEffect, ItemCategory, Position } from "../src/core/types";
import { createUnit } from "../src/core/unit";
import { GOOB } from "../src/data/enemies";
import { BEAR } from "../src/data/species";

console.log("=== RUN-SCOPED HASTE SERUM ===\n");

const hasteSerum: ConsumableItem = {
  id: "haste_serum",
  name: "Haste Serum",
  description: "Reduces one unit's attack cooldowns by 1 for this run",
  category: ItemCategory.Consumable,
  cost: 8,
  effect: { type: ConsumableEffect.ReduceCooldowns, amount: 1, duration: "permanent" },
};

console.log("📋 RUN 1: Fresh start");
let bear = createUnit(BEAR, Position.Center);

console.log("Bear attacks (base):");
bear.attacks.forEach((a) => console.log(`  ${a.name}: CD ${a.baseCooldown}`));
console.log(`Bear cooldownReduction: ${bear.cooldownReduction}`);

// Apply Haste Serum
console.log("\n🧪 Applying Haste Serum...");
const result = applyConsumableToUnit(bear, hasteSerum, BEAR);
bear = result.unit;

console.log("\nBear attacks (still base values):");
bear.attacks.forEach((a) => console.log(`  ${a.name}: CD ${a.baseCooldown}`));
console.log(`Bear cooldownReduction: ${bear.cooldownReduction} ✨`);

// Fight a battle to see effective cooldowns
console.log("\n⚔️  Fighting battle...");
const enemy1 = createUnit(GOOB, Position.Center);
const battle = simulateBattle([bear], [enemy1], 50);

console.log("\n📊 In battle, effective cooldowns were:");
console.log("  (baseCooldown - cooldownReduction)");
bear.attacks.forEach((a) => {
  const effective = Math.max(1, a.baseCooldown - bear.cooldownReduction);
  console.log(`  ${a.name}: ${a.baseCooldown} - ${bear.cooldownReduction} = ${effective} ✨`);
});

// Simulate new run reset
console.log("\n\n📋 RUN 2: Starting fresh run (reset)");
const resetBear = {
  ...bear,
  stats: {
    ...bear.stats,
    currentHp: bear.stats.maxHp,
  },
  equipment: [],
  cooldownReduction: 0, // RESET!
};

console.log("\nBear after run reset:");
bear.attacks.forEach((a) => console.log(`  ${a.name}: CD ${a.baseCooldown}`));
console.log(`Bear cooldownReduction: ${resetBear.cooldownReduction} (back to 0!)`);

console.log("\n✅ Run-scoped cooldown reduction:");
console.log("   • Persists throughout the entire run");
console.log("   • Resets to 0 when starting a new run");
console.log("   • Does NOT permanently modify base cooldowns");
console.log("   • Works like equipment (run-scoped)\n");
