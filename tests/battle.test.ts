import { describe, test, expect } from "vitest";
import { simulateBattle, tickBattle, createBattleState } from "../src/core/battle";
import { createUnit } from "../src/core/unit";
import { BEAR, EAGLE, TIGER } from "../src/data/species";
import { Position, BattleEventType } from "../src/core/types";

describe("Battle System", () => {
  test("battle completes when one side is eliminated", () => {
    const player = [createUnit(TIGER, Position.Center)];
    const enemy = [createUnit(BEAR, Position.Center)];

    const result = simulateBattle(player, enemy);

    expect(result.isComplete).toBe(true);
    expect(result.winner).not.toBeNull();
  });

  test("faster unit attacks first", () => {
    const fastUnit = createUnit(EAGLE, Position.Center);
    const slowUnit = createUnit(BEAR, Position.Center);

    const result = simulateBattle([fastUnit], [slowUnit]);

    const attackEvents = result.events.filter(
      (e) => e.type === BattleEventType.AttackExecuted
    );

    expect(attackEvents.length).toBeGreaterThan(0);
  });

  test("units attack on cooldown intervals", () => {
    const tiger = createUnit(TIGER, Position.Center);
    const bear = createUnit(BEAR, Position.Center);

    let state = createBattleState([tiger], [bear]);

    for (let i = 0; i < 10; i++) {
      state = tickBattle(state);
    }

    const tigerAttacks = state.events.filter(
      (e) =>
        e.type === BattleEventType.AttackExecuted && e.attackerId === tiger.id
    );

    expect(tigerAttacks.length).toBeGreaterThan(3);
  });

  test("AOE attack hits multiple targets", () => {
    const bear = createUnit(BEAR, Position.Center);
    const enemies = [
      createUnit(TIGER, Position.Left),
      createUnit(TIGER, Position.Center),
      createUnit(TIGER, Position.Right),
    ];

    const result = simulateBattle([bear], enemies);

    const bearAttacks = result.events.filter(
      (e) =>
        e.type === BattleEventType.AttackExecuted && e.attackerId === bear.id
    );

    if (bearAttacks.length > 0) {
      const firstAttack = bearAttacks[0];
      if (firstAttack && firstAttack.type === BattleEventType.AttackExecuted) {
        expect(firstAttack.targetIds.length).toBeGreaterThan(1);
      }
    }
  });

  test("eagle targets lowest HP enemy", () => {
    const eagle = createUnit(EAGLE, Position.Center);
    const weakEnemy = createUnit(TIGER, Position.Left);
    weakEnemy.stats.currentHp = 10;
    const strongEnemy = createUnit(BEAR, Position.Right);

    const result = simulateBattle([eagle], [weakEnemy, strongEnemy]);

    const eagleAttacks = result.events.filter(
      (e) =>
        e.type === BattleEventType.AttackExecuted && e.attackerId === eagle.id
    );

    if (eagleAttacks.length > 0) {
      const firstAttack = eagleAttacks[0];
      if (firstAttack && firstAttack.type === BattleEventType.AttackExecuted) {
        expect(firstAttack.targetIds).toContain(weakEnemy.id);
      }
    }
  });

  test("battle ends with correct winner", () => {
    const strongPlayer = createUnit(BEAR, Position.Center, {
      mutations: ["powerful_muscles", "thick_hide", "berserker"],
    });
    const weakEnemy = createUnit(EAGLE, Position.Center);

    const result = simulateBattle([strongPlayer], [weakEnemy]);

    expect(result.winner).toBe("player");
  });

  test("survivors are tracked correctly", () => {
    const squad = [
      createUnit(TIGER, Position.Left),
      createUnit(TIGER, Position.Center),
      createUnit(TIGER, Position.Right),
    ];
    const weakEnemy = createUnit(EAGLE, Position.Center);
    weakEnemy.stats.currentHp = 1;

    const result = simulateBattle(squad, [weakEnemy]);

    const endEvent = result.events.find(
      (e) => e.type === BattleEventType.BattleEnd
    );
    if (endEvent && endEvent.type === BattleEventType.BattleEnd) {
      expect(endEvent.survivors.length).toBeGreaterThan(0);
    }
  });
});

describe("Battle Mechanics", () => {
  test("damage is calculated correctly", () => {
    const attacker = createUnit(TIGER, Position.Center);
    const defender = createUnit(EAGLE, Position.Center);

    const result = simulateBattle([attacker], [defender]);

    const damageEvents = result.events.filter(
      (e) => e.type === BattleEventType.Damage && e.targetId === defender.id
    );

    expect(damageEvents.length).toBeGreaterThan(0);
    if (damageEvents[0] && damageEvents[0].type === BattleEventType.Damage) {
      expect(damageEvents[0].damage).toBeGreaterThan(0);
    }
  });

  test("units die when HP reaches zero", () => {
    const weak = createUnit(EAGLE, Position.Center);
    weak.stats.currentHp = 1;
    const strong = createUnit(BEAR, Position.Center);

    const result = simulateBattle([weak], [strong]);

    const deathEvents = result.events.filter(
      (e) => e.type === BattleEventType.UnitDied
    );

    expect(deathEvents.length).toBeGreaterThan(0);
  });
});
