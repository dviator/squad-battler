import { useState } from "react";
import type { ShopItemDefinition } from "@/core/shop";
import { ItemRarity, SHOP_ITEMS } from "@/core/shop";
import type { ShopItem } from "@/core/types";
import { getCurrentEncounter } from "@/core/world";
import { ShopItemCard } from "@/web/components/ShopItemCard";
import { SquadFrame } from "@/web/components/SquadFrame";
import { useGameStore } from "@/web/store/gameStore";
import { resolveItemTarget } from "@/web/utils/shopFlow";
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
  const [focusedUnitId, setFocusedUnitId] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);

  if (!gameState) return null;

  const encounter = campaign ? getCurrentEncounter(campaign) : null;
  const { gold } = gameState.currency;
  const squad = gameState.roster.squad;

  function handleUnitClick(unitId: string) {
    if (pendingItem) {
      // Apply the pending item to the tapped unit immediately.
      const result = buyItem(pendingItem, unitId);
      if (!result.ok) {
        setBuyError(result.error ?? "Purchase failed");
      } else {
        setBuyError(null);
        setFocusedUnitId(unitId);
      }
      setPendingItem(null);
      return;
    }
    // Toggle focus: tap same unit to deselect, tap different unit to focus.
    setFocusedUnitId((prev) => (prev === unitId ? null : unitId));
    setBuyError(null);
  }

  function handleBuy(item: ShopItem) {
    const target = resolveItemTarget(squad, focusedUnitId);
    if (target !== null) {
      const result = buyItem(item, target);
      if (!result.ok) setBuyError(result.error ?? "Purchase failed");
      else setBuyError(null);
      return;
    }
    // No unit pre-selected and squad has multiple units — prompt the player.
    setPendingItem(item);
    setBuyError(null);
  }

  const enrichedItems = shopItems.map(enrichItem);

  const squadStatusLine = pendingItem
    ? `Tap a card to apply "${pendingItem.name}"`
    : focusedUnitId
      ? "Tap an item to apply it to this unit · tap card again to deselect"
      : squad.length > 1
        ? "Tap a card to target a unit for item purchases"
        : null;

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-ink">🏪 Resupply</h2>
          <div className="text-xs text-muted">Spend your winnings before the next node</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-warning font-bold">🪙 {gold}g</span>
          <button
            type="button"
            onClick={goToCampaign}
            className="text-xs text-muted hover:text-ink transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Persistent squad frame — the shop is the squad screen */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            Your Squad
          </span>
          {pendingItem && (
            <button
              type="button"
              onClick={() => setPendingItem(null)}
              className="text-xs text-muted hover:text-ink transition-colors"
            >
              ✕ Cancel
            </button>
          )}
        </div>

        <SquadFrame
          units={squad}
          orientation="horizontal"
          selectedUnitId={focusedUnitId}
          onUnitClick={handleUnitClick}
          highlightAll={!!pendingItem}
        />

        {squadStatusLine && <div className="mt-1.5 text-[10px] text-muted">{squadStatusLine}</div>}
      </div>

      {/* Error message */}
      {buyError && (
        <div className="mb-3 p-2 rounded-lg bg-danger/15 border border-danger/60 text-danger text-sm flex items-center justify-between">
          <span>{buyError}</span>
          <button type="button" onClick={() => setBuyError(null)} className="ml-2 text-danger">
            ×
          </button>
        </div>
      )}

      {/* Shop items */}
      <div className="flex-1 grid grid-cols-2 auto-rows-min gap-3 content-start mb-4">
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

      {/* Next encounter preview + fight button */}
      {encounter && (
        <div className="mb-3 p-3 rounded-lg bg-panel border border-line">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`text-xs px-2 py-0.5 rounded font-semibold shrink-0 ${getEncounterTypeColor(encounter.type)}`}
              >
                {getEncounterTypeLabel(encounter.type)}
              </span>
              <span className="text-xs text-muted truncate">Next fight</span>
            </div>
            <div className="flex gap-2 shrink-0">
              {encounter.enemies.map((e) => (
                <span key={e.id} title={getSpeciesName(e.speciesId)}>
                  {getSpeciesEmoji(e.speciesId)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => encounter && runBattle()}
        disabled={!encounter || squad.length === 0}
        className="w-full py-3 rounded-xl bg-danger hover:bg-danger text-white
          font-bold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ⚔️ Fight!
      </button>
    </div>
  );
}
