import type { GeneticPotential, Genome, Unit } from "./types";
import { GeneticGrade } from "./types";
import { generateGeneticPotential } from "./unit";

export function createGenome(
  speciesId: string,
  mutations: string[] = [],
  generation: number = 0,
  parentIds?: string[],
  potential?: GeneticPotential,
): Genome {
  return {
    speciesId,
    mutations,
    generation,
    parentIds,
    potential: potential || generateGeneticPotential(),
  };
}

export function extractGenome(unit: Unit): Genome {
  return {
    speciesId: unit.speciesId,
    mutations: unit.mutations,
    generation: 0,
    parentIds: [unit.id],
    potential: unit.geneticPotential,
  };
}

export function breed(parent1Genome: Genome, parent2Genome: Genome): Genome {
  if (parent1Genome.speciesId !== parent2Genome.speciesId) {
    throw new Error("Cross-species breeding not yet implemented");
  }

  // Inherit mutations: 50% chance per parent
  const mutations: string[] = [];
  const allMutations = new Set([...parent1Genome.mutations, ...parent2Genome.mutations]);

  for (const mutation of allMutations) {
    const parent1Has = parent1Genome.mutations.includes(mutation);
    const parent2Has = parent2Genome.mutations.includes(mutation);

    // Both parents have it = 100% (50% + 50%)
    // One parent has it = 50%
    const inheritChance = (parent1Has ? 0.5 : 0) + (parent2Has ? 0.5 : 0);

    if (Math.random() < inheritChance) {
      mutations.push(mutation);
    }
  }

  // Inherit genetic potential using allele-style inheritance
  const potential = inheritGeneticPotential(parent1Genome.potential, parent2Genome.potential);

  return {
    speciesId: parent1Genome.speciesId,
    mutations,
    generation: Math.max(parent1Genome.generation, parent2Genome.generation) + 1,
    parentIds: [...(parent1Genome.parentIds || []), ...(parent2Genome.parentIds || [])],
    potential,
  };
}

// Inherit genetic potential with allele-like mechanics
// 25% chance of each parent's exact stat, 50% chance of midpoint
function inheritGeneticPotential(
  parent1: GeneticPotential,
  parent2: GeneticPotential,
): GeneticPotential {
  return {
    maxHp: inheritSinglePotential(parent1.maxHp, parent2.maxHp),
    speed: inheritSinglePotential(parent1.speed, parent2.speed),
    attackPower: inheritSinglePotential(parent1.attackPower, parent2.attackPower),
  };
}

function inheritSinglePotential(grade1: GeneticGrade, grade2: GeneticGrade): GeneticGrade {
  const gradeOrder = [
    GeneticGrade.F,
    GeneticGrade.D,
    GeneticGrade.C,
    GeneticGrade.B,
    GeneticGrade.A,
    GeneticGrade.S,
  ];

  const index1 = gradeOrder.indexOf(grade1);
  const index2 = gradeOrder.indexOf(grade2);

  const roll = Math.random();

  if (roll < 0.25) {
    // 25% parent 1
    return grade1;
  }
  if (roll < 0.5) {
    // 25% parent 2
    return grade2;
  }
  // 50% midpoint
  const midIndex = Math.round((index1 + index2) / 2);
  return gradeOrder[midIndex];
}

// Upgrade genetic potential by one grade (for gene editing station)
export function upgradeGeneticGrade(current: GeneticGrade): GeneticGrade {
  const gradeOrder = [
    GeneticGrade.F,
    GeneticGrade.D,
    GeneticGrade.C,
    GeneticGrade.B,
    GeneticGrade.A,
    GeneticGrade.S,
  ];

  const currentIndex = gradeOrder.indexOf(current);
  if (currentIndex === gradeOrder.length - 1) {
    return current; // Already at S, can't upgrade
  }

  return gradeOrder[currentIndex + 1];
}
