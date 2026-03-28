import { useEffect, useRef } from "react";
import { BattleArena } from "@/web/components/BattleArena";
import { useBattleReplay } from "@/web/hooks/useBattleReplay";
import { useGameStore } from "@/web/store/gameStore";

export function BattleView() {
  const { battleCtx, afterBattleWin, afterBattleLoss } = useGameStore();
  const logRef = useRef<HTMLDivElement>(null);

  if (!battleCtx) return null;

  const { battleState, initialPlayerUnits, initialEnemyUnits, encounter } = battleCtx;

  const replay = useBattleReplay(battleState, initialPlayerUnits, initialEnemyUnits);

  const playerWon = battleState.winner === "player";

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [replay.log]);

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Combat</div>
          <div className="text-sm font-semibold text-zinc-200">
            {encounter.type.replace(/_/g, " ")} encounter
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (replay.speed === 1 ? replay.setSpeed(3) : replay.setSpeed(1))}
            className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400
              border border-zinc-700 transition-all"
          >
            {replay.speed === 1 ? "Fast" : "Normal"}
          </button>
          <button
            type="button"
            onClick={replay.skipToEnd}
            disabled={replay.isDone}
            className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400
              border border-zinc-700 transition-all disabled:opacity-40"
          >
            Skip →
          </button>
        </div>
      </div>

      {/* Battle arena */}
      <BattleArena
        playerUnits={initialPlayerUnits}
        enemyUnits={initialEnemyUnits}
        unitHps={replay.unitHps}
        deadUnitIds={replay.deadUnitIds}
        activeAttackerId={replay.activeAttackerId}
        hitUnitIds={replay.hitUnitIds}
      />

      {/* Event log */}
      <div className="mt-4 flex-1 flex flex-col min-h-0">
        <div className="text-xs text-zinc-600 uppercase tracking-wider mb-1">Battle Log</div>
        <div
          ref={logRef}
          className="flex-1 overflow-y-auto max-h-40 rounded-lg bg-zinc-950 border
            border-zinc-800 p-3 font-mono text-xs text-zinc-400 space-y-0.5"
        >
          {replay.log.map((line, i) => (
            <div
              key={i}
              className={`animate-fade-in leading-relaxed ${
                line.includes("Victory")
                  ? "text-green-400 font-bold"
                  : line.includes("Defeat")
                    ? "text-red-400 font-bold"
                    : line.includes("fallen")
                      ? "text-red-500"
                      : line.startsWith("  ")
                        ? "text-zinc-600 pl-2"
                        : "text-zinc-300"
              }`}
            >
              {line}
            </div>
          ))}
          {!replay.isDone && <div className="text-zinc-700 animate-pulse">▋</div>}
        </div>
      </div>

      {/* Post-battle controls */}
      {replay.isDone && (
        <div className="mt-4 space-y-2">
          {playerWon ? (
            <>
              <div className="text-center text-green-400 font-bold text-lg">🏆 Victory!</div>
              <div className="text-center text-sm text-zinc-400 mb-2">
                +{encounter.goldReward}g
                {encounter.materialsReward > 0 && ` · +${encounter.materialsReward} 🔩`}
              </div>
              <button
                type="button"
                onClick={afterBattleWin}
                className="w-full py-3 rounded-xl bg-green-700 hover:bg-green-600 text-white
                  font-bold text-base transition-all"
              >
                Collect Rewards →
              </button>
            </>
          ) : (
            <>
              <div className="text-center text-red-400 font-bold text-lg">💔 Defeat</div>
              <div className="text-center text-sm text-zinc-500 mb-2">
                Your squad was wiped out.
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={afterBattleLoss}
                  className="py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300
                    font-semibold text-sm transition-all border border-zinc-700"
                >
                  Retreat (25% HP)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Re-run the battle from campaign view
                    afterBattleLoss();
                  }}
                  className="py-2.5 rounded-xl bg-red-900 hover:bg-red-800 text-red-200
                    font-semibold text-sm transition-all"
                >
                  Return to Camp
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
