import type { EquipmentItem, ShopItem, Unit } from "./types";
import { EquipmentEffect, ItemCategory } from "./types";

// Combat state for equipment effects (resets each combat)
export interface CombatEffectState {
  unitId: string;
  firstAttackBlocked: boolean; // Bubble Shield - used once
  dodgesRemaining: number; // Mind Reader - one per combat
}

// Check if unit has specific equipment
export function hasEquipment(unit: Unit, itemId: string): boolean {
  return unit.equipment.includes(itemId);
}

// Get all equipment effects for a unit
export function getEquipmentEffects(unit: Unit, allItems: ShopItem[]): EquipmentItem[] {
  if (!unit.equipment || unit.equipment.length === 0) {
    return [];
  }

  return unit.equipment
    .map((itemId) => allItems.find((item) => item.id === itemId))
    .filter(
      (item): item is EquipmentItem =>
        item !== undefined && item.category === ItemCategory.Equipment,
    );
}

// Apply speed boosts from equipment to unit stats
export function applySpeedBoosts(unit: Unit, allItems: ShopItem[]): Unit {
  const equipment = getEquipmentEffects(unit, allItems);
  let speedBoost = 0;

  for (const item of equipment) {
    if (item.effect.type === EquipmentEffect.InitiativeBoost && "amount" in item.effect) {
      speedBoost += item.effect.amount;
    }
  }

  if (speedBoost === 0) return unit;

  return {
    ...unit,
    stats: {
      ...unit.stats,
      speed: unit.stats.speed + speedBoost,
    },
  };
}

// Apply cooldown reductions from equipment
export function applyCooldownReductions(unit: Unit, allItems: ShopItem[]): Unit {
  const equipment = getEquipmentEffects(unit, allItems);
  let cooldownReduction = 0;

  for (const item of equipment) {
    // Check for Haste Serum or similar items
    const effect = (item as any).effect;
    if (effect?.type === "reduce_cooldowns") {
      cooldownReduction += effect.amount || 0;
    }
  }

  if (cooldownReduction === 0) return unit;

  return {
    ...unit,
    attacks: unit.attacks.map((attack) => ({
      ...attack,
      baseCooldown: Math.max(1, attack.baseCooldown - cooldownReduction),
    })),
  };
}

// Check if attack should be blocked (Bubble Shield)
export function shouldBlockAttack(
  defender: Unit,
  allItems: ShopItem[],
  effectState: CombatEffectState,
): boolean {
  if (effectState.firstAttackBlocked) {
    return false; // Already used this combat
  }

  const equipment = getEquipmentEffects(defender, allItems);
  const hasBubbleShield = equipment.some(
    (item) => item.effect.type === EquipmentEffect.BlockFirstAttack,
  );

  return hasBubbleShield;
}

// Check if attack should be dodged (Mind Reader)
export function shouldDodgeAttack(
  defender: Unit,
  allItems: ShopItem[],
  effectState: CombatEffectState,
): boolean {
  if (effectState.dodgesRemaining <= 0) {
    return false;
  }

  const equipment = getEquipmentEffects(defender, allItems);
  const hasMindReader = equipment.some((item) => item.effect.type === EquipmentEffect.PerfectDodge);

  return hasMindReader;
}

// Apply damage reduction from equipment
export function applyDamageReduction(
  damage: number,
  _defender: Unit,
  allSquad: Unit[],
  allItems: ShopItem[],
): number {
  let finalDamage = damage;

  // Check all squad members for team-wide effects
  for (const squadMember of allSquad) {
    const equipment = getEquipmentEffects(squadMember, allItems);

    for (const item of equipment) {
      if (item.effect.type === EquipmentEffect.TeamDamageReduction && "percent" in item.effect) {
        const reduction = item.effect.percent / 100;
        finalDamage = finalDamage * (1 - reduction);
      }
    }
  }

  return Math.floor(finalDamage);
}

// Calculate retaliation damage when hit (Spike Armor)
export function calculateRetaliationDamage(defender: Unit, allItems: ShopItem[]): number {
  const equipment = getEquipmentEffects(defender, allItems);
  let retaliationDamage = 0;

  for (const item of equipment) {
    if (item.effect.type === EquipmentEffect.RetaliationSpikes && "damage" in item.effect) {
      retaliationDamage += item.effect.damage;
    }
  }

  return retaliationDamage;
}

// Check if attack should be redirected (Enemy Confuser)
export function shouldRedirectAttack(attacker: Unit, allItems: ShopItem[]): boolean {
  const equipment = getEquipmentEffects(attacker, allItems);

  for (const item of equipment) {
    if (item.effect.type === EquipmentEffect.AttackRedirect && "chance" in item.effect) {
      return Math.random() < item.effect.chance;
    }
  }

  return false;
}

// Initialize combat effect state for all units
export function initializeCombatEffectStates(units: Unit[]): CombatEffectState[] {
  return units.map((unit) => ({
    unitId: unit.id,
    firstAttackBlocked: false,
    dodgesRemaining: 1, // Mind Reader allows 1 dodge per combat
  }));
}

// Update effect state after blocking an attack
export function markAttackBlocked(
  states: CombatEffectState[],
  unitId: string,
): CombatEffectState[] {
  return states.map((state) =>
    state.unitId === unitId ? { ...state, firstAttackBlocked: true } : state,
  );
}

// Update effect state after dodging an attack
export function markAttackDodged(states: CombatEffectState[], unitId: string): CombatEffectState[] {
  return states.map((state) =>
    state.unitId === unitId
      ? { ...state, dodgesRemaining: Math.max(0, state.dodgesRemaining - 1) }
      : state,
  );
}
