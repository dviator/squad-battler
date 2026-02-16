import { describe, expect, test } from "vitest";
import { breed, createGenome, extractGenome } from "../src/core/genetics";
import { Position } from "../src/core/types";
import { createUnit } from "../src/core/unit";
import { TIGER } from "../src/data/species";

describe("Genetics System", () => {
  test("creates basic genome", () => {
    const genome = createGenome("tiger", ["thick_hide"], 0);

    expect(genome.speciesId).toBe("tiger");
    expect(genome.mutations).toEqual(["thick_hide"]);
    expect(genome.generation).toBe(0);
  });

  test("extracts genome from unit", () => {
    const unit = createUnit(TIGER, Position.Center, {
      mutations: ["swift_reflexes"],
    });

    const genome = extractGenome(unit);

    expect(genome.speciesId).toBe("tiger");
    expect(genome.mutations).toContain("swift_reflexes");
  });

  test("breeding combines parent mutations", () => {
    const parent1 = createGenome("tiger", ["thick_hide"], 0);
    const parent2 = createGenome("tiger", ["powerful_muscles"], 0);

    const offspring = breed(parent1, parent2, 0);

    expect(offspring.speciesId).toBe("tiger");
    expect(offspring.generation).toBe(1);
  });

  test("breeding can produce random mutations", () => {
    const parent1 = createGenome("bear", [], 0);
    const parent2 = createGenome("bear", [], 0);

    let foundMutation = false;
    for (let i = 0; i < 100; i++) {
      const offspring = breed(parent1, parent2, 1.0);
      if (offspring.mutations.length > 0) {
        foundMutation = true;
        break;
      }
    }

    expect(foundMutation).toBe(true);
  });

  test("offspring inherits mutations probabilistically", () => {
    const parent1 = createGenome("tiger", ["thick_hide"], 0);
    const parent2 = createGenome("tiger", ["swift_reflexes"], 0);

    const offspring = [];
    for (let i = 0; i < 20; i++) {
      offspring.push(breed(parent1, parent2, 0));
    }

    const withThickHide = offspring.filter((o) => o.mutations.includes("thick_hide"));
    const withSwiftReflexes = offspring.filter((o) => o.mutations.includes("swift_reflexes"));

    expect(withThickHide.length).toBeGreaterThan(0);
    expect(withSwiftReflexes.length).toBeGreaterThan(0);
  });

  test("generation increments with breeding", () => {
    const parent1 = createGenome("eagle", [], 0);
    const parent2 = createGenome("eagle", [], 0);

    const gen1 = breed(parent1, parent2, 0);
    expect(gen1.generation).toBe(1);

    const gen2 = breed(gen1, gen1, 0);
    expect(gen2.generation).toBe(2);
  });

  test("cross-species breeding throws error", () => {
    const bear = createGenome("bear", [], 0);
    const tiger = createGenome("tiger", [], 0);

    expect(() => breed(bear, tiger, 0)).toThrow();
  });
});

describe("Mutation Inheritance", () => {
  test("offspring can have more mutations than either parent", () => {
    const parent1 = createGenome("tiger", ["thick_hide"], 5);
    const parent2 = createGenome("tiger", ["powerful_muscles"], 5);

    let maxMutations = 0;
    for (let i = 0; i < 100; i++) {
      const offspring = breed(parent1, parent2, 0.5);
      maxMutations = Math.max(maxMutations, offspring.mutations.length);
    }

    expect(maxMutations).toBeGreaterThan(2);
  });

  test("mutations affect offspring stats correctly", () => {
    const genome = createGenome("tiger", ["thick_hide", "powerful_muscles"], 1);
    const unit = createUnit(TIGER, Position.Center, genome);

    expect(unit.stats.maxHp).toBe(130);
    expect(unit.stats.attackPower).toBe(38);
  });
});
