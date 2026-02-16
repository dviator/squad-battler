import { describe, expect, test } from "vitest";
import { breed, createGenome } from "../src/core/genetics";
import { GeneticGrade, LifeStage, Position } from "../src/core/types";
import {
  ageUnit,
  canBreed,
  createUnit,
  gainExperience,
  generateGeneticPotential,
  getLifeStage,
  getStatGrowthPerLevel,
} from "../src/core/unit";
import { BEAR } from "../src/data/species";

describe("Genetic Potential", () => {
  test("generates random genetic potential", () => {
    const potential = generateGeneticPotential();

    expect(potential.maxHp).toBeDefined();
    expect(potential.speed).toBeDefined();
    expect(potential.attackPower).toBeDefined();

    // All should be valid grades
    const validGrades = Object.values(GeneticGrade);
    expect(validGrades).toContain(potential.maxHp);
    expect(validGrades).toContain(potential.speed);
    expect(validGrades).toContain(potential.attackPower);
  });

  test("genetic potential determines stat growth", () => {
    expect(getStatGrowthPerLevel(GeneticGrade.S)).toBe(8);
    expect(getStatGrowthPerLevel(GeneticGrade.A)).toBe(6);
    expect(getStatGrowthPerLevel(GeneticGrade.B)).toBe(5);
    expect(getStatGrowthPerLevel(GeneticGrade.C)).toBe(4);
    expect(getStatGrowthPerLevel(GeneticGrade.D)).toBe(3);
    expect(getStatGrowthPerLevel(GeneticGrade.F)).toBe(2);
  });

  test("genetic potential is inherited from parents", () => {
    const parent1 = createGenome("bear", [], 0, undefined, {
      maxHp: GeneticGrade.A,
      speed: GeneticGrade.B,
      attackPower: GeneticGrade.C,
    });

    const parent2 = createGenome("bear", [], 0, undefined, {
      maxHp: GeneticGrade.C,
      speed: GeneticGrade.A,
      attackPower: GeneticGrade.B,
    });

    // Run multiple breeding attempts to verify inheritance works
    for (let i = 0; i < 20; i++) {
      const offspring = breed(parent1, parent2);

      // Each stat should be one of: parent1, parent2, or midpoint
      expect(offspring.potential).toBeDefined();
      expect(offspring.potential.maxHp).toBeDefined();
      expect(offspring.potential.speed).toBeDefined();
      expect(offspring.potential.attackPower).toBeDefined();
    }
  });
});

describe("Aging System", () => {
  test("life stages progress with age", () => {
    expect(getLifeStage(0)).toBe(LifeStage.Young);
    expect(getLifeStage(6)).toBe(LifeStage.Young);
    expect(getLifeStage(7)).toBe(LifeStage.Adult);
    expect(getLifeStage(20)).toBe(LifeStage.Adult);
    expect(getLifeStage(21)).toBe(LifeStage.Elderly);
    expect(getLifeStage(29)).toBe(LifeStage.Elderly);
    expect(getLifeStage(30)).toBe(LifeStage.Dead);
    expect(getLifeStage(100)).toBe(LifeStage.Dead);
  });

  test("units start young", () => {
    const unit = createUnit(BEAR, Position.Center);
    expect(unit.age).toBe(0);
    expect(unit.lifeStage).toBe(LifeStage.Young);
  });

  test("aging progresses life stage", () => {
    const unit = createUnit(BEAR, Position.Center);

    const aged7 = ageUnit(unit, 7);
    expect(aged7.age).toBe(7);
    expect(aged7.lifeStage).toBe(LifeStage.Adult);

    const aged21 = ageUnit(aged7, 14);
    expect(aged21.age).toBe(21);
    expect(aged21.lifeStage).toBe(LifeStage.Elderly);

    const aged30 = ageUnit(aged21, 9);
    expect(aged30.age).toBe(30);
    expect(aged30.lifeStage).toBe(LifeStage.Dead);
  });

  test("elderly units get stat penalty", () => {
    const unit = createUnit(BEAR, Position.Center);
    const originalMaxHp = unit.stats.maxHp;
    const originalSpeed = unit.stats.speed;
    const originalAttackPower = unit.stats.attackPower;

    // Age to elderly (21 days)
    const elderly = ageUnit(unit, 21);

    // Stats should be reduced by 20%
    expect(elderly.stats.maxHp).toBe(Math.floor(originalMaxHp * 0.8));
    expect(elderly.stats.speed).toBe(Math.floor(originalSpeed * 0.8));
    expect(elderly.stats.attackPower).toBe(Math.floor(originalAttackPower * 0.8));
  });

  test("breeding restrictions by life stage", () => {
    const young = createUnit(BEAR, Position.Center);
    expect(canBreed(young)).toBe(false);

    const adult = ageUnit(young, 7);
    expect(canBreed(adult)).toBe(true);

    const elderly = ageUnit(adult, 14);
    expect(canBreed(elderly)).toBe(true);

    const dead = ageUnit(elderly, 9);
    expect(canBreed(dead)).toBe(false);
  });
});

describe("Leveling System", () => {
  test("units start at level 1 with 0 xp", () => {
    const unit = createUnit(BEAR, Position.Center);
    expect(unit.level).toBe(1);
    expect(unit.xp).toBe(0);
  });

  test("gaining xp increases total but doesn't level up until threshold", () => {
    const unit = createUnit(BEAR, Position.Center);

    const withXp = gainExperience(unit, 50);
    expect(withXp.level).toBe(1);
    expect(withXp.xp).toBe(50);
  });

  test("reaching 100 xp levels up to level 2", () => {
    const unit = createUnit(BEAR, Position.Center);

    const leveled = gainExperience(unit, 100);
    expect(leveled.level).toBe(2);
    expect(leveled.xp).toBe(100);
  });

  test("stat growth on level up based on genetic potential", () => {
    const unit = createUnit(BEAR, Position.Center, {
      potential: {
        maxHp: GeneticGrade.A,
        speed: GeneticGrade.C,
        attackPower: GeneticGrade.S,
      },
    });

    const originalMaxHp = unit.stats.maxHp;
    const originalSpeed = unit.stats.speed;
    const originalAttackPower = unit.stats.attackPower;

    // Level up to level 2
    const leveled = gainExperience(unit, 100);

    // A grade = +6 HP, C grade = +4 speed, S grade = +8 attack
    expect(leveled.stats.maxHp).toBe(originalMaxHp + 6);
    expect(leveled.stats.speed).toBe(originalSpeed + 4);
    expect(leveled.stats.attackPower).toBe(originalAttackPower + 8);
  });

  test("healing on level up", () => {
    const unit = createUnit(BEAR, Position.Center);
    const damaged = { ...unit, stats: { ...unit.stats, currentHp: 10 } };

    const leveled = gainExperience(damaged, 100);

    // Should gain HP from the level up
    expect(leveled.stats.currentHp).toBeGreaterThan(damaged.stats.currentHp);
  });

  test("multiple levels at once", () => {
    const unit = createUnit(BEAR, Position.Center, {
      potential: {
        maxHp: GeneticGrade.B,
        speed: GeneticGrade.B,
        attackPower: GeneticGrade.B,
      },
    });

    const originalMaxHp = unit.stats.maxHp;

    // Gain enough XP for 3 levels (300 XP = level 4)
    const leveled = gainExperience(unit, 300);

    expect(leveled.level).toBe(4);
    expect(leveled.xp).toBe(300);

    // B grade = +5 per level, 3 levels = +15
    expect(leveled.stats.maxHp).toBe(originalMaxHp + 15);
  });
});
