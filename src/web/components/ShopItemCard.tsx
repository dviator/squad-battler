import type { ShopItem } from "@/core/types";
import { ItemCategory } from "@/core/types";
import type { ShopItemDefinition } from "@/core/shop";
import {
  getItemCategoryColor,
  getItemRarityColor,
  getItemRarityLabel,
} from "@/web/utils/species";

interface ShopItemCardProps {
  item: ShopItemDefinition;
  gold: number;
  isPurchased: boolean;
  onBuy(item: ShopItem): void;
}

const CATEGORY_EMOJI: Record<ItemCategory, string> = {
  [ItemCategory.Consumable]: "🧪",
  [ItemCategory.GeneticMod]: "🧬",
  [ItemCategory.Equipment]: "⚙️",
};

const CATEGORY_LABEL: Record<ItemCategory, string> = {
  [ItemCategory.Consumable]: "Consumable",
  [ItemCategory.GeneticMod]: "Genetic Mod",
  [ItemCategory.Equipment]: "Equipment",
};

export function ShopItemCard({ item, gold, isPurchased, onBuy }: ShopItemCardProps) {
  const canAfford = gold >= item.cost;
  const disabled = !canAfford || isPurchased;

  const rarityBorder = getItemRarityColor(item);
  const categoryColor = getItemCategoryColor(item.category);
  const rarityLabel = getItemRarityLabel(item);

  return (
    <div
      className={`rounded-xl border-2 p-3 bg-zinc-900 flex flex-col gap-2
        transition-all ${rarityBorder}
        ${isPurchased ? "opacity-50" : ""}
        ${!canAfford && !isPurchased ? "opacity-70" : ""}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{CATEGORY_EMOJI[item.category]}</span>
          <div>
            <div className="text-sm font-bold text-zinc-100 leading-tight">{item.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-xs ${categoryColor}`}>{CATEGORY_LABEL[item.category]}</span>
              <span className="text-zinc-700 text-xs">·</span>
              <span className="text-xs text-zinc-500">{rarityLabel}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-amber-400 text-sm">🪙</span>
          <span className="text-amber-300 font-bold text-sm tabular-nums">{item.cost}</span>
        </div>
      </div>

      <p className="text-xs text-zinc-400 leading-snug">{item.description}</p>

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onBuy(item)}
        className={`w-full py-1.5 rounded-lg text-sm font-semibold transition-all
          ${
            isPurchased
              ? "bg-zinc-800 text-zinc-600 cursor-default"
              : !canAfford
                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                : "bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer"
          }
        `}
      >
        {isPurchased ? "Purchased" : !canAfford ? `Need ${item.cost - gold}g more` : "Buy"}
      </button>
    </div>
  );
}
