import { describe, test, expect } from "vitest";
import { createUnit, isAlive, takeDamage } from "../src/core/unit";
import { BEAR, EAGLE, TIGER } from "../src/data/species";
import { Position } from "../src/core/types";

describe("Unit Creation", () => {
  test("creates unit with base species stats", () => {
    const unit = createUnit(BEAR, Position.Center);

    expect(unit.speciesId).toBe("bear");
    expect(unit.stats.maxHp).toBe(150);
    expect(unit.stats.currentHp).toBe(150);
    expect(unit.stats.speed).toBe(8);
    expect(unit.stats.attackPower).toBe(20);
    expect(unit.position).toBe(Position.Center);
  });

  test("creates unit with mutations", () => {
    const unit = createUnit(TIGER, Position.Left, {
      mutations: ["thick_hide", "powerful_muscles"],
    });

    expect(unit.stats.maxHp).toBe(130);
    expect(unit.stats.currentHp).toBe(130);
    expect(unit.stats.attackPower).toBe(38);
    expect(unit.mutations).toEqual(["thick_hide", "powerful_muscles"]);
  });

  test("initializes attack timers to cooldown values", () => {
    const unit = createUnit(EAGLE, Position.Right);

    expect(unit.attackTimers).toHaveLength(1);
    expect(unit.attackTimers[0]?.attackId).toBe("eagle_snipe");
    expect(unit.attackTimers[0]?.currentCooldown).toBe(3);
  });

  test("applies berserker mutation correctly", () => {
    const unit = createUnit(TIGER, Position.Center, {
      mutations: ["berserker"],
    });

    expect(unit.stats.maxHp).toBe(80);
    expect(unit.stats.attackPower).toBe(45);
  });
});

describe("Unit State", () => {
  test("unit is alive with positive HP", () => {
    const unit = createUnit(BEAR, Position.Center);
    expect(isAlive(unit)).toBe(true);
  });

  test("unit is dead with zero HP", () => {
    const unit = createUnit(BEAR, Position.Center);
    const deadUnit = takeDamage(unit, 150);
    expect(isAlive(deadUnit)).toBe(false);
  });

  test("takeDamage reduces HP correctly", () => {
    const unit = createUnit(TIGER, Position.Left);
    const damaged = takeDamage(unit, 30);

    expect(damaged.stats.currentHp).toBe(70);
    expect(damaged.stats.maxHp).toBe(100);
  });

  test("takeDamage does not reduce HP below zero", () => {
    const unit = createUnit(EAGLE, Position.Right);
    const overkilled = takeDamage(unit, 1000);

    expect(overkilled.stats.currentHp).toBe(0);
  });
});
