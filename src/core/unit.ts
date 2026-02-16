import { Unit, Species, Position, AttackTimer, Genome } from "./types";
import { MUTATIONS_BY_ID } from "../data/mutations";

let unitIdCounter = 0;

export function createUnit(
  species: Species,
  position: Position,
  genome?: Partial<Genome>
): Unit {
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
    let modifiedAttack = { ...attack };

    mutations.forEach((mutationId) => {
      const mutation = MUTATIONS_BY_ID[mutationId];
      if (!mutation?.attackModifiers) return;

      mutation.attackModifiers.forEach((modifier) => {
        if (modifier.attackId === "*" || modifier.attackId === attack.id) {
          if (modifier.cooldownModifier !== undefined) {
            modifiedAttack.baseCooldown = Math.max(
              1,
              modifiedAttack.baseCooldown + modifier.cooldownModifier
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

  return {
    id: `unit_${unitIdCounter++}`,
    speciesId: species.id,
    stats,
    attacks,
    attackTimers,
    position,
    mutations,
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
