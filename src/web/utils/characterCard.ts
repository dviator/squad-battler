import type { Unit } from "@/core/types";

export function getPrimaryAttackCooldown(unit: Unit): number {
  return unit.attacks[0]?.baseCooldown ?? 10;
}

export function getIdleTimerLabel(unit: Unit): string {
  return `~${getPrimaryAttackCooldown(unit)}t`;
}
