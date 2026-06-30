import type { Unit } from "@/core/types";

/** Returns the unit id to apply a shop item to, or null if the player must select one. */
export function resolveItemTarget(squad: Unit[], focusedUnitId: string | null): string | null {
  if (squad.length === 1) return squad[0]!.id;
  if (!focusedUnitId) return null;
  return squad.find((u) => u.id === focusedUnitId)?.id ?? null;
}
