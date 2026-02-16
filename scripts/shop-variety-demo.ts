#!/usr/bin/env bun

import { generateShop, ItemRarity } from "../src/core/shop";
import { ItemCategory } from "../src/core/types";

console.log("=== SHOP VARIETY DEMO ===\n");
console.log("Generating 5 random shops to show variety and strategic choices\n");

for (let shopNum = 1; shopNum <= 5; shopNum++) {
  console.log(`${"=".repeat(70)}`);
  console.log(`SHOP #${shopNum} (Encounter ${shopNum * 2 - 1})`);
  console.log(`${"=".repeat(70)}\n`);

  const shop = generateShop((shopNum - 1) * 2);

  // Group by category
  const healing = shop.filter(
    (item) => item.category === ItemCategory.Consumable && item.id.includes("health"),
  );
  const enhancements = shop.filter(
    (item) => item.category === ItemCategory.Consumable && item.id.includes("enhancement"),
  );
  const boosts = shop.filter(
    (item) =>
      item.category === ItemCategory.Consumable &&
      !item.id.includes("health") &&
      !item.id.includes("enhancement"),
  );
  const equipment = shop.filter((item) => item.category === ItemCategory.Equipment);
  const mutations = shop.filter(
    (item) => item.category === ItemCategory.GeneticMod && item.id.includes("mutation"),
  );
  const geneBoosts = shop.filter(
    (item) => item.category === ItemCategory.GeneticMod && item.id.includes("gene_boost"),
  );

  console.log("🧪 HEALING POTIONS (Always Available):");
  healing.forEach((item) => {
    console.log(
      `  ${item.cost.toString().padStart(2)}g - ${item.name.padEnd(25)} - ${item.description}`,
    );
  });

  if (enhancements.length > 0) {
    console.log("\n✨ MUTATION ENHANCEMENTS (5% permanent chance):");
    enhancements.forEach((item) => {
      console.log(
        `  ${item.cost.toString().padStart(2)}g - ${item.name.padEnd(25)} - ${item.description}`,
      );
    });
  }

  if (boosts.length > 0) {
    console.log("\n⚡ COMBAT BOOSTS:");
    boosts.forEach((item) => {
      console.log(
        `  ${item.cost.toString().padStart(2)}g - ${item.name.padEnd(25)} - ${item.description}`,
      );
    });
  }

  if (equipment.length > 0) {
    console.log("\n🛡️  EQUIPMENT (Lasts for run):");
    equipment.forEach((item) => {
      console.log(
        `  ${item.cost.toString().padStart(2)}g - ${item.name.padEnd(25)} - ${item.description}`,
      );
    });
  }

  if (mutations.length > 0) {
    console.log("\n🧬 MUTATION SERUMS (Permanent):");
    mutations.forEach((item) => {
      console.log(
        `  ${item.cost.toString().padStart(2)}g - ${item.name.padEnd(25)} - ${item.description}`,
      );
    });
  }

  if (geneBoosts.length > 0) {
    console.log("\n💎 GENETIC ENHANCERS (Very Rare):");
    geneBoosts.forEach((item) => {
      console.log(
        `  ${item.cost.toString().padStart(2)}g - ${item.name.padEnd(25)} - ${item.description}`,
      );
    });
  }

  console.log(`\n📊 Shop Stats: ${shop.length} items total`);
  console.log(
    `   Common: ${healing.length} | Uncommon: ${enhancements.length + boosts.length + equipment.length} | Rare: ${mutations.length} | Very Rare: ${geneBoosts.length}`,
  );
  console.log();
}

console.log(`${"=".repeat(70)}`);
console.log("\n📈 STRATEGIC VARIETY:");
console.log("  • Healing always available (short-term survival)");
console.log("  • 2-3 tactical options per shop (boosts, equipment, enhancements)");
console.log("  • Rare items add long-term power");
console.log("  • Very rare gene boosts transform genetics (late game)");
console.log("\n✅ DEMO COMPLETE\n");
