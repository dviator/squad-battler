import { getCurrentEncounter } from "@/core/world";
import { UnitCard } from "@/web/components/UnitCard";
import { useGameStore } from "@/web/store/gameStore";
import {
  getEncounterTypeColor,
  getEncounterTypeLabel,
  getSpeciesEmoji,
  getSpeciesName,
} from "@/web/utils/species";

export function CampaignView() {
  const { gameState, campaign, goToShop, goToLab, runBattle } = useGameStore();

  if (!gameState || !campaign) return null;

  const encounter = getCurrentEncounter(campaign);
  const world = campaign.worlds[campaign.currentWorldIndex];
  const level = world?.levels[campaign.currentLevelIndex];

  const { gold, materials } = gameState.currency;
  const { encountersCompleted } = gameState.progress;
  const timeDay = Math.floor(gameState.timeElapsed);
  const timeHour = Math.round((gameState.timeElapsed - timeDay) * 24);

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">{world?.name}</div>
          <div className="text-sm font-semibold text-zinc-200">{level?.name}</div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-amber-300">
            🪙 {gold}
            <span className="text-zinc-600 ml-0.5">g</span>
          </span>
          <span className="text-teal-300">
            🔩 {materials}
          </span>
          <span className="text-zinc-500 text-xs">
            Day {timeDay + 1}, {timeHour}h
          </span>
        </div>
      </div>

      {/* Encounter info */}
      {encounter ? (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded font-semibold ${getEncounterTypeColor(encounter.type)}`}
              >
                {getEncounterTypeLabel(encounter.type)}
              </span>
              <span className="text-xs text-zinc-500">
                #{encountersCompleted + 1}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-amber-300">+{encounter.goldReward}g</span>
              {encounter.materialsReward > 0 && (
                <span className="text-teal-300">+{encounter.materialsReward} 🔩</span>
              )}
            </div>
          </div>

          <div className="text-xs text-zinc-500 mb-2">Enemies:</div>
          <div className="flex gap-3">
            {encounter.enemies.map((enemy) => (
              <div key={enemy.id} className="flex items-center gap-1.5">
                <span className="text-xl">{getSpeciesEmoji(enemy.speciesId)}</span>
                <div className="text-xs">
                  <div className="text-zinc-300">{getSpeciesName(enemy.speciesId)}</div>
                  <div className="text-zinc-600">
                    {Math.floor(enemy.stats.maxHp * 0.5)} HP
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 mb-4 text-center">
          <div className="text-green-400 font-bold">🏆 Level Complete!</div>
          <div className="text-zinc-400 text-sm mt-1">All encounters cleared.</div>
        </div>
      )}

      {/* Squad */}
      <div className="mb-4">
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Your Squad</div>
        <div className="grid grid-cols-3 gap-2">
          {gameState.roster.squad.map((unit) => (
            <UnitCard key={unit.id} unit={unit} />
          ))}
          {gameState.roster.squad.length === 0 && (
            <div className="col-span-3 text-center text-zinc-600 text-sm py-4">
              No units in squad
            </div>
          )}
        </div>
      </div>

      {/* Healing slots info */}
      {gameState.roster.healing.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
          <div className="text-xs text-zinc-500 mb-1">In healing:</div>
          <div className="flex gap-2 flex-wrap">
            {gameState.roster.healing.map((slot) => {
              const unit =
                gameState.roster.squad.find((u) => u.id === slot.unitId) ??
                gameState.roster.stable.find((u) => u.id === slot.unitId);
              return (
                <span key={slot.unitId} className="text-xs text-green-400">
                  {unit ? getSpeciesName(unit.speciesId) : "?"}{" "}
                  ({slot.daysRemaining <= 0 ? "Ready!" : `${slot.daysRemaining.toFixed(1)}d`})
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Breeding slots info */}
      {gameState.roster.breeding.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
          <div className="text-xs text-zinc-500 mb-1">Breeding:</div>
          {gameState.roster.breeding.map((slot, i) => (
            <span key={i} className="text-xs text-purple-400">
              {slot.daysRemaining <= 0 ? "🥚 Ready to collect!" : `${slot.daysRemaining.toFixed(1)}d remaining`}
            </span>
          ))}
        </div>
      )}

      {/* Unlocked stations */}
      <div className="mb-4 text-xs text-zinc-600">
        <span>Stations: </span>
        {gameState.unlockedStations.map((s) => (
          <span key={s} className="mr-2 capitalize">
            {s}
          </span>
        ))}
      </div>

      {/* Action buttons */}
      <div className="mt-auto flex flex-col gap-2">
        <button
          type="button"
          onClick={() => encounter && runBattle()}
          disabled={!encounter || gameState.roster.squad.length === 0}
          className="w-full py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white
            font-bold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ⚔️ Fight!
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={goToShop}
            className="py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200
              font-semibold text-sm transition-all border border-zinc-700"
          >
            🏪 Shop
          </button>
          <button
            type="button"
            onClick={goToLab}
            className="py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200
              font-semibold text-sm transition-all border border-zinc-700"
          >
            🧪 Lab
          </button>
        </div>
      </div>
    </div>
  );
}
