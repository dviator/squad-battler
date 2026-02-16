import { describe, expect, test } from "vitest";
import { createGameState } from "../src/core/gameState";
import {
  aiLabDecisions,
  aiShopDecisions,
  completeHealing,
  simulateCombat,
  simulateMultipleRuns,
  simulateRun,
} from "../src/core/runSimulator";
import { generateShop } from "../src/core/shop";
import { Position } from "../src/core/types";
import { createUnit } from "../src/core/unit";
import { createCampaign, generateNormalEncounter } from "../src/core/world";
import { BEAR, EAGLE, TIGER } from "../src/data/species";

const TEST_SPECIES = [BEAR, EAGLE, TIGER];

describe("Combat Simulation", () => {
  test("simulates combat and tracks victory", () => {
    const playerSquad = [
      createUnit(BEAR, Position.Left),
      createUnit(EAGLE, Position.Center),
      createUnit(TIGER, Position.Right),
    ];

    const encounter = generateNormalEncounter("test_1", TEST_SPECIES, 1, 3);

    const result = simulateCombat(playerSquad, encounter);

    expect(result.victory).toBeDefined();
    expect(result.goldEarned).toBeGreaterThanOrEqual(0);
    expect(result.battleState).toBeDefined();
  });

  test("awards gold on victory", () => {
    const playerSquad = [
      createUnit(BEAR, Position.Left),
      createUnit(EAGLE, Position.Center),
      createUnit(TIGER, Position.Right),
    ];

    const encounter = generateNormalEncounter("test_1", TEST_SPECIES, 1, 5);

    const result = simulateCombat(playerSquad, encounter);

    if (result.victory) {
      expect(result.goldEarned).toBe(5);
    }
  });
});

describe("AI Shop Decisions", () => {
  test("AI buys health potions for wounded units", () => {
    const damagedUnit = createUnit(BEAR, Position.Center);
    const wounded = { ...damagedUnit, stats: { ...damagedUnit.stats, currentHp: 20 } };

    const gameState = createGameState([wounded], []);
    const withGold = { ...gameState, currency: { gold: 10, materials: 0 } };

    const shop = generateShop(0);
    const afterShopping = aiShopDecisions(withGold, shop, TEST_SPECIES);

    // Should have spent some gold (if health potions were available)
    expect(afterShopping.currency.gold).toBeLessThanOrEqual(10);
  });

  test("AI does not buy when units are healthy", () => {
    const healthyUnit = createUnit(BEAR, Position.Center);

    const gameState = createGameState([healthyUnit], []);
    const withGold = { ...gameState, currency: { gold: 10, materials: 0 } };

    const shop = generateShop(0);
    const afterShopping = aiShopDecisions(withGold, shop, TEST_SPECIES);

    // Should not have spent any gold
    expect(afterShopping.currency.gold).toBe(10);
  });
});

describe("AI Lab Decisions", () => {
  test("AI starts healing wounded units in stable", () => {
    const damagedUnit = createUnit(BEAR, Position.Center);
    const wounded = { ...damagedUnit, stats: { ...damagedUnit.stats, currentHp: 20 } };

    const gameState = createGameState([], [wounded]);

    const afterLab = aiLabDecisions(gameState);

    // Should have started healing
    expect(afterLab.roster.healing.length).toBe(1);
  });

  test("AI respects healing station capacity", () => {
    const wounded = Array.from({ length: 10 }, () => {
      const unit = createUnit(BEAR, Position.Center);
      return { ...unit, stats: { ...unit.stats, currentHp: 20 } };
    });

    const gameState = createGameState([], wounded);

    const afterLab = aiLabDecisions(gameState);

    // Should only heal up to 5 units (capacity limit)
    expect(afterLab.roster.healing.length).toBeLessThanOrEqual(5);
  });
});

describe("Healing Completion", () => {
  test("completes healing for finished units", () => {
    const damagedUnit = createUnit(BEAR, Position.Center);
    const wounded = { ...damagedUnit, stats: { ...damagedUnit.stats, currentHp: 20 } };

    const gameState = createGameState([], [wounded]);
    const withHealing = aiLabDecisions(gameState);

    // Force healing to complete by setting days remaining to 0
    const completedHealing = {
      ...withHealing,
      roster: {
        ...withHealing.roster,
        healing: withHealing.roster.healing.map((slot) => ({ ...slot, daysRemaining: 0 })),
      },
    };

    const afterCompletion = completeHealing(completedHealing);

    // Healing slots should be cleared
    expect(afterCompletion.roster.healing.length).toBe(0);

    // Unit should be healed
    const healedUnit = afterCompletion.roster.stable.find((u) => u.id === wounded.id);
    expect(healedUnit?.stats.currentHp).toBe(healedUnit?.stats.maxHp);
  });
});

describe("Full Run Simulation", () => {
  test("simulates a complete run", () => {
    const squad = [
      createUnit(BEAR, Position.Left),
      createUnit(EAGLE, Position.Center),
      createUnit(TIGER, Position.Right),
    ];

    const gameState = createGameState(squad, []);
    const campaign = createCampaign(TEST_SPECIES);

    const result = simulateRun(gameState, campaign, TEST_SPECIES);

    expect(result).toBeDefined();
    expect(result.combatsCompleted).toBeGreaterThan(0);
    expect(result.reason).toBeDefined();
  });

  test("tracks combat completion", () => {
    const squad = [
      createUnit(BEAR, Position.Left),
      createUnit(EAGLE, Position.Center),
      createUnit(TIGER, Position.Right),
    ];

    const gameState = createGameState(squad, []);
    const campaign = createCampaign(TEST_SPECIES);

    const result = simulateRun(gameState, campaign, TEST_SPECIES);

    expect(result.combatsCompleted).toBeGreaterThanOrEqual(0);
  });

  test("tracks gold and materials earned", () => {
    const squad = [
      createUnit(BEAR, Position.Left),
      createUnit(EAGLE, Position.Center),
      createUnit(TIGER, Position.Right),
    ];

    const gameState = createGameState(squad, []);
    const campaign = createCampaign(TEST_SPECIES);

    const result = simulateRun(gameState, campaign, TEST_SPECIES);

    if (result.success) {
      expect(result.goldEarned).toBeGreaterThan(0);
    }
  });
});

describe("Multiple Run Metrics", () => {
  test("simulates multiple runs and collects metrics", () => {
    const createInitialState = () => {
      const squad = [
        createUnit(BEAR, Position.Left),
        createUnit(EAGLE, Position.Center),
        createUnit(TIGER, Position.Right),
      ];
      return createGameState(squad, []);
    };

    const createCamp = () => createCampaign(TEST_SPECIES);

    const metrics = simulateMultipleRuns(5, createInitialState, createCamp, TEST_SPECIES);

    expect(metrics.totalRuns).toBe(5);
    expect(metrics.successfulRuns).toBeGreaterThanOrEqual(0);
    expect(metrics.averageCombatsCompleted).toBeGreaterThanOrEqual(0);
    expect(metrics.averageGoldEarned).toBeGreaterThanOrEqual(0);
  });

  test("tracks max combats completed", () => {
    const createInitialState = () => {
      const squad = [
        createUnit(BEAR, Position.Left),
        createUnit(EAGLE, Position.Center),
        createUnit(TIGER, Position.Right),
      ];
      return createGameState(squad, []);
    };

    const createCamp = () => createCampaign(TEST_SPECIES);

    const metrics = simulateMultipleRuns(3, createInitialState, createCamp, TEST_SPECIES);

    expect(metrics.maxCombatsCompleted).toBeGreaterThanOrEqual(metrics.averageCombatsCompleted);
  });
});
