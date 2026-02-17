import { describe, expect, test } from "vitest";
import {
  addToStable,
  advanceBreeding,
  advanceHealing,
  applyHealing,
  collectOffspring,
  copyMutation,
  createRoster,
  isBreedingComplete,
  isHealingComplete,
  isUnitAvailable,
  recruitUnit,
  removeFromStable,
  revealPotential,
  startBreeding,
  startHealing,
  swapSquadUnit,
  upgradePotentialGrade,
} from "../src/core/lab";
import { GeneticGrade, Position } from "../src/core/types";
import { createUnit } from "../src/core/unit";
import { BEAR, EAGLE, TIGER } from "../src/data/species";

describe("Healing Station", () => {
  test("starts healing with correct time calculation", () => {
    const unit = createUnit(BEAR, Position.Center);
    const damaged = { ...unit, stats: { ...unit.stats, currentHp: 20 } };
    const healRatePerDay = 100;

    const healingSlot = startHealing(damaged, healRatePerDay);

    expect(healingSlot.unitId).toBe(damaged.id);
    expect(healingSlot.damageToHeal).toBe(unit.stats.maxHp - 20);
    expect(healingSlot.daysRemaining).toBeGreaterThan(0);
  });

  test("advances healing over time", () => {
    const unit = createUnit(BEAR, Position.Center);
    const damaged = { ...unit, stats: { ...unit.stats, currentHp: 50 } };
    const healingSlot = startHealing(damaged, 100);

    const advanced = advanceHealing(healingSlot, 0.5);
    expect(advanced.daysRemaining).toBeLessThan(healingSlot.daysRemaining);
  });

  test("healing completes when time reaches zero", () => {
    const unit = createUnit(BEAR, Position.Center);
    const damaged = { ...unit, stats: { ...unit.stats, currentHp: 50 } };
    const healingSlot = startHealing(damaged, 100);

    expect(isHealingComplete(healingSlot)).toBe(false);

    const completed = advanceHealing(healingSlot, 999);
    expect(isHealingComplete(completed)).toBe(true);
    expect(completed.daysRemaining).toBe(0);
  });

  test("applies healing restores unit to full HP", () => {
    const unit = createUnit(BEAR, Position.Center);
    const damaged = { ...unit, stats: { ...unit.stats, currentHp: 10 } };

    const healed = applyHealing(damaged);
    expect(healed.stats.currentHp).toBe(healed.stats.maxHp);
  });
});

describe("Recruiting Station", () => {
  test("recruits new level 1 unit of specified species", () => {
    const newUnit = recruitUnit(TIGER, Position.Left);

    expect(newUnit.speciesId).toBe("tiger");
    expect(newUnit.level).toBe(1);
    expect(newUnit.xp).toBe(0);
    expect(newUnit.position).toBe(Position.Left);
  });

  test("recruited units have random genetic potential", () => {
    const unit1 = recruitUnit(BEAR, Position.Center);
    const unit2 = recruitUnit(BEAR, Position.Center);

    // They should have genetic potential
    expect(unit1.geneticPotential).toBeDefined();
    expect(unit2.geneticPotential).toBeDefined();
  });
});

describe("Breeding Station", () => {
  test("starts breeding with correct time", () => {
    const parent1 = createUnit(BEAR, Position.Left);
    const parent2 = createUnit(BEAR, Position.Right);

    const breedingSlot = startBreeding(parent1, parent2, 3);

    expect(breedingSlot.parent1Id).toBe(parent1.id);
    expect(breedingSlot.parent2Id).toBe(parent2.id);
    expect(breedingSlot.daysRemaining).toBe(3);
    expect(breedingSlot.offspringGenome).toBeDefined();
  });

  test("advances breeding over time", () => {
    const parent1 = createUnit(BEAR, Position.Left);
    const parent2 = createUnit(BEAR, Position.Right);
    const breedingSlot = startBreeding(parent1, parent2, 3);

    const advanced = advanceBreeding(breedingSlot, 1);
    expect(advanced.daysRemaining).toBe(2);
  });

  test("breeding completes when time reaches zero", () => {
    const parent1 = createUnit(BEAR, Position.Left);
    const parent2 = createUnit(BEAR, Position.Right);
    const breedingSlot = startBreeding(parent1, parent2, 3);

    expect(isBreedingComplete(breedingSlot)).toBe(false);

    const completed = advanceBreeding(breedingSlot, 999);
    expect(isBreedingComplete(completed)).toBe(true);
  });

  test("collects offspring with inherited traits", () => {
    const parent1 = createUnit(BEAR, Position.Left, {
      mutations: ["thick_hide"],
      potential: {
        maxHp: GeneticGrade.A,
        speed: GeneticGrade.B,
        attackPower: GeneticGrade.C,
      },
    });

    const parent2 = createUnit(BEAR, Position.Right, {
      mutations: ["swift_reflexes"],
      potential: {
        maxHp: GeneticGrade.B,
        speed: GeneticGrade.A,
        attackPower: GeneticGrade.B,
      },
    });

    const breedingSlot = startBreeding(parent1, parent2, 3);
    const completed = advanceBreeding(breedingSlot, 3);

    const offspring = collectOffspring(completed, BEAR, Position.Center);

    expect(offspring.speciesId).toBe("bear");
    expect(offspring.level).toBe(1);
    expect(offspring.geneticPotential).toBeDefined();
  });
});

describe("Microscope Station", () => {
  test("reveals genetic potential stats", () => {
    const unit = createUnit(BEAR, Position.Center, {
      potential: {
        maxHp: GeneticGrade.A,
        speed: GeneticGrade.B,
        attackPower: GeneticGrade.C,
      },
    });

    const revealed = revealPotential(unit, {}, 1);

    // Should reveal exactly 1 stat
    const revealedCount = Object.keys(revealed).length;
    expect(revealedCount).toBe(1);
  });

  test("reveals multiple stats with higher reveal count", () => {
    const unit = createUnit(BEAR, Position.Center);

    const revealed = revealPotential(unit, {}, 2);

    const revealedCount = Object.keys(revealed).length;
    expect(revealedCount).toBe(2);
  });

  test("does not re-reveal already revealed stats", () => {
    const unit = createUnit(BEAR, Position.Center, {
      potential: {
        maxHp: GeneticGrade.A,
        speed: GeneticGrade.B,
        attackPower: GeneticGrade.C,
      },
    });

    const alreadyRevealed = { maxHp: GeneticGrade.A };
    const revealed = revealPotential(unit, alreadyRevealed, 1);

    expect(revealed.maxHp).toBe(GeneticGrade.A);
    expect(revealed.speed || revealed.attackPower).toBeDefined();
  });

  test("reveals all stats with high reveal count", () => {
    const unit = createUnit(BEAR, Position.Center, {
      potential: {
        maxHp: GeneticGrade.S,
        speed: GeneticGrade.A,
        attackPower: GeneticGrade.B,
      },
    });

    const revealed = revealPotential(unit, {}, 10);

    expect(revealed.maxHp).toBe(GeneticGrade.S);
    expect(revealed.speed).toBe(GeneticGrade.A);
    expect(revealed.attackPower).toBe(GeneticGrade.B);
  });
});

describe("Gene Editing Station", () => {
  test("copies mutation to target unit", () => {
    const unit = createUnit(BEAR, Position.Center);
    expect(unit.mutations).not.toContain("thick_hide");

    const edited = copyMutation(unit, "thick_hide", BEAR);

    expect(edited.mutations).toContain("thick_hide");
  });

  test("does not duplicate existing mutations", () => {
    const unit = createUnit(BEAR, Position.Center, {
      mutations: ["thick_hide"],
    });

    const edited = copyMutation(unit, "thick_hide", BEAR);

    const thickHideCount = edited.mutations.filter((m) => m === "thick_hide").length;
    expect(thickHideCount).toBe(1);
  });

  test("upgrades genetic potential grade", () => {
    const unit = createUnit(BEAR, Position.Center, {
      potential: {
        maxHp: GeneticGrade.C,
        speed: GeneticGrade.B,
        attackPower: GeneticGrade.A,
      },
    });

    const upgraded = upgradePotentialGrade(unit, "maxHp");

    expect(upgraded.geneticPotential.maxHp).toBe(GeneticGrade.B);
    expect(upgraded.geneticPotential.speed).toBe(GeneticGrade.B);
    expect(upgraded.geneticPotential.attackPower).toBe(GeneticGrade.A);
  });

  test("cannot upgrade beyond S grade", () => {
    const unit = createUnit(BEAR, Position.Center, {
      potential: {
        maxHp: GeneticGrade.S,
        speed: GeneticGrade.S,
        attackPower: GeneticGrade.S,
      },
    });

    const upgraded = upgradePotentialGrade(unit, "maxHp");

    expect(upgraded.geneticPotential.maxHp).toBe(GeneticGrade.S);
  });
});

describe("Roster & Stable Management", () => {
  test("creates roster with squad and stable", () => {
    const squad = [
      createUnit(BEAR, Position.Left),
      createUnit(EAGLE, Position.Center),
      createUnit(TIGER, Position.Right),
    ];
    const stable = [createUnit(BEAR, Position.Left), createUnit(EAGLE, Position.Center)];

    const roster = createRoster(squad, stable);

    expect(roster.squad.length).toBe(3);
    expect(roster.stable.length).toBe(2);
    expect(roster.healing.length).toBe(0);
    expect(roster.breeding.length).toBe(0);
  });

  test("adds unit to stable", () => {
    const roster = createRoster([], []);
    const unit = createUnit(BEAR, Position.Center);

    const updated = addToStable(roster, unit);

    expect(updated.stable.length).toBe(1);
    expect(updated.stable[0]!.id).toBe(unit.id);
  });

  test("removes unit from stable", () => {
    const unit = createUnit(BEAR, Position.Center);
    const roster = createRoster([], [unit]);

    const updated = removeFromStable(roster, unit.id);

    expect(updated.stable.length).toBe(0);
  });

  test("swaps squad unit with stable unit", () => {
    const squadUnit = createUnit(BEAR, Position.Left);
    const stableUnit = createUnit(TIGER, Position.Left);
    const roster = createRoster([squadUnit], [stableUnit]);

    const swapped = swapSquadUnit(roster, 0, stableUnit.id);

    expect(swapped.squad[0]!.id).toBe(stableUnit.id);
    expect(swapped.stable.find((u) => u.id === squadUnit.id)).toBeDefined();
    expect(swapped.stable.find((u) => u.id === stableUnit.id)).toBeUndefined();
  });

  test("checks unit availability", () => {
    const unit1 = createUnit(BEAR, Position.Left);
    const unit2 = createUnit(BEAR, Position.Center);
    const unit3 = createUnit(BEAR, Position.Right);

    const roster = createRoster([unit1, unit2, unit3], []);

    // All units available initially
    expect(isUnitAvailable(roster, unit1.id)).toBe(true);

    // Unit in healing is not available
    const withHealing = {
      ...roster,
      healing: [startHealing(unit1, 100)],
    };
    expect(isUnitAvailable(withHealing, unit1.id)).toBe(false);

    // Unit in breeding is not available
    const withBreeding = {
      ...roster,
      breeding: [startBreeding(unit2, unit3, 3)],
    };
    expect(isUnitAvailable(withBreeding, unit2.id)).toBe(false);
    expect(isUnitAvailable(withBreeding, unit3.id)).toBe(false);
  });
});
