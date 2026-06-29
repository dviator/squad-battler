import { describe, expect, it } from "vitest";
import type { Unit } from "../src/core/types";
import { Position } from "../src/core/types";
import { createUnit } from "../src/core/unit";
import { BEAR } from "../src/data/species";
import { getIdleTimerLabel, getPrimaryAttackCooldown } from "../src/web/utils/characterCard";

function makeUnit(): Unit {
  return createUnit(BEAR, Position.Center);
}

describe("getPrimaryAttackCooldown", () => {
  it("returns the first attack baseCooldown", () => {
    const unit = makeUnit();
    const expected = unit.attacks[0]?.baseCooldown ?? 10;
    expect(getPrimaryAttackCooldown(unit)).toBe(expected);
    expect(getPrimaryAttackCooldown(unit)).toBeGreaterThan(0);
  });

  it("returns 10 when the unit has no attacks", () => {
    const unit = { ...makeUnit(), attacks: [], attackTimers: [] };
    expect(getPrimaryAttackCooldown(unit)).toBe(10);
  });
});

describe("getIdleTimerLabel", () => {
  it("formats as '~Nt' from the primary attack cooldown", () => {
    const unit = makeUnit();
    const cooldown = getPrimaryAttackCooldown(unit);
    expect(getIdleTimerLabel(unit)).toBe(`~${cooldown}t`);
  });

  it("uses the fallback of 10 when there are no attacks", () => {
    const unit = { ...makeUnit(), attacks: [], attackTimers: [] };
    expect(getIdleTimerLabel(unit)).toBe("~10t");
  });
});
