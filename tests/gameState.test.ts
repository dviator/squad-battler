import { describe, expect, test } from "vitest";
import {
  addGold,
  addMaterials,
  addScrapTech,
  advanceTime,
  advanceTimeAfterCombat,
  COMBATS_PER_DAY,
  completeWorld,
  createGameState,
  getLivingUnits,
  spendCurrency,
  spendScrapTech,
  unlockScanner,
  unlockSpecies,
  unlockStation,
  upgradeScanner,
} from "../src/core/gameState";
import { startBreeding, startHealing } from "../src/core/lab";
import { LifeStage, Position } from "../src/core/types";
import { createUnit } from "../src/core/unit";
import { BEAR, EAGLE, TIGER } from "../src/data/species";

describe("Game State", () => {
  test("creates initial game state", () => {
    const squad = [
      createUnit(BEAR, Position.Left),
      createUnit(EAGLE, Position.Center),
      createUnit(TIGER, Position.Right),
    ];
    const stable = [createUnit(BEAR, Position.Left), createUnit(EAGLE, Position.Center)];

    const state = createGameState(squad, stable);

    expect(state.roster.squad.length).toBe(3);
    expect(state.roster.stable.length).toBe(2);
    expect(state.currency.gold).toBe(0);
    expect(state.currency.materials).toBe(0);
    expect(state.timeElapsed).toBe(0);
    expect(state.unlockedSpecies).toContain("bear");
    expect(state.unlockedSpecies).toContain("eagle");
    expect(state.unlockedSpecies).toContain("tiger");
    expect(state.unlockedStations).toContain("healing");
    expect(state.unlockedStations).toContain("recruiting");
  });

  test("advances time and ages units", () => {
    const squad = [createUnit(BEAR, Position.Center)];
    const state = createGameState(squad, []);

    const advanced = advanceTime(state, 1);

    expect(advanced.timeElapsed).toBe(1);
    expect(advanced.roster.squad[0]!.age).toBe(1);
  });

  test("advances time after combat (1 hour)", () => {
    const squad = [createUnit(BEAR, Position.Center)];
    const state = createGameState(squad, []);

    const afterCombat = advanceTimeAfterCombat(state);

    expect(afterCombat.timeElapsed).toBeCloseTo(1 / 24, 5);
  });

  test("24 combats = 1 day of aging", () => {
    const squad = [createUnit(BEAR, Position.Center)];
    let state = createGameState(squad, []);

    for (let i = 0; i < COMBATS_PER_DAY; i++) {
      state = advanceTimeAfterCombat(state);
    }

    expect(state.timeElapsed).toBeCloseTo(1, 1);
    expect(state.roster.squad[0]!.age).toBeCloseTo(1, 1);
  });

  test("aging progresses life stages", () => {
    const squad = [createUnit(BEAR, Position.Center)];
    const state = createGameState(squad, []);

    const youngState = advanceTime(state, 6);
    expect(youngState.roster.squad[0]!.lifeStage).toBe(LifeStage.Young);

    const adultState = advanceTime(state, 10);
    expect(adultState.roster.squad[0]!.lifeStage).toBe(LifeStage.Adult);

    const elderlyState = advanceTime(state, 22);
    expect(elderlyState.roster.squad[0]!.lifeStage).toBe(LifeStage.Elderly);

    const deadState = advanceTime(state, 31);
    expect(deadState.roster.squad[0]!.lifeStage).toBe(LifeStage.Dead);
  });

  test("advances healing slots over time", () => {
    const unit = createUnit(BEAR, Position.Center);
    const damaged = { ...unit, stats: { ...unit.stats, currentHp: 50 } };
    const healingSlot = startHealing(damaged, 100);

    const state = createGameState([damaged], []);
    const withHealing = {
      ...state,
      roster: {
        ...state.roster,
        healing: [healingSlot],
      },
    };

    const advanced = advanceTime(withHealing, 0.5);

    expect(advanced.roster.healing[0]!.daysRemaining).toBeLessThan(healingSlot.daysRemaining);
  });

  test("advances breeding slots over time", () => {
    const parent1 = createUnit(BEAR, Position.Left);
    const parent2 = createUnit(BEAR, Position.Right);
    const breedingSlot = startBreeding(parent1, parent2, 3);

    const state = createGameState([parent1, parent2], []);
    const withBreeding = {
      ...state,
      roster: {
        ...state.roster,
        breeding: [breedingSlot],
      },
    };

    const advanced = advanceTime(withBreeding, 1);

    expect(advanced.roster.breeding[0]!.daysRemaining).toBe(2);
  });
});

describe("Scrap Tech", () => {
  test("initializes to 0", () => {
    const state = createGameState([], []);
    expect(state.scrapTech).toBe(0);
  });

  test("adds scrap tech", () => {
    const state = createGameState([], []);
    const updated = addScrapTech(state, 10);
    expect(updated.scrapTech).toBe(10);
  });

  test("spends scrap tech successfully", () => {
    const state = addScrapTech(createGameState([], []), 15);
    const result = spendScrapTech(state, 5);
    expect(result.success).toBe(true);
    expect(result.newState.scrapTech).toBe(10);
  });

  test("cannot spend more scrap tech than available", () => {
    const state = createGameState([], []);
    const result = spendScrapTech(state, 5);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Not enough scrap tech");
  });
});

describe("Genetic Scanner", () => {
  test("starts locked (capacity 0)", () => {
    const state = createGameState([], []);
    expect(state.scannerCapacity).toBe(0);
  });

  test("unlockScanner sets capacity to 1", () => {
    const state = createGameState([], []);
    const unlocked = unlockScanner(state);
    expect(unlocked.scannerCapacity).toBe(1);
  });

  test("unlockScanner is idempotent if already unlocked", () => {
    const state = unlockScanner(createGameState([], []));
    const again = unlockScanner(state);
    expect(again.scannerCapacity).toBe(1);
  });

  test("upgradeScanner increments capacity and spends scrap tech", () => {
    const state = addScrapTech(unlockScanner(createGameState([], [])), 50);
    const result = upgradeScanner(state);
    expect(result.success).toBe(true);
    expect(result.newState.scannerCapacity).toBe(2);
    expect(result.newState.scrapTech).toBe(50 - 15); // first upgrade costs 15
  });

  test("upgradeScanner fails if not enough scrap tech", () => {
    const state = unlockScanner(createGameState([], []));
    const result = upgradeScanner(state);
    expect(result.success).toBe(false);
  });

  test("upgradeScanner fails at max capacity", () => {
    let state = addScrapTech(unlockScanner(createGameState([], [])), 9999);
    // Upgrade to max
    for (let i = 1; i < 8; i++) {
      const result = upgradeScanner(state);
      expect(result.success).toBe(true);
      state = result.newState;
    }
    expect(state.scannerCapacity).toBe(8);
    const result = upgradeScanner(state);
    expect(result.success).toBe(false);
  });
});

describe("Currency Management", () => {
  test("adds gold", () => {
    const state = createGameState([], []);

    const withGold = addGold(state, 10);

    expect(withGold.currency.gold).toBe(10);
  });

  test("adds materials", () => {
    const state = createGameState([], []);

    const withMaterials = addMaterials(state, 5);

    expect(withMaterials.currency.materials).toBe(5);
  });

  test("spends currency successfully", () => {
    const state = createGameState([], []);
    const withCurrency = addGold(addMaterials(state, 10), 20);

    const result = spendCurrency(withCurrency, 5, 3);

    expect(result.success).toBe(true);
    expect(result.newState.currency.gold).toBe(15);
    expect(result.newState.currency.materials).toBe(7);
  });

  test("cannot spend more than available", () => {
    const state = createGameState([], []);

    const result = spendCurrency(state, 10, 0);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Not enough gold");
  });
});

describe("Unlocks", () => {
  test("unlocks new species", () => {
    const state = createGameState([], []);

    const unlocked = unlockSpecies(state, "wolf");

    expect(unlocked.unlockedSpecies).toContain("wolf");
  });

  test("does not duplicate species unlock", () => {
    const state = createGameState([], []);

    const unlocked1 = unlockSpecies(state, "wolf");
    const unlocked2 = unlockSpecies(unlocked1, "wolf");

    const wolfCount = unlocked2.unlockedSpecies.filter((s) => s === "wolf").length;
    expect(wolfCount).toBe(1);
  });

  test("unlocks new station", () => {
    const state = createGameState([], []);

    const unlocked = unlockStation(state, "gene_editing");

    expect(unlocked.unlockedStations).toContain("gene_editing");
  });

  test("tracks completed worlds", () => {
    const state = createGameState([], []);

    const completed = completeWorld(state);

    expect(completed.completedWorlds).toBe(1);
  });
});

describe("Unit Queries", () => {
  test("gets all living units", () => {
    const squad = [
      createUnit(BEAR, Position.Left),
      createUnit(EAGLE, Position.Center),
      createUnit(TIGER, Position.Right),
    ];
    const stable = [createUnit(BEAR, Position.Left)];

    const state = createGameState(squad, stable);

    const living = getLivingUnits(state);

    expect(living.length).toBe(4);
  });

  test("excludes dead units from living units", () => {
    const squad = [createUnit(BEAR, Position.Left)];
    const state = createGameState(squad, []);

    // Age to death
    const deadState = advanceTime(state, 31);

    const living = getLivingUnits(deadState);

    expect(living.length).toBe(0);
  });
});
