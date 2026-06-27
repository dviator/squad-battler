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

// Tint for the specimen-card art panel — a light wash a future portrait sits over.
const SPECIES_TINT: Record<string, string> = {
  bear: "bg-amber-100",
  eagle: "bg-sky-100",
  tiger: "bg-orange-100",
  goob: "bg-violet-100",
  heavy_goob: "bg-slate-200",
  mega_goob: "bg-red-100",
  mega_goob_boss: "bg-red-100",
};

export function getSpeciesTint(speciesId: string): string {
  return SPECIES_TINT[speciesId] ?? "bg-panel-2";
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
      return "text-accent";
    case LifeStage.Adult:
      return "text-bio";
    case LifeStage.Elderly:
      return "text-warning";
    case LifeStage.Dead:
      return "text-muted";
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
      return "text-muted bg-panel-2";
    case EncounterType.Elite:
      return "text-warning bg-warning/15";
    case EncounterType.MiniBoss:
      return "text-danger bg-danger/10";
    case EncounterType.Boss:
      return "text-danger bg-danger/20 font-bold";
  }
}

export function getItemCategoryColor(category: ItemCategory): string {
  switch (category) {
    case ItemCategory.Consumable:
      return "text-bio";
    case ItemCategory.GeneticMod:
      return "text-gene";
    case ItemCategory.Equipment:
      return "text-accent";
  }
}

export function getItemRarityColor(item: ShopItemDefinition): string {
  switch (item.rarity) {
    case ItemRarity.Common:
      return "border-line";
    case ItemRarity.Uncommon:
      return "border-bio";
    case ItemRarity.Rare:
      return "border-accent";
    case ItemRarity.VeryRare:
      return "border-gene";
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
  if (pct > 0.6) return "bg-bio";
  if (pct > 0.3) return "bg-warning";
  return "bg-danger";
}
