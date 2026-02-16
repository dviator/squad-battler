import { MUTATIONS_BY_ID } from "../data/mutations";
import type { AttackTimer, GeneticPotential, Genome, Position, Species, Unit } from "./types";
import { GeneticGrade, LifeStage } from "./types";

let unitIdCounter = 0;

// Generate random genetic potential for a new unit
export function generateGeneticPotential(): GeneticPotential {
  const grades = [
    GeneticGrade.F,
    GeneticGrade.D,
    GeneticGrade.C,
    GeneticGrade.B,
    GeneticGrade.A,
    GeneticGrade.S,
  ];

  // Weight distribution: F(30%), D(25%), C(20%), B(15%), A(8%), S(2%)
  const weights = [30, 25, 20, 15, 8, 2];
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  const randomGrade = () => {
    const roll = Math.random() * totalWeight;
    let cumulative = 0;
    for (let i = 0; i < grades.length; i++) {
      cumulative += weights[i];
      if (roll < cumulative) return grades[i];
    }
    return grades[0]; // fallback to F
  };

  return {
    maxHp: randomGrade(),
    speed: randomGrade(),
    attackPower: randomGrade(),
  };
}

// Determine life stage based on age in days
export function getLifeStage(age: number): LifeStage {
  if (age >= 30) return LifeStage.Dead;
  if (age >= 21) return LifeStage.Elderly;
  if (age >= 7) return LifeStage.Adult;
  return LifeStage.Young;
}

// Get stat growth per level based on genetic grade
export function getStatGrowthPerLevel(grade: GeneticGrade): number {
  switch (grade) {
    case GeneticGrade.S:
      return 8;
    case GeneticGrade.A:
      return 6;
    case GeneticGrade.B:
      return 5;
    case GeneticGrade.C:
      return 4;
    case GeneticGrade.D:
      return 3;
    case GeneticGrade.F:
      return 2;
  }
}

export function createUnit(species: Species, position: Position, genome?: Partial<Genome>): Unit {
  const stats = { ...species.baseStats, currentHp: species.baseStats.maxHp };
  const mutations = genome?.mutations || [];

  mutations.forEach((mutationId) => {
    const mutation = MUTATIONS_BY_ID[mutationId];
    if (!mutation) return;

    if (mutation.statModifiers) {
      if (mutation.statModifiers.maxHp !== undefined) {
        stats.maxHp += mutation.statModifiers.maxHp;
        stats.currentHp += mutation.statModifiers.maxHp;
      }
      if (mutation.statModifiers.speed !== undefined) {
        stats.speed += mutation.statModifiers.speed;
      }
      if (mutation.statModifiers.attackPower !== undefined) {
        stats.attackPower += mutation.statModifiers.attackPower;
      }
    }
  });

  stats.currentHp = Math.max(1, stats.currentHp);
  stats.maxHp = Math.max(1, stats.maxHp);
  stats.speed = Math.max(1, stats.speed);
  stats.attackPower = Math.max(0, stats.attackPower);

  const attacks = species.attacks.map((attack) => {
    const modifiedAttack = { ...attack };

    mutations.forEach((mutationId) => {
      const mutation = MUTATIONS_BY_ID[mutationId];
      if (!mutation?.attackModifiers) return;

      mutation.attackModifiers.forEach((modifier) => {
        if (modifier.attackId === "*" || modifier.attackId === attack.id) {
          if (modifier.cooldownModifier !== undefined) {
            modifiedAttack.baseCooldown = Math.max(
              1,
              modifiedAttack.baseCooldown + modifier.cooldownModifier,
            );
          }
          if (modifier.damageModifier !== undefined) {
            modifiedAttack.damageMultiplier += modifier.damageModifier;
          }
        }
      });
    });

    return modifiedAttack;
  });

  const attackTimers: AttackTimer[] = attacks.map((attack) => ({
    attackId: attack.id,
    currentCooldown: attack.baseCooldown,
  }));

  const geneticPotential = genome?.potential || generateGeneticPotential();
  const age = 0; // All new units start at age 0
  const lifeStage = getLifeStage(age);

  return {
    id: `unit_${unitIdCounter++}`,
    speciesId: species.id,
    stats,
    attacks,
    attackTimers,
    position,
    mutations,
    level: 1,
    xp: 0,
    age,
    lifeStage,
    geneticPotential,
    equipment: [],
    cooldownReduction: 0,
  };
}

export function isAlive(unit: Unit): boolean {
  return unit.stats.currentHp > 0;
}

export function takeDamage(unit: Unit, damage: number): Unit {
  return {
    ...unit,
    stats: {
      ...unit.stats,
      currentHp: Math.max(0, unit.stats.currentHp - damage),
    },
  };
}

export function getAttackById(unit: Unit, attackId: string) {
  return unit.attacks.find((a) => a.id === attackId);
}

// Age a unit by a certain number of days
export function ageUnit(unit: Unit, days: number): Unit {
  const newAge = unit.age + days;
  const newLifeStage = getLifeStage(newAge);

  // Elderly units get -20% stats
  let statMultiplier = 1.0;
  if (newLifeStage === LifeStage.Elderly && unit.lifeStage !== LifeStage.Elderly) {
    statMultiplier = 0.8;
  }

  return {
    ...unit,
    age: newAge,
    lifeStage: newLifeStage,
    stats:
      statMultiplier !== 1.0
        ? {
            ...unit.stats,
            maxHp: Math.floor(unit.stats.maxHp * statMultiplier),
            speed: Math.floor(unit.stats.speed * statMultiplier),
            attackPower: Math.floor(unit.stats.attackPower * statMultiplier),
            currentHp: Math.min(
              unit.stats.currentHp,
              Math.floor(unit.stats.maxHp * statMultiplier),
            ),
          }
        : unit.stats,
  };
}

// Gain XP and potentially level up
export function gainExperience(unit: Unit, amount: number): Unit {
  const newXp = unit.xp + amount;
  const xpPerLevel = 100; // Linear progression
  const newLevel = Math.floor(newXp / xpPerLevel) + 1;
  const levelsGained = newLevel - unit.level;

  if (levelsGained === 0) {
    return { ...unit, xp: newXp };
  }

  // Apply stat growth for each level gained
  const maxHpGrowth = getStatGrowthPerLevel(unit.geneticPotential.maxHp) * levelsGained;
  const speedGrowth = getStatGrowthPerLevel(unit.geneticPotential.speed) * levelsGained;
  const attackPowerGrowth = getStatGrowthPerLevel(unit.geneticPotential.attackPower) * levelsGained;

  return {
    ...unit,
    level: newLevel,
    xp: newXp,
    stats: {
      ...unit.stats,
      maxHp: unit.stats.maxHp + maxHpGrowth,
      currentHp: unit.stats.currentHp + maxHpGrowth, // Heal on level up
      speed: unit.stats.speed + speedGrowth,
      attackPower: unit.stats.attackPower + attackPowerGrowth,
    },
  };
}

// Check if unit can breed (Adult or Elderly)
export function canBreed(unit: Unit): boolean {
  return unit.lifeStage === LifeStage.Adult || unit.lifeStage === LifeStage.Elderly;
}

// Recalculate unit stats based on current mutations (used when adding genetic mods)
export function recalculateStatsFromMutations(unit: Unit, species: Species): Unit {
  // Start with base species stats
  let maxHp = species.baseStats.maxHp;
  let speed = species.baseStats.speed;
  let attackPower = species.baseStats.attackPower;

  // Apply all mutations
  unit.mutations.forEach((mutationId) => {
    const mutation = MUTATIONS_BY_ID[mutationId];
    if (!mutation) return;

    if (mutation.statModifiers) {
      if (mutation.statModifiers.maxHp !== undefined) {
        maxHp += mutation.statModifiers.maxHp;
      }
      if (mutation.statModifiers.speed !== undefined) {
        speed += mutation.statModifiers.speed;
      }
      if (mutation.statModifiers.attackPower !== undefined) {
        attackPower += mutation.statModifiers.attackPower;
      }
    }
  });

  // Apply level-based growth
  const levelsGained = unit.level - 1;
  if (levelsGained > 0) {
    maxHp += getStatGrowthPerLevel(unit.geneticPotential.maxHp) * levelsGained;
    speed += getStatGrowthPerLevel(unit.geneticPotential.speed) * levelsGained;
    attackPower += getStatGrowthPerLevel(unit.geneticPotential.attackPower) * levelsGained;
  }

  // Apply elderly penalty if applicable
  if (unit.lifeStage === LifeStage.Elderly) {
    maxHp = Math.floor(maxHp * 0.8);
    speed = Math.floor(speed * 0.8);
    attackPower = Math.floor(attackPower * 0.8);
  }

  // Ensure minimums
  maxHp = Math.max(1, maxHp);
  speed = Math.max(1, speed);
  attackPower = Math.max(0, attackPower);

  // Preserve current HP ratio
  const hpRatio = unit.stats.currentHp / unit.stats.maxHp;
  const newCurrentHp = Math.min(maxHp, Math.floor(maxHp * hpRatio));

  return {
    ...unit,
    stats: {
      ...unit.stats,
      maxHp,
      currentHp: newCurrentHp,
      speed,
      attackPower,
    },
  };
}
