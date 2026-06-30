import { describe, expect, it } from "vitest";
import { Position } from "../src/core/types";
import { createUnit } from "../src/core/unit";
import { BEAR, EAGLE, TIGER } from "../src/data/species";
import { resolveItemTarget } from "../src/web/utils/shopFlow";

function makeSquad(count: 1 | 2 | 3) {
  const all = [
    createUnit(BEAR, Position.Left),
    createUnit(EAGLE, Position.Center),
    createUnit(TIGER, Position.Right),
  ];
  return all.slice(0, count);
}

describe("resolveItemTarget", () => {
  it("auto-selects the only unit in a single-unit squad", () => {
    const squad = makeSquad(1);
    expect(resolveItemTarget(squad, null)).toBe(squad[0]!.id);
  });

  it("still returns the only unit even when a focusedUnitId is provided", () => {
    const squad = makeSquad(1);
    expect(resolveItemTarget(squad, "some-id")).toBe(squad[0]!.id);
  });

  it("uses the focused unit when one is selected in a multi-unit squad", () => {
    const squad = makeSquad(3);
    expect(resolveItemTarget(squad, squad[1]!.id)).toBe(squad[1]!.id);
  });

  it("returns null when no unit is focused in a multi-unit squad", () => {
    const squad = makeSquad(3);
    expect(resolveItemTarget(squad, null)).toBeNull();
  });

  it("returns null when the focused unit id is not present in the squad", () => {
    const squad = makeSquad(2);
    expect(resolveItemTarget(squad, "stale_unit_id")).toBeNull();
  });
});
