import { useState } from "react";
import type { ShopItemDefinition } from "@/core/shop";
import { ItemRarity, SHOP_ITEMS } from "@/core/shop";
import type { ShopItem } from "@/core/types";
import { getCurrentEncounter } from "@/core/world";
import { ShopItemCard } from "@/web/components/ShopItemCard";
import { UnitPicker } from "@/web/components/UnitPicker";
import { useGameStore } from "@/web/store/gameStore";
import {
  getEncounterTypeColor,
  getEncounterTypeLabel,
  getSpeciesEmoji,
  getSpeciesName,
} from "@/web/utils/species";

function enrichItem(item: ShopItem): ShopItemDefinition {
  const def = SHOP_ITEMS.find((s) => s.id === item.id);
  return def ?? { ...item, rarity: ItemRarity.Common };
}

export function ShopView() {
  const { gameState, campaign, shopItems, shopPurchasedIds, buyItem, runBattle, goToCampaign } =
    useGameStore();

  const [pendingItem, setPendingItem] = useState<ShopItem | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);

  if (!gameState) return null;

  const encounter = campaign ? getCurrentEncounter(campaign) : null;
  const { gold } = gameState.currency;
  const squad = gameState.roster.squad;

  function handleBuy(item: ShopItem) {
    if (squad.length === 1) {
      // Only one unit — auto-select
      const result = buyItem(item, squad[0]!.id);
      if (!result.ok) setBuyError(result.error ?? "Purchase failed");
      return;
    }
    setPendingItem(item);
  }

  function handleSelectUnit(unitId: string) {
    if (!pendingItem) return;
    const result = buyItem(pendingItem, unitId);
    if (!result.ok) setBuyError(result.error ?? "Purchase failed");
    setPendingItem(null);
  }

  const enrichedItems = shopItems.map(enrichItem);

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">🏪 Shop</h2>
          <div className="text-xs text-zinc-500">Pre-battle supplies</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-amber-300 font-bold">🪙 {gold}g</span>
          <button
            type="button"
            onClick={goToCampaign}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Next encounter preview */}
      {encounter && (
        <div className="mb-4 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded font-semibold ${getEncounterTypeColor(encounter.type)}`}
              >
                {getEncounterTypeLabel(encounter.type)}
              </span>
              <span className="text-xs text-zinc-500">Next fight</span>
            </div>
            <div className="flex gap-2">
              {encounter.enemies.map((e) => (
                <span key={e.id} title={getSpeciesName(e.speciesId)}>
                  {getSpeciesEmoji(e.speciesId)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {buyError && (
        <div className="mb-3 p-2 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">
          {buyError}
          <button
            type="button"
            onClick={() => setBuyError(null)}
            className="ml-2 text-red-600 hover:text-red-400"
          >
            ×
          </button>
        </div>
      )}

      {/* Shop items */}
      <div className="flex-1 grid grid-cols-2 gap-2 mb-4">
        {enrichedItems.map((item) => (
          <ShopItemCard
            key={item.id}
            item={item}
            gold={gold}
            isPurchased={shopPurchasedIds.includes(item.id)}
            onBuy={handleBuy}
          />
        ))}
      </div>

      {/* Fight button */}
      <button
        type="button"
        onClick={() => encounter && runBattle()}
        disabled={!encounter || squad.length === 0}
        className="w-full py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white
          font-bold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ⚔️ Fight!
      </button>

      {/* Unit picker modal */}
      {pendingItem && (
        <UnitPicker
          units={squad}
          title={`Apply "${pendingItem.name}" to:`}
          onSelect={(unit) => handleSelectUnit(unit.id)}
          onCancel={() => setPendingItem(null)}
        />
      )}
    </div>
  );
}
