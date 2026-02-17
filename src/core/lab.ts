import { breed } from "./genetics";
import type { GeneticPotential, Genome, Position, Species, Unit } from "./types";
import { GeneticGrade } from "./types";
import { createUnit, recalculateStatsFromMutations } from "./unit";

// Lab Station Types
export enum StationType {
  Healing = "healing",
  Recruiting = "recruiting",
  Breeding = "breeding",
  Microscope = "microscope",
  GeneEditing = "gene_editing",
}

// Station upgrade levels
export interface StationUpgrade {
  level: number;
  slots?: number; // For healing/breeding
  healRatePerDay?: number; // For healing
  revealCount?: number; // For microscope
}

// Default station configurations
export const DEFAULT_STATIONS: Record<StationType, StationUpgrade> = {
  [StationType.Healing]: {
    level: 1,
    slots: 5,
    healRatePerDay: 100, // Fully heal a base unit (100 HP) in 1 day
  },
  [StationType.Recruiting]: {
    level: 1,
  },
  [StationType.Breeding]: {
    level: 1,
    slots: 1, // Can breed 1 pair at a time
  },
  [StationType.Microscope]: {
    level: 1,
    revealCount: 1, // Reveals 1 stat potential at a time
  },
  [StationType.GeneEditing]: {
    level: 1,
  },
};

// Healing Station

export interface HealingSlot {
  unitId: string;
  damageToHeal: number;
  daysRemaining: number;
}

export function startHealing(unit: Unit, healRatePerDay: number): HealingSlot {
  const damage = unit.stats.maxHp - unit.stats.currentHp;
  const daysToHeal = damage / healRatePerDay;

  return {
    unitId: unit.id,
    damageToHeal: damage,
    daysRemaining: daysToHeal,
  };
}

export function advanceHealing(slot: HealingSlot, days: number): HealingSlot {
  return {
    ...slot,
    daysRemaining: Math.max(0, slot.daysRemaining - days),
  };
}

export function isHealingComplete(slot: HealingSlot): boolean {
  return slot.daysRemaining <= 0;
}

export function applyHealing(unit: Unit): Unit {
  return {
    ...unit,
    stats: {
      ...unit.stats,
      currentHp: unit.stats.maxHp,
    },
  };
}

// Recruiting Station

export function recruitUnit(species: Species, position: Position): Unit {
  // Create a new level 1 unit of the specified species
  return createUnit(species, position);
}

// Breeding Station

export interface BreedingSlot {
  parent1Id: string;
  parent2Id: string;
  daysRemaining: number;
  offspringGenome?: Genome;
}

export function startBreeding(
  parent1: Unit,
  parent2: Unit,
  breedingTime: number = 3,
): BreedingSlot {
  // Generate offspring genome immediately
  const parent1Genome = {
    speciesId: parent1.speciesId,
    mutations: parent1.mutations,
    generation: 0,
    potential: parent1.geneticPotential,
  };

  const parent2Genome = {
    speciesId: parent2.speciesId,
    mutations: parent2.mutations,
    generation: 0,
    potential: parent2.geneticPotential,
  };

  const offspringGenome = breed(parent1Genome, parent2Genome);

  return {
    parent1Id: parent1.id,
    parent2Id: parent2.id,
    daysRemaining: breedingTime,
    offspringGenome,
  };
}

export function advanceBreeding(slot: BreedingSlot, days: number): BreedingSlot {
  return {
    ...slot,
    daysRemaining: Math.max(0, slot.daysRemaining - days),
  };
}

export function isBreedingComplete(slot: BreedingSlot): boolean {
  return slot.daysRemaining <= 0;
}

export function collectOffspring(slot: BreedingSlot, species: Species, position: Position): Unit {
  if (!slot.offspringGenome) {
    throw new Error("No offspring genome available");
  }

  return createUnit(species, position, slot.offspringGenome);
}

// Microscope Station

export interface RevealedPotential {
  maxHp?: GeneticGrade;
  speed?: GeneticGrade;
  attackPower?: GeneticGrade;
}

export interface MicroscopeResult {
  unitId: string;
  revealed: RevealedPotential;
}

export function revealPotential(
  unit: Unit,
  alreadyRevealed: RevealedPotential,
  revealCount: number,
): RevealedPotential {
  const revealed = { ...alreadyRevealed };
  const stats: Array<keyof GeneticPotential> = ["maxHp", "speed", "attackPower"];
  const unrevealed = stats.filter((stat) => !revealed[stat]);

  // Reveal up to revealCount stats
  const toReveal = Math.min(revealCount, unrevealed.length);

  for (let i = 0; i < toReveal; i++) {
    const stat = unrevealed[i]!;
    revealed[stat] = unit.geneticPotential[stat];
  }

  return revealed;
}

// Gene Editing Station

export interface GeneEditOperation {
  type: "copy_mutation" | "upgrade_potential";
  sourceUnitId?: string; // For copy_mutation
  mutationId?: string; // For copy_mutation
  stat?: keyof GeneticPotential; // For upgrade_potential
}

export function copyMutation(targetUnit: Unit, mutationId: string, species: Species): Unit {
  // Add mutation if not already present
  if (targetUnit.mutations.includes(mutationId)) {
    return targetUnit;
  }

  const withMutation = {
    ...targetUnit,
    mutations: [...targetUnit.mutations, mutationId],
  };

  // Recalculate stats with the new mutation
  return recalculateStatsFromMutations(withMutation, species);
}

export function upgradePotentialGrade(unit: Unit, stat: keyof GeneticPotential): Unit {
  const gradeOrder = [
    GeneticGrade.F,
    GeneticGrade.D,
    GeneticGrade.C,
    GeneticGrade.B,
    GeneticGrade.A,
    GeneticGrade.S,
  ];

  const currentGrade = unit.geneticPotential[stat];
  const currentIndex = gradeOrder.indexOf(currentGrade);

  if (currentIndex === gradeOrder.length - 1) {
    return unit; // Already at S grade
  }

  const newGrade = gradeOrder[currentIndex + 1];

  return {
    ...unit,
    geneticPotential: {
      ...unit.geneticPotential,
      [stat]: newGrade,
    },
  };
}

// Stable Management

export interface Roster {
  squad: Unit[]; // Active squad (max 3)
  stable: Unit[]; // Reserve units
  healing: HealingSlot[];
  breeding: BreedingSlot[];
}

export function createRoster(initialSquad: Unit[], initialStable: Unit[]): Roster {
  return {
    squad: initialSquad.slice(0, 3), // Max 3 in squad
    stable: initialStable,
    healing: [],
    breeding: [],
  };
}

export function addToStable(roster: Roster, unit: Unit): Roster {
  return {
    ...roster,
    stable: [...roster.stable, unit],
  };
}

export function removeFromStable(roster: Roster, unitId: string): Roster {
  return {
    ...roster,
    stable: roster.stable.filter((u) => u.id !== unitId),
  };
}

export function swapSquadUnit(roster: Roster, squadIndex: number, stableUnitId: string): Roster {
  const stableUnit = roster.stable.find((u) => u.id === stableUnitId);
  if (!stableUnit) {
    throw new Error("Unit not found in stable");
  }

  const oldSquadUnit = roster.squad[squadIndex];
  if (!oldSquadUnit) {
    throw new Error("Invalid squad index");
  }

  const newSquad = [...roster.squad];
  newSquad[squadIndex] = stableUnit;

  const newStable = roster.stable.filter((u) => u.id !== stableUnitId);
  newStable.push(oldSquadUnit);

  return {
    ...roster,
    squad: newSquad,
    stable: newStable,
  };
}

// Check if unit is available (not in healing or breeding)
export function isUnitAvailable(roster: Roster, unitId: string): boolean {
  const inHealing = roster.healing.some((slot) => slot.unitId === unitId);
  const inBreeding = roster.breeding.some(
    (slot) => slot.parent1Id === unitId || slot.parent2Id === unitId,
  );

  return !inHealing && !inBreeding;
}
