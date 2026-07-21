import { describe, expect, test } from "vitest";
import { Position } from "../src/core/types";
import { createUnit, isAlive, takeDamage } from "../src/core/unit";
import { BEAR, EAGLE, TIGER } from "../src/data/species";

describe("Unit Creation", () => {
  test("creates unit with base species stats", () => {
    const unit = createUnit(BEAR, Position.Center);

    expect(unit.speciesId).toBe("bear");
    expect(unit.stats.maxHp).toBe(180);
    expect(unit.stats.currentHp).toBe(180);
    expect(unit.stats.speed).toBe(8);
    expect(unit.stats.attackPower).toBe(20);
    expect(unit.position).toBe(Position.Center);
  });

  test("creates unit with mutations", () => {
    const unit = createUnit(TIGER, Position.Left, {
      mutations: ["thick_hide", "powerful_muscles"],
    });

    expect(unit.stats.maxHp).toBe(190);
    expect(unit.stats.currentHp).toBe(190);
    expect(unit.stats.attackPower).toBe(38);
    expect(unit.mutations).toEqual(["thick_hide", "powerful_muscles"]);
  });

  test("initializes attack timers to cooldown values", () => {
    const unit = createUnit(EAGLE, Position.Right);

    expect(unit.attackTimers).toHaveLength(1);
    expect(unit.attackTimers[0]?.attackId).toBe(EAGLE.attacks[0]?.id);
    expect(unit.attackTimers[0]?.currentCooldown).toBe(EAGLE.attacks[0]?.baseCooldown);
  });

  test("unit starts with one starting ability only", () => {
    const bear = createUnit(BEAR, Position.Left);
    const eagle = createUnit(EAGLE, Position.Center);
    const tiger = createUnit(TIGER, Position.Right);

    expect(bear.attacks).toHaveLength(1);
    expect(bear.attacks[0]?.id).toBe("bear_maul");
    expect(eagle.attacks).toHaveLength(1);
    expect(eagle.attacks[0]?.id).toBe("eagle_dive");
    expect(tiger.attacks).toHaveLength(1);
    expect(tiger.attacks[0]?.id).toBe("tiger_pounce");
  });

  test("applies berserker mutation correctly", () => {
    const unit = createUnit(TIGER, Position.Center, {
      mutations: ["berserker"],
    });

    expect(unit.stats.maxHp).toBe(140);
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
    const deadUnit = takeDamage(unit, 181);
    expect(isAlive(deadUnit)).toBe(false);
  });

  test("takeDamage reduces HP correctly", () => {
    const unit = createUnit(TIGER, Position.Left);
    const damaged = takeDamage(unit, 30);

    expect(damaged.stats.currentHp).toBe(130);
    expect(damaged.stats.maxHp).toBe(160);
  });

  test("takeDamage does not reduce HP below zero", () => {
    const unit = createUnit(EAGLE, Position.Right);
    const overkilled = takeDamage(unit, 1000);

    expect(overkilled.stats.currentHp).toBe(0);
  });
});
