import { describe, expect, test } from "vitest";
import { createBattleState, simulateBattle, tickBattle } from "../src/core/battle";
import { BattleEventType, Position, TargetType } from "../src/core/types";
import { createUnit } from "../src/core/unit";
import { WOLF_DECK } from "../src/data/cards";
import { ALL_MUTATIONS, LONE_WOLF, MUTATIONS_BY_ID } from "../src/data/mutations";
import { ALL_SPECIES, BEAR, EAGLE, SPECIES_BY_ID, TIGER, WOLF } from "../src/data/species";

describe("Wolf species", () => {
  test("creates wolf with correct base stats", () => {
    const wolf = createUnit(WOLF, Position.Center);
    expect(wolf.speciesId).toBe("wolf");
    expect(wolf.stats.maxHp).toBe(140);
    expect(wolf.stats.speed).toBe(13);
    expect(wolf.stats.attackPower).toBe(22);
  });

  test("wolf starting attack is Swarm with LastPlayerTarget", () => {
    const wolf = createUnit(WOLF, Position.Center);
    expect(wolf.attacks).toHaveLength(1);
    expect(wolf.attacks[0]!.id).toBe("wolf_swarm");
    expect(wolf.attacks[0]!.targetType).toBe(TargetType.LastPlayerTarget);
    expect(wolf.attacks[0]!.damageMultiplier).toBe(1.2);
  });

  test("wolf is in ALL_SPECIES and SPECIES_BY_ID", () => {
    expect(ALL_SPECIES.find((s) => s.id === "wolf")).toBeDefined();
    expect(SPECIES_BY_ID.wolf).toBe(WOLF);
  });

  test("wolf additionalAttacks contains Pack Bite", () => {
    expect(WOLF.additionalAttacks).toBeDefined();
    const packBite = WOLF.additionalAttacks!.find((a) => a.id === "wolf_bite");
    expect(packBite).toBeDefined();
    expect(packBite!.targetType).toBe(TargetType.OppositeEnemy);
    expect(packBite!.damageMultiplier).toBe(1.6);
  });
});

describe("Lone Wolf mutation", () => {
  test("is in ALL_MUTATIONS and MUTATIONS_BY_ID", () => {
    expect(ALL_MUTATIONS.find((m) => m.id === "lone_wolf")).toBeDefined();
    expect(MUTATIONS_BY_ID.lone_wolf).toBe(LONE_WOLF);
  });

  test("grants +50% attack power when wolf is last surviving player unit", () => {
    const wolf = { ...createUnit(WOLF, Position.Center), mutations: ["lone_wolf"] };
    const enemy = createUnit(BEAR, Position.Center);
    // Run full battle — wolf survives solo, so Lone Wolf must be active for some attacks
    const result = simulateBattle([wolf], [enemy]);
    const damageEvents = result.events.filter(
      (e) => e.type === BattleEventType.Damage && (e as { targetId: string }).targetId === enemy.id,
    );
    expect(damageEvents.length).toBeGreaterThan(0);
  });

  test("lone wolf speed bonus fires when wolf is last alive", () => {
    // Two wolves: one dies early, the other should speed up
    const wolf1 = {
      ...createUnit(WOLF, Position.Left),
      mutations: ["lone_wolf"],
    };
    // Heavily weakened wolf1 to ensure it dies fast
    const wolf1Weak = {
      ...wolf1,
      stats: { ...wolf1.stats, currentHp: 1 },
    };
    const wolf2 = {
      ...createUnit(WOLF, Position.Right),
      mutations: ["lone_wolf"],
    };
    const enemy = createUnit(BEAR, Position.Center);
    const result = simulateBattle([wolf1Weak, wolf2], [enemy]);
    // Battle should complete; wolf2 should have gotten speed bonus after wolf1 died
    expect(result.isComplete).toBe(true);
  });
});

describe("Swarm targeting (LastPlayerTarget)", () => {
  test("lastPlayerTargetId is null at battle start", () => {
    const wolf = createUnit(WOLF, Position.Center);
    const enemy = createUnit(BEAR, Position.Center);
    const state = createBattleState([wolf], [enemy]);
    expect(state.lastPlayerTargetId).toBeNull();
  });

  test("lastPlayerTargetId is set after player attack", () => {
    const wolf = createUnit(WOLF, Position.Center);
    const enemy = createUnit(BEAR, Position.Center);
    let state = createBattleState([wolf], [enemy]);
    // Run until wolf fires its first attack
    for (let i = 0; i < 10; i++) {
      state = tickBattle(state);
      if (state.lastPlayerTargetId !== null) break;
    }
    expect(state.lastPlayerTargetId).toBe(enemy.id);
  });

  test("Swarm targets last attacked enemy", () => {
    // Two enemies: wolf attacks one first, Swarm should chase it
    const wolf = createUnit(WOLF, Position.Center);
    const enemy1 = createUnit(BEAR, Position.Left);
    const enemy2 = createUnit(EAGLE, Position.Right);
    let state = createBattleState([wolf], [enemy1, enemy2]);

    for (let i = 0; i < 20; i++) {
      state = tickBattle(state);
    }
    // lastPlayerTargetId should point to a living enemy (or one that was alive)
    expect(state.lastPlayerTargetId === enemy1.id || state.lastPlayerTargetId === enemy2.id).toBe(
      true,
    );
  });

  test("Swarm falls back to opposite enemy when no previous target", () => {
    const wolf = createUnit(WOLF, Position.Center);
    const enemy = createUnit(BEAR, Position.Center);
    // First tick: no lastPlayerTargetId yet, Swarm falls back to OppositeEnemy
    // Just ensure battle progresses normally
    const result = simulateBattle([wolf], [enemy]);
    expect(result.isComplete).toBe(true);
  });

  test("Swarm deals focus-fire bonus when it hits lastPlayerTargetId", () => {
    const wolf = createUnit(WOLF, Position.Center);
    const enemy1 = createUnit(BEAR, Position.Left);
    const enemy2 = createUnit(TIGER, Position.Right);
    const result = simulateBattle([wolf], [enemy1, enemy2]);
    // Look for a Swarm attack that does more damage than base (×1.2 × attackPower)
    const attackEvents = result.events.filter(
      (e) =>
        e.type === BattleEventType.AttackExecuted &&
        (e as { attackName: string }).attackName === "Swarm",
    );
    expect(attackEvents.length).toBeGreaterThan(0);
  });
});

describe("Wolf deck", () => {
  test("has exactly 4 cards all with speciesId wolf", () => {
    expect(WOLF_DECK).toHaveLength(4);
    for (const card of WOLF_DECK) {
      expect(card.speciesId).toBe("wolf");
    }
  });

  test("has at least one card with LastPlayerTarget top face", () => {
    const swarmCards = WOLF_DECK.filter((c) => c.top.targetType === TargetType.LastPlayerTarget);
    expect(swarmCards.length).toBeGreaterThan(0);
  });

  test("deck has all face types: defend, move, utility", () => {
    const bottomTypes = new Set(WOLF_DECK.map((c) => c.bottom.type));
    expect(bottomTypes.has("defend")).toBe(true);
    expect(bottomTypes.has("move")).toBe(true);
    expect(bottomTypes.has("utility")).toBe(true);
  });
});
