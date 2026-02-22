import { describe, expect, test } from "vitest";
import { simulateBattle } from "../src/core/battle";
import { createGameState } from "../src/core/gameState";
import { generateShop } from "../src/core/shop";
import { Position } from "../src/core/types";
import { createUnit } from "../src/core/unit";
import { createGoobCampaign, getCurrentEncounter } from "../src/core/world";
import { GOOB, HEAVY_GOOB, MEGA_GOOB } from "../src/data/enemies";
import { BEAR, EAGLE, TIGER } from "../src/data/species";

describe("Game Integration", () => {
  test("game initializes with valid state", () => {
    const squad = [
      createUnit(BEAR, Position.Left),
      createUnit(EAGLE, Position.Center),
      createUnit(TIGER, Position.Right),
    ];

    const gameState = createGameState(squad, []);

    expect(gameState.roster.squad).toHaveLength(3);
    expect(gameState.currency.gold).toBe(0);
    expect(gameState.progress.worldsCompleted).toBe(0);
    expect(gameState.progress.encountersCompleted).toBe(0);
  });

  test("campaign creates valid first encounter", () => {
    const campaign = createGoobCampaign(GOOB, HEAVY_GOOB, MEGA_GOOB, [BEAR, EAGLE, TIGER]);
    const encounter = getCurrentEncounter(campaign);

    expect(encounter).not.toBeNull();
    expect(encounter?.enemies).toBeDefined();
    expect(encounter?.enemies.length).toBeGreaterThan(0);
    expect(encounter?.goldReward).toBeGreaterThan(0);
    expect(encounter?.materialsReward).toBeGreaterThanOrEqual(0);
  });

  test("first encounter enemies are properly initialized", () => {
    const campaign = createGoobCampaign(GOOB, HEAVY_GOOB, MEGA_GOOB, [BEAR, EAGLE, TIGER]);
    const encounter = getCurrentEncounter(campaign);

    expect(encounter).not.toBeNull();
    const enemies = encounter?.enemies || [];

    for (const enemy of enemies) {
      expect(enemy.stats.maxHp).toBeGreaterThan(0);
      expect(enemy.stats.currentHp).toBe(enemy.stats.maxHp);
      expect(enemy.stats.speed).toBeGreaterThan(0);
      expect(enemy.stats.attackPower).toBeGreaterThanOrEqual(0);
      expect(enemy.attacks.length).toBeGreaterThan(0);
      expect(enemy.equipment).toBeDefined();
    }
  });

  test("shop generates valid items", () => {
    const shop = generateShop(0);

    expect(shop.length).toBeGreaterThan(0);
    for (const item of shop) {
      expect(item.id).toBeDefined();
      expect(item.name).toBeDefined();
      expect(item.cost).toBeGreaterThan(0);
      expect(item.category).toBeDefined();
    }
  });

  test("complete first encounter workflow", () => {
    // Setup
    const squad = [
      createUnit(BEAR, Position.Left),
      createUnit(EAGLE, Position.Center),
      createUnit(TIGER, Position.Right),
    ];
    const gameState = createGameState(squad, []);
    const campaign = createGoobCampaign(GOOB, HEAVY_GOOB, MEGA_GOOB, [BEAR, EAGLE, TIGER]);

    // Get encounter
    const encounter = getCurrentEncounter(campaign);
    expect(encounter).not.toBeNull();

    // Run battle
    const battleState = simulateBattle(gameState.roster.squad, encounter!.enemies);

    // Verify battle completed
    expect(battleState.isComplete).toBe(true);
    expect(battleState.winner).toBeDefined();
  });

  test("units have equipment field initialized", () => {
    const unit = createUnit(BEAR, Position.Center);

    expect(unit.equipment).toBeDefined();
    expect(Array.isArray(unit.equipment)).toBe(true);
  });
});
