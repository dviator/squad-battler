import { describe, expect, test } from "vitest";
import {
  applyConsumableToUnit,
  applyGeneticModToUnit,
  awardGold,
  generateShop,
  purchaseItem,
  SHOP_ITEMS,
} from "../src/core/shop";
import { GeneticGrade, ItemCategory, Position } from "../src/core/types";
import { createUnit } from "../src/core/unit";
import { BEAR } from "../src/data/species";

describe("Shop System", () => {
  test("shop has defined items", () => {
    expect(SHOP_ITEMS.length).toBeGreaterThan(0);

    const healthPotion = SHOP_ITEMS.find((item) => item.id === "health_potion_small");
    expect(healthPotion).toBeDefined();
    expect(healthPotion?.cost).toBe(3); // Updated cost
    expect(healthPotion?.category).toBe(ItemCategory.Consumable);
  });

  test("generates strategic shop with variety", () => {
    const shop = generateShop(0);

    // Should always include all 3 healing potions
    const healingPotions = shop.filter((item) => item.id.includes("health_potion"));
    expect(healingPotions.length).toBe(3);

    // Should have at least 4 total items (3 potions + at least 1 other)
    expect(shop.length).toBeGreaterThanOrEqual(4);

    // All items should be unique
    const ids = shop.map((item) => item.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(shop.length);
  });

  test("cannot purchase without enough gold", () => {
    const currency = { gold: 5, materials: 0 };
    const expensiveItem = SHOP_ITEMS.find((item) => item.cost > 10)!;

    const result = purchaseItem(currency, expensiveItem);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Not enough gold");
    expect(result.newCurrency.gold).toBe(5);
  });

  test("successful purchase deducts gold", () => {
    const currency = { gold: 10, materials: 0 };
    const item = SHOP_ITEMS.find((item) => item.cost === 3)!;

    const result = purchaseItem(currency, item);
    expect(result.success).toBe(true);
    expect(result.newCurrency.gold).toBe(7);
    expect(result.newCurrency.materials).toBe(0);
  });

  test("awards gold correctly", () => {
    const currency = { gold: 10, materials: 5 };
    const newCurrency = awardGold(currency, 3);

    expect(newCurrency.gold).toBe(13);
    expect(newCurrency.materials).toBe(5);
  });
});

describe("Consumable Items", () => {
  test("health potion heals unit", () => {
    const unit = createUnit(BEAR, Position.Center);
    const damaged = { ...unit, stats: { ...unit.stats, currentHp: 10 } };

    const healthPotion = SHOP_ITEMS.find((item) => item.id === "health_potion_small")!;
    const result = applyConsumableToUnit(damaged, healthPotion as any, BEAR);

    expect(result.unit.stats.currentHp).toBe(30); // 10 + 20 HP from small potion
  });

  test("health potion cannot overheal", () => {
    const unit = createUnit(BEAR, Position.Center);
    const maxHp = unit.stats.maxHp;
    const nearMax = { ...unit, stats: { ...unit.stats, currentHp: maxHp - 1 } };

    const largePotion = SHOP_ITEMS.find((item) => item.id === "health_potion_large")!;
    const result = applyConsumableToUnit(nearMax, largePotion as any, BEAR);

    expect(result.unit.stats.currentHp).toBe(maxHp);
  });
});

describe("Genetic Mod Items", () => {
  test("mutation serum adds mutation to unit", () => {
    const unit = createUnit(BEAR, Position.Center);
    expect(unit.mutations).not.toContain("thick_hide");

    const mutationSerum = SHOP_ITEMS.find((item) => item.id === "mutation_thick_hide")!;
    const modified = applyGeneticModToUnit(unit, mutationSerum as any, BEAR);

    expect(modified.mutations).toContain("thick_hide");
  });

  test("mutation serum does not duplicate existing mutations", () => {
    const unit = createUnit(BEAR, Position.Center, { mutations: ["thick_hide"] });

    const mutationSerum = SHOP_ITEMS.find((item) => item.id === "mutation_thick_hide")!;
    const modified = applyGeneticModToUnit(unit, mutationSerum as any, BEAR);

    const thickHideCount = modified.mutations.filter((m) => m === "thick_hide").length;
    expect(thickHideCount).toBe(1);
  });

  test("gene boost upgrades genetic potential", () => {
    const unit = createUnit(BEAR, Position.Center, {
      potential: {
        maxHp: GeneticGrade.C,
        speed: GeneticGrade.B,
        attackPower: GeneticGrade.A,
      },
    });

    const geneBoost = SHOP_ITEMS.find((item) => item.id === "gene_boost_hp")!;
    const boosted = applyGeneticModToUnit(unit, geneBoost as any, BEAR);

    expect(boosted.geneticPotential.maxHp).toBe(GeneticGrade.B);
    expect(boosted.geneticPotential.speed).toBe(GeneticGrade.B); // Unchanged
    expect(boosted.geneticPotential.attackPower).toBe(GeneticGrade.A); // Unchanged
  });

  test("gene boost cannot upgrade beyond S grade", () => {
    const unit = createUnit(BEAR, Position.Center, {
      potential: {
        maxHp: GeneticGrade.S,
        speed: GeneticGrade.S,
        attackPower: GeneticGrade.S,
      },
    });

    const geneBoost = SHOP_ITEMS.find((item) => item.id === "gene_boost_hp")!;
    const boosted = applyGeneticModToUnit(unit, geneBoost as any, BEAR);

    expect(boosted.geneticPotential.maxHp).toBe(GeneticGrade.S);
  });
});
