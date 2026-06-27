import { useEffect, useState } from "react";
import { useGameStore } from "@/web/store/gameStore";

export function MainMenuView() {
  const { startNewGame, loadSave } = useGameStore();
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    setHasSave(localStorage.getItem("squad-battler-v1") !== null);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">🔬</div>
        <h1 className="text-4xl font-bold text-accent tracking-tight mb-2">Squad Battler</h1>
        <p className="text-muted text-sm max-w-xs mx-auto leading-relaxed">
          Breed creatures, combine genetics, and battle your way out of the corporate science lab.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {hasSave && (
          <button
            type="button"
            onClick={() => loadSave()}
            className="w-full py-3 rounded-xl bg-accent hover:bg-accent text-white
              font-bold text-base transition-all shadow-lg"
          >
            Continue Run
          </button>
        )}
        <button
          type="button"
          onClick={startNewGame}
          className={`w-full py-3 rounded-xl font-bold text-base transition-all shadow-lg
            ${
              hasSave
                ? "bg-panel-2 hover:bg-panel-2 text-ink border border-line"
                : "bg-accent hover:bg-accent text-white"
            }
          `}
        >
          New Run
        </button>
      </div>

      <div className="mt-12 text-center text-xs text-muted max-w-xs">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-2xl mb-1">🐻🦅🐯</div>
            <div>Bear · Eagle · Tiger</div>
          </div>
          <div>
            <div className="text-2xl mb-1">🧬</div>
            <div>Breed & mutate</div>
          </div>
          <div>
            <div className="text-2xl mb-1">👾</div>
            <div>Escape the lab</div>
          </div>
        </div>
      </div>
    </div>
  );
}
