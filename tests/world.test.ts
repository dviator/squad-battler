import { describe, expect, test } from "vitest";
import {
  advanceEncounter,
  createCampaign,
  createWorld1,
  createWorld2,
  createWorld3,
  EncounterType,
  generateBossEncounter,
  generateEnemySquad,
  generateLevel,
  generateMiniBossEncounter,
  generateNormalEncounter,
  generateWorld,
  getCurrentEncounter,
  isCampaignComplete,
} from "../src/core/world";
import { BEAR, EAGLE, TIGER } from "../src/data/species";

const TEST_SPECIES = [BEAR, EAGLE, TIGER];

describe("Enemy Generation", () => {
  test("generates enemy squad with correct size", () => {
    const enemies = generateEnemySquad(TEST_SPECIES, 1, false);

    expect(enemies.length).toBeGreaterThan(0);
    expect(enemies.length).toBeLessThanOrEqual(3);
  });

  test("boss encounters have full squad of 3", () => {
    const enemies = generateEnemySquad(TEST_SPECIES, 1, true);

    expect(enemies.length).toBe(3);
  });

  test("higher difficulty creates stronger enemies", () => {
    const lowDiff = generateEnemySquad(TEST_SPECIES, 1, false);
    const highDiff = generateEnemySquad(TEST_SPECIES, 5, false);

    // Higher difficulty should have more units or stronger stats
    expect(highDiff.length).toBeGreaterThanOrEqual(lowDiff.length);
  });

  test("boss enemies are stronger than normal enemies", () => {
    // Generate multiple squads and average to reduce randomness from genetic potential
    let totalBossHp = 0;
    let totalNormalHp = 0;
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
      const normal = generateEnemySquad(TEST_SPECIES, 1, false);
      const boss = generateEnemySquad(TEST_SPECIES, 1, true);

      totalNormalHp += normal.reduce((sum, u) => sum + u.stats.maxHp, 0) / normal.length;
      totalBossHp += boss.reduce((sum, u) => sum + u.stats.maxHp, 0) / boss.length;
    }

    const avgBossHp = totalBossHp / iterations;
    const avgNormalHp = totalNormalHp / iterations;

    expect(avgBossHp).toBeGreaterThan(avgNormalHp);
  });
});

describe("Encounter Generation", () => {
  test("generates normal encounter", () => {
    const encounter = generateNormalEncounter("test_1", TEST_SPECIES, 1, 3);

    expect(encounter.id).toBe("test_1");
    expect(encounter.type).toBe(EncounterType.Normal);
    expect(encounter.enemies.length).toBeGreaterThan(0);
    expect(encounter.goldReward).toBe(3);
    expect(encounter.materialsReward).toBe(0);
  });

  test("generates mini-boss encounter with higher rewards", () => {
    const encounter = generateMiniBossEncounter("test_2", TEST_SPECIES, 1, 3);

    expect(encounter.type).toBe(EncounterType.MiniBoss);
    expect(encounter.goldReward).toBe(6); // 2x base
    expect(encounter.materialsReward).toBe(1);
  });

  test("generates boss encounter with highest rewards", () => {
    const encounter = generateBossEncounter("test_3", TEST_SPECIES, 1, 3);

    expect(encounter.type).toBe(EncounterType.Boss);
    expect(encounter.goldReward).toBe(9); // 3x base
    expect(encounter.materialsReward).toBe(3);
  });
});

describe("Level Generation", () => {
  test("generates level with specified encounter count", () => {
    const level = generateLevel("level_1", "Test Level", TEST_SPECIES, 1, 5);

    expect(level.id).toBe("level_1");
    expect(level.name).toBe("Test Level");
    expect(level.encounters.length).toBe(5);
  });

  test("level has boss as final encounter", () => {
    const level = generateLevel("level_1", "Test Level", TEST_SPECIES, 1, 5);

    const lastEncounter = level.encounters[level.encounters.length - 1];
    expect(lastEncounter.type).toBe(EncounterType.Boss);
  });

  test("level has mini-boss in middle", () => {
    const level = generateLevel("level_1", "Test Level", TEST_SPECIES, 1, 5);

    const middleEncounter = level.encounters[2]; // Middle of 5
    expect(middleEncounter.type).toBe(EncounterType.MiniBoss);
  });

  test("level can have completion reward", () => {
    const reward = {
      materials: 10,
      unlockedStation: "breeding",
    };

    const level = generateLevel("level_1", "Test Level", TEST_SPECIES, 1, 5, reward);

    expect(level.completionReward).toEqual(reward);
  });
});

describe("World Generation", () => {
  test("generates world with specified levels", () => {
    const world = generateWorld("world_1", "Test World", "A test world", TEST_SPECIES, 1, 2);

    expect(world.id).toBe("world_1");
    expect(world.name).toBe("Test World");
    expect(world.description).toBe("A test world");
    expect(world.levels.length).toBe(2);
    expect(world.difficulty).toBe(1);
  });

  test("world levels have increasing difficulty", () => {
    const world = generateWorld("world_1", "Test World", "Test", TEST_SPECIES, 1, 3);

    // Each level should be progressively harder
    expect(world.levels.length).toBe(3);
  });
});

describe("Predefined Worlds", () => {
  test("creates world 1 (Basement Levels)", () => {
    const world = createWorld1(TEST_SPECIES);

    expect(world.id).toBe("world_1");
    expect(world.name).toBe("Basement Levels");
    expect(world.difficulty).toBe(1);
    expect(world.levels.length).toBe(2);
  });

  test("creates world 2 (Research Labs)", () => {
    const world = createWorld2(TEST_SPECIES);

    expect(world.id).toBe("world_2");
    expect(world.difficulty).toBe(3);
    expect(world.levels.length).toBe(2);
  });

  test("creates world 3 (Executive Offices)", () => {
    const world = createWorld3(TEST_SPECIES);

    expect(world.id).toBe("world_3");
    expect(world.difficulty).toBe(5);
    expect(world.levels.length).toBe(2);
  });
});

describe("Campaign", () => {
  test("creates campaign with 3 worlds", () => {
    const campaign = createCampaign(TEST_SPECIES);

    expect(campaign.worlds.length).toBe(3);
    expect(campaign.currentWorldIndex).toBe(0);
    expect(campaign.currentLevelIndex).toBe(0);
    expect(campaign.currentEncounterIndex).toBe(0);
  });

  test("gets current encounter", () => {
    const campaign = createCampaign(TEST_SPECIES);
    const encounter = getCurrentEncounter(campaign);

    expect(encounter).not.toBeNull();
    expect(encounter?.enemies.length).toBeGreaterThan(0);
  });

  test("advances to next encounter", () => {
    const campaign = createCampaign(TEST_SPECIES);

    const result = advanceEncounter(campaign);

    expect(result.campaign.currentEncounterIndex).toBe(1);
    expect(result.levelCompleted).toBe(false);
    expect(result.worldCompleted).toBe(false);
  });

  test("completes level after all encounters", () => {
    let campaign = createCampaign(TEST_SPECIES);
    const firstLevel = campaign.worlds[0].levels[0];
    const encounterCount = firstLevel.encounters.length;

    let result;
    for (let i = 0; i < encounterCount; i++) {
      result = advanceEncounter(campaign);
      campaign = result.campaign;
    }

    expect(result?.levelCompleted).toBe(true);
    expect(result?.worldCompleted).toBe(false);
    expect(result?.campaign.currentLevelIndex).toBe(1);
    expect(result?.campaign.currentEncounterIndex).toBe(0);
  });

  test("completes world after all levels", () => {
    let campaign = createCampaign(TEST_SPECIES);
    const world = campaign.worlds[0];

    // Complete all encounters in all levels
    let result;
    for (const level of world.levels) {
      for (let i = 0; i < level.encounters.length; i++) {
        result = advanceEncounter(campaign);
        campaign = result.campaign;
      }
    }

    expect(result?.worldCompleted).toBe(true);
    expect(result?.campaign.currentWorldIndex).toBe(1);
    expect(result?.campaign.currentLevelIndex).toBe(0);
    expect(result?.campaign.currentEncounterIndex).toBe(0);
  });

  test("campaign completes after all worlds", () => {
    let campaign = createCampaign(TEST_SPECIES);

    expect(isCampaignComplete(campaign)).toBe(false);

    // Complete all worlds
    for (const world of campaign.worlds) {
      for (const level of world.levels) {
        for (let i = 0; i < level.encounters.length; i++) {
          const result = advanceEncounter(campaign);
          campaign = result.campaign;
        }
      }
    }

    expect(isCampaignComplete(campaign)).toBe(true);
  });

  test("awards level completion reward", () => {
    let campaign = createCampaign(TEST_SPECIES);
    const firstLevel = campaign.worlds[0].levels[0];
    const encounterCount = firstLevel.encounters.length;

    let result;
    for (let i = 0; i < encounterCount; i++) {
      result = advanceEncounter(campaign);
      campaign = result.campaign;
    }

    // First level should unlock breeding station
    expect(result?.reward).toBeDefined();
    expect(result?.reward?.unlockedStation).toBe("breeding");
  });
});
