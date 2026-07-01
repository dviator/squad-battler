import { useEffect, useRef } from "react";
import type { BattleState, Unit } from "@/core/types";
import type { Encounter } from "@/core/world";
import { BattleArena } from "@/web/components/BattleArena";
import { useBattleReplay } from "@/web/hooks/useBattleReplay";
import { useGameStore } from "@/web/store/gameStore";

type BattleContentProps = {
  battleState: BattleState;
  initialPlayerUnits: Unit[];
  initialEnemyUnits: Unit[];
  encounter: Encounter;
  afterBattleWin: () => void;
  afterBattleLoss: () => void;
};

function BattleContent({
  battleState,
  initialPlayerUnits,
  initialEnemyUnits,
  encounter,
  afterBattleWin,
  afterBattleLoss,
}: BattleContentProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const replay = useBattleReplay(battleState, initialPlayerUnits, initialEnemyUnits);
  const playerWon = battleState.winner === "player";

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col max-w-5xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-muted uppercase tracking-wider">Combat</div>
          <div className="text-sm font-semibold text-ink">
            {encounter.type.replace(/_/g, " ")} encounter
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (replay.speed === 1 ? replay.setSpeed(3) : replay.setSpeed(1))}
            className="text-xs px-2 py-1 rounded bg-panel-2 hover:bg-panel-2 text-muted
              border border-line transition-all"
          >
            {replay.speed === 1 ? "Fast" : "Normal"}
          </button>
          <button
            type="button"
            onClick={replay.skipToEnd}
            disabled={replay.isDone}
            className="text-xs px-2 py-1 rounded bg-panel-2 hover:bg-panel-2 text-muted
              border border-line transition-all disabled:opacity-40"
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
        unitTimerProgress={replay.unitTimerProgress}
      />

      {/* Event log */}
      <div className="mt-4 flex-1 flex flex-col min-h-0 w-full max-w-3xl mx-auto">
        <div className="text-xs text-muted uppercase tracking-wider mb-1">Battle Log</div>
        <div
          ref={logRef}
          className="flex-1 overflow-y-auto max-h-40 rounded-lg bg-paper border
            border-line p-3 font-mono text-xs text-muted space-y-0.5"
        >
          {replay.log.map((line, i) => {
            const logKey = `log-${i}`;
            return (
              <div
                key={logKey}
                className={`animate-fade-in leading-relaxed ${
                  line.includes("Victory")
                    ? "text-bio font-bold"
                    : line.includes("Defeat")
                      ? "text-danger font-bold"
                      : line.includes("fallen")
                        ? "text-danger"
                        : line.startsWith("  ")
                          ? "text-muted pl-2"
                          : "text-ink"
                }`}
              >
                {line}
              </div>
            );
          })}
          {!replay.isDone && <div className="text-muted animate-pulse">▋</div>}
        </div>
      </div>

      {/* Post-battle controls */}
      {replay.isDone && (
        <div className="mt-4 space-y-2 w-full max-w-md mx-auto">
          {playerWon ? (
            <>
              <div className="text-center text-bio font-bold text-lg">🏆 Victory!</div>
              <div className="text-center text-sm text-muted mb-2">
                +{encounter.goldReward}g
                {encounter.materialsReward > 0 && ` · +${encounter.materialsReward} 🔩`}
              </div>
              <button
                type="button"
                onClick={afterBattleWin}
                className="w-full py-3 rounded-xl bg-bio hover:bg-bio text-white
                  font-bold text-base transition-all"
              >
                Collect Rewards →
              </button>
            </>
          ) : (
            <>
              <div className="text-center text-danger font-bold text-lg">💔 Defeat</div>
              <div className="text-center text-sm text-muted mb-2">Your squad was wiped out.</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={afterBattleLoss}
                  className="py-2.5 rounded-xl bg-panel-2 hover:bg-panel-2 text-ink
                    font-semibold text-sm transition-all border border-line"
                >
                  Retreat (25% HP)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Re-run the battle from campaign view
                    afterBattleLoss();
                  }}
                  className="py-2.5 rounded-xl bg-danger/15 hover:bg-danger text-danger
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

export function BattleView() {
  const { battleCtx, afterBattleWin, afterBattleLoss } = useGameStore();
  if (!battleCtx) return null;
  return (
    <BattleContent
      battleState={battleCtx.battleState}
      initialPlayerUnits={battleCtx.initialPlayerUnits}
      initialEnemyUnits={battleCtx.initialEnemyUnits}
      encounter={battleCtx.encounter}
      afterBattleWin={afterBattleWin}
      afterBattleLoss={afterBattleLoss}
    />
  );
}
