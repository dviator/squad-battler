import { Genome, Unit } from "./types";
import { ALL_MUTATIONS } from "../data/mutations";

export function createGenome(
  speciesId: string,
  mutations: string[] = [],
  generation: number = 0,
  parentIds?: string[]
): Genome {
  return {
    speciesId,
    mutations,
    generation,
    parentIds,
  };
}

export function extractGenome(unit: Unit): Genome {
  return {
    speciesId: unit.speciesId,
    mutations: unit.mutations,
    generation: 0,
    parentIds: [unit.id],
  };
}

export function breed(
  parent1Genome: Genome,
  parent2Genome: Genome,
  mutationChance: number = 0.1
): Genome {
  if (parent1Genome.speciesId !== parent2Genome.speciesId) {
    throw new Error("Cross-species breeding not yet implemented");
  }

  const inheritedMutations = new Set<string>();

  parent1Genome.mutations.forEach((mut) => {
    if (Math.random() < 0.5) {
      inheritedMutations.add(mut);
    }
  });

  parent2Genome.mutations.forEach((mut) => {
    if (Math.random() < 0.5) {
      inheritedMutations.add(mut);
    }
  });

  if (Math.random() < mutationChance) {
    const availableMutations = ALL_MUTATIONS.filter(
      (m) => !inheritedMutations.has(m.id)
    );
    if (availableMutations.length > 0) {
      const randomMutation =
        availableMutations[
          Math.floor(Math.random() * availableMutations.length)
        ]!;
      inheritedMutations.add(randomMutation.id);
    }
  }

  return {
    speciesId: parent1Genome.speciesId,
    mutations: Array.from(inheritedMutations),
    generation: Math.max(parent1Genome.generation, parent2Genome.generation) + 1,
    parentIds: [
      ...(parent1Genome.parentIds || []),
      ...(parent2Genome.parentIds || []),
    ],
  };
}
