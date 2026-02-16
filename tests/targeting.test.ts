import { describe, expect, test } from "vitest";
import { resolveTargets } from "../src/core/targeting";
import { Position, TargetType } from "../src/core/types";
import { createUnit } from "../src/core/unit";
import { BEAR, EAGLE, TIGER } from "../src/data/species";

describe("Targeting System", () => {
  test("OppositeEnemy targets unit in same position", () => {
    const attacker = createUnit(TIGER, Position.Left);
    const enemies = [createUnit(BEAR, Position.Left), createUnit(BEAR, Position.Center)];

    const targets = resolveTargets(attacker, [], enemies, TargetType.OppositeEnemy);

    expect(targets).toHaveLength(1);
    expect(targets[0]?.position).toBe(Position.Left);
  });

  test("OppositeEnemy falls back to first enemy if no opposite", () => {
    const attacker = createUnit(TIGER, Position.Right);
    const enemies = [createUnit(BEAR, Position.Left)];

    const targets = resolveTargets(attacker, [], enemies, TargetType.OppositeEnemy);

    expect(targets).toHaveLength(1);
    expect(targets[0]).toBe(enemies[0]);
  });

  test("LowestHpEnemy targets weakest unit", () => {
    const attacker = createUnit(EAGLE, Position.Center);
    const weak = createUnit(TIGER, Position.Left);
    weak.stats.currentHp = 20;
    const strong = createUnit(BEAR, Position.Center);
    strong.stats.currentHp = 150;

    const targets = resolveTargets(attacker, [], [strong, weak], TargetType.LowestHpEnemy);

    expect(targets).toHaveLength(1);
    expect(targets[0]).toBe(weak);
  });

  test("AllEnemies targets all living enemies", () => {
    const attacker = createUnit(BEAR, Position.Center);
    const enemies = [
      createUnit(TIGER, Position.Left),
      createUnit(TIGER, Position.Center),
      createUnit(TIGER, Position.Right),
    ];

    const targets = resolveTargets(attacker, [], enemies, TargetType.AllEnemies);

    expect(targets).toHaveLength(3);
  });

  test("AllEnemies ignores dead units", () => {
    const attacker = createUnit(BEAR, Position.Center);
    const alive1 = createUnit(TIGER, Position.Left);
    const dead = createUnit(TIGER, Position.Center);
    dead.stats.currentHp = 0;
    const alive2 = createUnit(TIGER, Position.Right);

    const targets = resolveTargets(attacker, [], [alive1, dead, alive2], TargetType.AllEnemies);

    expect(targets).toHaveLength(2);
    expect(targets).toContain(alive1);
    expect(targets).toContain(alive2);
  });

  test("RandomEnemy returns single enemy", () => {
    const attacker = createUnit(TIGER, Position.Center);
    const enemies = [createUnit(BEAR, Position.Left), createUnit(BEAR, Position.Right)];

    const targets = resolveTargets(attacker, [], enemies, TargetType.RandomEnemy);

    expect(targets).toHaveLength(1);
    expect(enemies).toContainEqual(targets[0]);
  });

  test("returns empty array when no valid targets", () => {
    const attacker = createUnit(TIGER, Position.Center);

    const targets = resolveTargets(attacker, [], [], TargetType.OppositeEnemy);

    expect(targets).toHaveLength(0);
  });
});
