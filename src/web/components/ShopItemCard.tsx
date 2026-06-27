import type { ShopItemDefinition } from "@/core/shop";
import type { ShopItem } from "@/core/types";
import { ItemCategory } from "@/core/types";
import { getItemCategoryColor, getItemRarityColor, getItemRarityLabel } from "@/web/utils/species";

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
      className={`rounded-xl border-2 p-3 bg-panel flex flex-col gap-2
        transition-all ${rarityBorder}
        ${isPurchased ? "opacity-50" : ""}
        ${!canAfford && !isPurchased ? "opacity-70" : ""}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{CATEGORY_EMOJI[item.category]}</span>
          <div>
            <div className="text-sm font-bold text-ink leading-tight">{item.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-xs ${categoryColor}`}>{CATEGORY_LABEL[item.category]}</span>
              <span className="text-muted text-xs">·</span>
              <span className="text-xs text-muted">{rarityLabel}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-warning text-sm">🪙</span>
          <span className="text-warning font-bold text-sm tabular-nums">{item.cost}</span>
        </div>
      </div>

      <p className="text-xs text-muted leading-snug flex-1">{item.description}</p>

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onBuy(item)}
        className={`mt-auto w-full py-1.5 rounded-lg text-sm font-semibold transition-all
          ${
            isPurchased
              ? "bg-panel-2 text-muted cursor-default"
              : !canAfford
                ? "bg-panel-2 text-muted cursor-not-allowed"
                : "bg-accent hover:bg-accent text-white cursor-pointer"
          }
        `}
      >
        {isPurchased ? "Purchased" : !canAfford ? `Need ${item.cost - gold}g more` : "Buy"}
      </button>
    </div>
  );
}
