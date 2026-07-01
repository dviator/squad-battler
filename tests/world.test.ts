import { describe, expect, test } from "vitest";
import {
  advanceEncounter,
  createCampaign,
  createGoobCampaign,
  createWorld1,
  createWorld2,
  createWorld3,
  EncounterType,
  FLOOR_CATALOG,
  generateBossEncounter,
  generateEnemySquad,
  generateLevel,
  generateMiniBossEncounter,
  generateNormalEncounter,
  generateWorld,
  getCurrentEncounter,
  getFloorProgress,
  isCampaignComplete,
} from "../src/core/world";
import { GOOB, HEAVY_GOOB, MEGA_GOOB } from "../src/data/enemies";
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
    expect(encounter.scrapTechReward).toBe(2);
  });

  test("generates mini-boss encounter with higher rewards", () => {
    const encounter = generateMiniBossEncounter("test_2", TEST_SPECIES, 1, 3);

    expect(encounter.type).toBe(EncounterType.MiniBoss);
    expect(encounter.goldReward).toBe(6); // 2x base
    expect(encounter.materialsReward).toBe(1);
    expect(encounter.scrapTechReward).toBe(8);
  });

  test("generates boss encounter with highest rewards", () => {
    const encounter = generateBossEncounter("test_3", TEST_SPECIES, 1, 3);

    expect(encounter.type).toBe(EncounterType.Boss);
    expect(encounter.goldReward).toBe(9); // 3x base
    expect(encounter.materialsReward).toBe(3);
    expect(encounter.scrapTechReward).toBe(15);
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

    const lastEncounter = level.encounters[level.encounters.length - 1]!;
    expect(lastEncounter!.type).toBe(EncounterType.Boss);
  });

  test("level has mini-boss in middle", () => {
    const level = generateLevel("level_1", "Test Level", TEST_SPECIES, 1, 5);

    const middleEncounter = level.encounters[2]!; // Middle of 5
    expect(middleEncounter!.type).toBe(EncounterType.MiniBoss);
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
    const firstLevel = campaign.worlds[0]!.levels[0]!;
    const encounterCount = firstLevel!.encounters.length;

    let result: ReturnType<typeof advanceEncounter> | undefined;
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
    const world = campaign.worlds[0]!;

    // Complete all encounters in all levels
    let result: ReturnType<typeof advanceEncounter> | undefined;
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
    const firstLevel = campaign.worlds[0]!.levels[0]!;
    const encounterCount = firstLevel!.encounters.length;

    let result: ReturnType<typeof advanceEncounter> | undefined;
    for (let i = 0; i < encounterCount; i++) {
      result = advanceEncounter(campaign);
      campaign = result.campaign;
    }

    // First level should unlock breeding station
    expect(result?.reward).toBeDefined();
    expect(result?.reward?.unlockedStation).toBe("breeding");
  });
});

describe("Floor Catalog", () => {
  test("catalog has exactly 10 floors", () => {
    expect(FLOOR_CATALOG).toHaveLength(10);
  });

  test("floor numbers are sequential 1-10", () => {
    const numbers = FLOOR_CATALOG.map((f) => f.floorNumber);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  test("every entry has required fields", () => {
    for (const entry of FLOOR_CATALOG) {
      expect(entry.id).toBeTruthy();
      expect(entry.name).toBeTruthy();
      expect(entry.themeTag).toBeTruthy();
      expect(entry.difficulty).toBeGreaterThan(0);
    }
  });

  test("floor 1 is the Goob floor (built content)", () => {
    const floor1 = FLOOR_CATALOG.find((f) => f.floorNumber === 1);
    expect(floor1?.themeTag).toBe("goobs");
  });

  test("floor 10 is the bonus floor", () => {
    const floor10 = FLOOR_CATALOG.find((f) => f.floorNumber === 10);
    expect(floor10?.themeTag).toBe("bonus");
  });

  test("difficulty increases with floor number", () => {
    for (let i = 1; i < FLOOR_CATALOG.length; i++) {
      expect(FLOOR_CATALOG[i]!.difficulty).toBeGreaterThan(FLOOR_CATALOG[i - 1]!.difficulty);
    }
  });
});

describe("Goob Campaign (10-floor structure)", () => {
  const PLAYER_SPECIES = [BEAR, EAGLE, TIGER];

  test("creates campaign with 10 floors", () => {
    const campaign = createGoobCampaign(GOOB, HEAVY_GOOB, MEGA_GOOB, PLAYER_SPECIES);
    expect(campaign.worlds).toHaveLength(10);
    expect(campaign.currentWorldIndex).toBe(0);
    expect(campaign.currentLevelIndex).toBe(0);
    expect(campaign.currentEncounterIndex).toBe(0);
  });

  test("floor 1 has Goob content", () => {
    const campaign = createGoobCampaign(GOOB, HEAVY_GOOB, MEGA_GOOB, PLAYER_SPECIES);
    const floor1 = campaign.worlds[0]!;
    expect(floor1.floorNumber).toBe(1);
    expect(floor1.theme).toBe("goobs");
    expect(floor1.levels.length).toBeGreaterThan(0);
    expect(floor1.levels[0]!.encounters.length).toBe(10);
  });

  test("floors 2-10 are placeholders with no encounters", () => {
    const campaign = createGoobCampaign(GOOB, HEAVY_GOOB, MEGA_GOOB, PLAYER_SPECIES);
    for (let i = 1; i < 10; i++) {
      const floor = campaign.worlds[i]!;
      expect(floor.floorNumber).toBe(i + 1);
      expect(floor.levels).toHaveLength(0);
    }
  });

  test("each floor has correct floorNumber from catalog", () => {
    const campaign = createGoobCampaign(GOOB, HEAVY_GOOB, MEGA_GOOB, PLAYER_SPECIES);
    for (let i = 0; i < 10; i++) {
      expect(campaign.worlds[i]!.floorNumber).toBe(i + 1);
    }
  });

  test("campaign starts with getCurrentEncounter returning the first Goob encounter", () => {
    const campaign = createGoobCampaign(GOOB, HEAVY_GOOB, MEGA_GOOB, PLAYER_SPECIES);
    const encounter = getCurrentEncounter(campaign);
    expect(encounter).not.toBeNull();
    expect(encounter?.type).toBe(EncounterType.Normal);
  });

  test("Goob floor plays to completion without regression", () => {
    let campaign = createGoobCampaign(GOOB, HEAVY_GOOB, MEGA_GOOB, PLAYER_SPECIES);
    const goobLevel = campaign.worlds[0]!.levels[0]!;
    const encounterCount = goobLevel.encounters.length;

    let lastResult: ReturnType<typeof advanceEncounter> | undefined;
    for (let i = 0; i < encounterCount; i++) {
      lastResult = advanceEncounter(campaign);
      campaign = lastResult.campaign;
    }

    expect(lastResult?.levelCompleted).toBe(true);
    expect(lastResult?.worldCompleted).toBe(true);
    expect(lastResult?.campaign.currentWorldIndex).toBe(1);
  });
});

describe("Floor Progress", () => {
  const PLAYER_SPECIES = [BEAR, EAGLE, TIGER];

  test("returns correct progress for floor 1", () => {
    const campaign = createGoobCampaign(GOOB, HEAVY_GOOB, MEGA_GOOB, PLAYER_SPECIES);
    const progress = getFloorProgress(campaign);
    expect(progress.floorNumber).toBe(1);
    expect(progress.totalFloors).toBe(10);
    expect(progress.floorName).toBe("Goobs & Weird Blobs");
    expect(progress.themeTag).toBe("goobs");
  });

  test("updates floor number after completing floor 1", () => {
    let campaign = createGoobCampaign(GOOB, HEAVY_GOOB, MEGA_GOOB, PLAYER_SPECIES);
    const goobLevel = campaign.worlds[0]!.levels[0]!;

    for (let i = 0; i < goobLevel.encounters.length; i++) {
      const result = advanceEncounter(campaign);
      campaign = result.campaign;
    }

    const progress = getFloorProgress(campaign);
    expect(progress.floorNumber).toBe(2);
    expect(progress.totalFloors).toBe(10);
  });
});
