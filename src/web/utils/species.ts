import type { ShopItemDefinition } from "@/core/shop";
import { ItemRarity } from "@/core/shop";
import type { Unit } from "@/core/types";
import { ItemCategory, LifeStage } from "@/core/types";
import { EncounterType } from "@/core/world";
import { MUTATIONS_BY_ID } from "@/data/mutations";
import { SPECIES_BY_ID } from "@/data/species";

export const SPECIES_EMOJI: Record<string, string> = {
  bear: "🐻",
  eagle: "🦅",
  tiger: "🐯",
  goob: "👾",
  heavy_goob: "🫧",
  mega_goob: "💀",
  mega_goob_boss: "💀",
};

export function getSpeciesEmoji(speciesId: string): string {
  return SPECIES_EMOJI[speciesId] ?? "🔬";
}

export function getSpeciesName(speciesId: string): string {
  return SPECIES_BY_ID[speciesId]?.name ?? speciesId;
}

export function getUnitDisplayName(unit: Unit): string {
  return getSpeciesName(unit.speciesId);
}

export function getMutationName(mutationId: string): string {
  return MUTATIONS_BY_ID[mutationId]?.name ?? mutationId;
}

export function getLifeStageLabel(stage: LifeStage): string {
  switch (stage) {
    case LifeStage.Young:
      return "Young";
    case LifeStage.Adult:
      return "Adult";
    case LifeStage.Elderly:
      return "Elderly";
    case LifeStage.Dead:
      return "Dead";
  }
}

export function getLifeStageColor(stage: LifeStage): string {
  switch (stage) {
    case LifeStage.Young:
      return "text-cyan-400";
    case LifeStage.Adult:
      return "text-green-400";
    case LifeStage.Elderly:
      return "text-amber-400";
    case LifeStage.Dead:
      return "text-zinc-500";
  }
}

export function getEncounterTypeLabel(type: EncounterType): string {
  switch (type) {
    case EncounterType.Normal:
      return "Normal";
    case EncounterType.Elite:
      return "Elite";
    case EncounterType.MiniBoss:
      return "Mini-Boss";
    case EncounterType.Boss:
      return "BOSS";
  }
}

export function getEncounterTypeColor(type: EncounterType): string {
  switch (type) {
    case EncounterType.Normal:
      return "text-zinc-300 bg-zinc-700";
    case EncounterType.Elite:
      return "text-amber-300 bg-amber-900/50";
    case EncounterType.MiniBoss:
      return "text-orange-300 bg-orange-900/50";
    case EncounterType.Boss:
      return "text-red-300 bg-red-900/50";
  }
}

export function getItemCategoryColor(category: ItemCategory): string {
  switch (category) {
    case ItemCategory.Consumable:
      return "text-green-400";
    case ItemCategory.GeneticMod:
      return "text-purple-400";
    case ItemCategory.Equipment:
      return "text-cyan-400";
  }
}

export function getItemRarityColor(item: ShopItemDefinition): string {
  switch (item.rarity) {
    case ItemRarity.Common:
      return "border-zinc-600";
    case ItemRarity.Uncommon:
      return "border-green-700";
    case ItemRarity.Rare:
      return "border-blue-600";
    case ItemRarity.VeryRare:
      return "border-purple-600";
  }
}

export function getItemRarityLabel(item: ShopItemDefinition): string {
  switch (item.rarity) {
    case ItemRarity.Common:
      return "Common";
    case ItemRarity.Uncommon:
      return "Uncommon";
    case ItemRarity.Rare:
      return "Rare";
    case ItemRarity.VeryRare:
      return "Very Rare";
  }
}

export function getHpColor(pct: number): string {
  if (pct > 0.6) return "bg-green-500";
  if (pct > 0.3) return "bg-amber-500";
  return "bg-red-500";
}
