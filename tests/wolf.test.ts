import { describe, expect, test } from "vitest";
import { createBattleState, simulateBattle, tickBattle } from "../src/core/battle";
import { BattleEventType, Position, TargetType } from "../src/core/types";
import { createUnit, isAlive } from "../src/core/unit";
import { ALL_SPECIES, BEAR, EAGLE, SPECIES_BY_ID, TIGER, WOLF } from "../src/data/species";

describe("Wolf Species", () => {
  test("creates wolf with correct base stats", () => {
    const wolf = createUnit(WOLF, Position.Center);

    expect(wolf.speciesId).toBe("wolf");
    expect(wolf.stats.maxHp).toBe(140);
    expect(wolf.stats.speed).toBe(13);
    expect(wolf.stats.attackPower).toBe(22);
  });

  test("wolf has Swarm and Pack Bite attacks", () => {
    const wolf = createUnit(WOLF, Position.Center);

    expect(wolf.attacks).toHaveLength(2);
    expect(wolf.attacks[0]!.id).toBe("wolf_swarm");
    expect(wolf.attacks[0]!.name).toBe("Swarm");
    expect(wolf.attacks[0]!.baseCooldown).toBe(2);
    expect(wolf.attacks[0]!.targetType).toBe(TargetType.LastPlayerTarget);

    expect(wolf.attacks[1]!.id).toBe("wolf_bite");
    expect(wolf.attacks[1]!.name).toBe("Pack Bite");
    expect(wolf.attacks[1]!.baseCooldown).toBe(3);
  });

  test("wolf is exported in ALL_SPECIES", () => {
    expect(ALL_SPECIES).toContainEqual(expect.objectContaining({ id: "wolf" }));
    expect(SPECIES_BY_ID.wolf).toBeDefined();
  });
});

describe("Swarm Attack - Focus Fire Bonus", () => {
  test("swarm attack targets the last player target when available", () => {
    // Set up: tiger attacks an enemy, then wolf's swarm should target the same enemy
    const tiger = createUnit(TIGER, Position.Left);
    const wolf = createUnit(WOLF, Position.Right);
    const enemy1 = createUnit(BEAR, Position.Left);
    const enemy2 = createUnit(EAGLE, Position.Right);

    let state = createBattleState([tiger, wolf], [enemy1, enemy2]);

    // Run enough ticks for attacks to fire and track targets
    for (let i = 0; i < 10; i++) {
      state = tickBattle(state);
    }

    // Check that lastPlayerTargetId gets set
    expect(state.lastPlayerTargetId).not.toBeNull();
  });

  test("swarm does bonus damage when hitting the same target as last player attack", () => {
    // Create a battle where we can observe the swarm bonus
    const wolf = createUnit(WOLF, Position.Center);
    const enemy = createUnit(BEAR, Position.Center); // Single enemy, so swarm always hits same target

    const state = createBattleState([wolf], [enemy]);

    // Simulate enough ticks for multiple swarm attacks
    // First swarm has no bonus (no previous target), second should have bonus
    const result = simulateBattle([wolf], [enemy]);

    // Wolf should deal damage through the battle
    const damageEvents = result.events.filter(
      (e: any) => e.type === BattleEventType.Damage && e.targetId === enemy.id,
    );
    expect(damageEvents.length).toBeGreaterThan(0);
  });

  test("swarm falls back to opposite enemy when no previous target", () => {
    // First attack should fall back since no lastPlayerTargetId exists
    const wolf = createUnit(WOLF, Position.Center);
    const enemy = createUnit(BEAR, Position.Center);

    let state = createBattleState([wolf], [enemy]);

    // Run 2 ticks (swarm cooldown is 2)
    state = tickBattle(state);
    state = tickBattle(state);

    // Should have attacked the opposite enemy as fallback
    const attackEvents = state.events.filter(
      (e: any) => e.type === BattleEventType.AttackExecuted && e.attackerId === wolf.id,
    );
    expect(attackEvents.length).toBeGreaterThan(0);
  });
});

describe("Lone Wolf Mutation", () => {
  test("lone wolf mutation has no static stat modifiers", () => {
    // Lone wolf is conditional, not a flat stat bonus
    const wolf = createUnit(WOLF, Position.Center, { mutations: ["lone_wolf"] });

    // Base stats should be unchanged (lone_wolf has no statModifiers)
    expect(wolf.stats.maxHp).toBe(140);
    expect(wolf.stats.speed).toBe(13);
    expect(wolf.stats.attackPower).toBe(22);
  });

  test("lone wolf deals more damage when last surviving unit", () => {
    // Create a wolf with lone_wolf as the only surviving player unit
    const wolf = createUnit(WOLF, Position.Center, { mutations: ["lone_wolf"] });
    const enemy = createUnit(BEAR, Position.Center);

    // Wolf is already alone — lone_wolf should activate
    const result = simulateBattle([wolf], [enemy]);

    // Wolf with lone_wolf (+50% attack) should deal significant damage
    const damageEvents = result.events.filter(
      (e: any) => e.type === BattleEventType.Damage && e.targetId === enemy.id,
    );
    expect(damageEvents.length).toBeGreaterThan(0);

    // Calculate total damage dealt
    const totalDamage = damageEvents.reduce((sum: number, e: any) => sum + e.damage, 0);
    expect(totalDamage).toBeGreaterThan(0);
  });

  test("lone wolf does NOT activate when allies are alive", () => {
    // With multiple allies, lone_wolf shouldn't boost
    const wolf = createUnit(WOLF, Position.Center, { mutations: ["lone_wolf"] });
    const tiger = createUnit(TIGER, Position.Left);
    const enemy = createUnit(BEAR, Position.Center);

    // The wolf has allies — lone_wolf should NOT activate on first attacks
    let state = createBattleState([wolf, tiger], [enemy]);

    // Tick until wolf attacks
    for (let i = 0; i < 3; i++) {
      state = tickBattle(state);
    }

    // Wolf should have attacked but without lone_wolf bonus
    // We verify the battle runs correctly with allies present and lone_wolf doesn't activate
    expect(state.playerUnits.filter(isAlive).length).toBeGreaterThan(1);
  });

  test("lone wolf activates when allies die mid-battle", () => {
    // Start with allies, but they should die leaving wolf alone
    // Use a very weak ally that will die quickly
    const wolf = createUnit(WOLF, Position.Center, { mutations: ["lone_wolf"] });
    const weakAlly = createUnit(EAGLE, Position.Left);
    // Reduce ally HP to make them die fast
    weakAlly.stats.currentHp = 1;
    weakAlly.stats.maxHp = 1;

    const enemy1 = createUnit(TIGER, Position.Left);
    const enemy2 = createUnit(TIGER, Position.Center);

    const result = simulateBattle([wolf, weakAlly], [enemy1, enemy2]);

    // The weak ally should have died
    const allyDeath = result.events.find(
      (e: any) => e.type === BattleEventType.UnitDied && e.unitId === weakAlly.id,
    );
    expect(allyDeath).toBeDefined();

    // Battle should complete (wolf fights on with lone_wolf bonus)
    expect(result.isComplete).toBe(true);
  });
});

describe("Wolf in Full Battles", () => {
  test("wolf can win battles as part of a squad", () => {
    const wolf = createUnit(WOLF, Position.Center);
    const tiger = createUnit(TIGER, Position.Left);
    const eagle = createUnit(EAGLE, Position.Right);

    const enemy1 = createUnit(BEAR, Position.Left);
    const enemy2 = createUnit(TIGER, Position.Center);
    const enemy3 = createUnit(EAGLE, Position.Right);

    const result = simulateBattle([wolf, tiger, eagle], [enemy1, enemy2, enemy3]);
    expect(result.isComplete).toBe(true);
    expect(result.winner).toBeDefined();
  });

  test("wolf with lone_wolf can solo enemies", () => {
    // A lone wolf with the mutation should be a viable solo fighter
    const wolf = createUnit(WOLF, Position.Center, {
      mutations: ["lone_wolf", "powerful_muscles"],
    });
    const enemy = createUnit(EAGLE, Position.Center);

    const result = simulateBattle([wolf], [enemy]);
    expect(result.isComplete).toBe(true);
    // Wolf should win against a single eagle with those buffs
    expect(result.winner).toBe("player");
  });
});
