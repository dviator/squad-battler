import { useState } from "react";
import { isBreedingComplete, isHealingComplete } from "@/core/lab";
import { LifeStage } from "@/core/types";
import { ALL_SPECIES } from "@/data/species";
import { UnitCard } from "@/web/components/UnitCard";
import { getScannerUpgradeCost, SCANNER_MAX_CAPACITY, useGameStore } from "@/web/store/gameStore";
import { getSpeciesName } from "@/web/utils/species";

type LabTab = "heal" | "breed" | "recruit" | "squad" | "scanner";

export function LabView() {
  const {
    gameState,
    goToCampaign,
    sendToHealing,
    collectHealed,
    advanceGameTime,
    recruitUnit,
    startBreeding,
    collectOffspring,
    swapSquadMember,
    upgradeScannerCapacity,
    revealGene,
  } = useGameStore();

  const [tab, setTab] = useState<LabTab>("heal");
  const [breedParent1, setBreedParent1] = useState<string | null>(null);
  const [breedParent2, setBreedParent2] = useState<string | null>(null);
  const [scansRemaining, setScansRemaining] = useState<number | null>(null);

  if (!gameState) return null;

  const { roster, unlockedStations, scannerCapacity, scrapTech } = gameState;
  const allUnits = [...roster.squad, ...roster.stable];
  const healingUnitIds = new Set(roster.healing.map((s) => s.unitId));
  const breedingUnitIds = new Set([
    ...roster.breeding.map((s) => s.parent1Id),
    ...roster.breeding.map((s) => s.parent2Id),
  ]);

  const effectiveScansRemaining = scansRemaining ?? scannerCapacity;

  function handleTabChange(newTab: LabTab) {
    setTab(newTab);
    if (newTab === "scanner") {
      setScansRemaining(scannerCapacity);
    }
  }

  const availableForHealing = allUnits.filter(
    (u) =>
      u.stats.currentHp < u.stats.maxHp &&
      !healingUnitIds.has(u.id) &&
      !breedingUnitIds.has(u.id) &&
      u.lifeStage !== LifeStage.Dead,
  );

  const breedEligible = allUnits.filter(
    (u) =>
      (u.lifeStage === LifeStage.Adult || u.lifeStage === LifeStage.Elderly) &&
      !healingUnitIds.has(u.id) &&
      !breedingUnitIds.has(u.id),
  );

  const stableUnits = roster.stable.filter(
    (u) => !healingUnitIds.has(u.id) && !breedingUnitIds.has(u.id),
  );

  const upgradeCost = getScannerUpgradeCost(scannerCapacity);

  const TABS: { id: LabTab; label: string; unlocked: boolean }[] = [
    { id: "heal", label: "🩹 Heal", unlocked: unlockedStations.includes("healing") },
    { id: "breed", label: "🧬 Breed", unlocked: unlockedStations.includes("breeding") },
    { id: "recruit", label: "📋 Recruit", unlocked: unlockedStations.includes("recruiting") },
    { id: "squad", label: "🔄 Squad", unlocked: true },
    { id: "scanner", label: "🔬 Scanner", unlocked: scannerCapacity > 0 },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-ink">🧪 Lab</h2>
          <div className="text-xs text-muted">Manage your roster</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-accent text-xs font-semibold">⚙️ {scrapTech} ST</span>
          <button
            type="button"
            onClick={goToCampaign}
            className="text-xs text-muted hover:text-ink transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Time advance */}
      <div className="mb-4 p-3 rounded-lg bg-panel border border-line flex items-center justify-between">
        <div>
          <div className="text-xs text-muted">Advance time to complete operations</div>
          <div className="text-xs text-muted mt-0.5">
            Day {Math.floor(gameState.timeElapsed + 1)},{" "}
            {Math.round((gameState.timeElapsed % 1) * 24)}h elapsed
          </div>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => advanceGameTime(6)}
            className="text-xs px-2 py-1.5 rounded bg-panel-2 hover:bg-panel-2
              text-ink border border-line transition-all"
          >
            +6h
          </button>
          <button
            type="button"
            onClick={() => advanceGameTime(24)}
            className="text-xs px-2 py-1.5 rounded bg-panel-2 hover:bg-panel-2
              text-ink border border-line transition-all"
          >
            +1d
          </button>
          <button
            type="button"
            onClick={() => advanceGameTime(72)}
            className="text-xs px-2 py-1.5 rounded bg-panel-2 hover:bg-panel-2
              text-ink border border-line transition-all"
          >
            +3d
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-panel p-1 rounded-lg border border-line">
        {TABS.filter((t) => t.unlocked).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleTabChange(t.id)}
            className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${
              tab === t.id ? "bg-panel-2 text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Heal tab */}
      {tab === "heal" && (
        <div className="flex flex-col gap-3">
          {roster.healing.length > 0 && (
            <div>
              <div className="text-xs text-muted uppercase tracking-wider mb-2">In progress</div>
              {roster.healing.map((slot) => {
                const unit = allUnits.find((u) => u.id === slot.unitId);
                const complete = isHealingComplete(slot);
                return (
                  <div
                    key={slot.unitId}
                    className="flex items-center justify-between p-3 rounded-lg
                      bg-panel border border-line mb-2"
                  >
                    <div>
                      <div className="text-sm text-ink">
                        {unit ? getSpeciesName(unit.speciesId) : "?"}
                      </div>
                      <div className="text-xs text-muted">
                        {complete
                          ? "Ready to collect!"
                          : `${slot.daysRemaining.toFixed(1)} days remaining`}
                      </div>
                    </div>
                    {complete && (
                      <button
                        type="button"
                        onClick={() => collectHealed(slot.unitId)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-bio hover:bg-bio
                          text-white font-semibold transition-all"
                      >
                        Collect ✓
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {availableForHealing.length > 0 ? (
            <div>
              <div className="text-xs text-muted uppercase tracking-wider mb-2">
                Send to heal (100 HP/day)
              </div>
              <div className="grid grid-cols-2 gap-2">
                {availableForHealing.map((unit) => (
                  <div key={unit.id} className="relative">
                    <UnitCard unit={unit} compact />
                    <button
                      type="button"
                      onClick={() => sendToHealing(unit.id)}
                      className="mt-1.5 w-full text-xs py-1 rounded-lg bg-bio/15 hover:bg-bio
                        text-bio transition-all"
                    >
                      Send to heal
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            availableForHealing.length === 0 &&
            roster.healing.length === 0 && (
              <div className="text-center text-muted text-sm py-8">All units are at full HP</div>
            )
          )}
        </div>
      )}

      {/* Breed tab */}
      {tab === "breed" && (
        <div className="flex flex-col gap-3">
          {roster.breeding.length > 0 && (
            <div>
              <div className="text-xs text-muted uppercase tracking-wider mb-2">In progress</div>
              {roster.breeding.map((slot, i) => {
                const complete = isBreedingComplete(slot);
                const offspringSpecies = slot.offspringGenome?.speciesId;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg
                      bg-panel border border-line mb-2"
                  >
                    <div>
                      <div className="text-sm text-ink">
                        🥚 Offspring
                        {offspringSpecies && (
                          <span className="text-muted text-xs ml-1">
                            ({getSpeciesName(offspringSpecies)})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted">
                        {complete ? "Ready!" : `${slot.daysRemaining.toFixed(1)} days remaining`}
                      </div>
                    </div>
                    {complete && offspringSpecies && (
                      <button
                        type="button"
                        onClick={() => collectOffspring(offspringSpecies)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gene hover:bg-gene
                          text-white font-semibold transition-all"
                      >
                        Collect 🥚
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {roster.breeding.length === 0 && (
            <div>
              <div className="text-xs text-muted uppercase tracking-wider mb-2">
                Select two parents (Adult or Elderly)
              </div>
              {breedEligible.length < 2 ? (
                <div className="text-center text-muted text-sm py-8">
                  Need at least 2 Adult/Elderly units to breed.
                  <br />
                  <span className="text-xs">Units must be 7+ days old.</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {breedEligible.map((unit) => {
                      const isP1 = breedParent1 === unit.id;
                      const isP2 = breedParent2 === unit.id;
                      return (
                        <div key={unit.id}>
                          <UnitCard
                            unit={unit}
                            compact
                            isSelected={isP1 || isP2}
                            onClick={() => {
                              if (isP1) {
                                setBreedParent1(null);
                              } else if (isP2) {
                                setBreedParent2(null);
                              } else if (!breedParent1) {
                                setBreedParent1(unit.id);
                              } else if (!breedParent2 && breedParent1 !== unit.id) {
                                setBreedParent2(unit.id);
                              }
                            }}
                          />
                          {(isP1 || isP2) && (
                            <div className="text-center text-xs text-gene mt-0.5">
                              Parent {isP1 ? "1" : "2"}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    disabled={!breedParent1 || !breedParent2}
                    onClick={() => {
                      if (breedParent1 && breedParent2) {
                        startBreeding(breedParent1, breedParent2);
                        setBreedParent1(null);
                        setBreedParent2(null);
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-gene hover:bg-gene text-white
                      font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Start Breeding (3 days)
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recruit tab */}
      {tab === "recruit" && (
        <div className="flex flex-col gap-3">
          <div className="text-xs text-muted mb-2">
            Recruit a new level 1 unit with random genetics.
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ALL_SPECIES.filter((s) => gameState.unlockedSpecies.includes(s.id)).map((species) => (
              <button
                key={species.id}
                type="button"
                onClick={() => recruitUnit(species.id)}
                className="p-3 rounded-xl border border-line bg-panel hover:border-accent/40
                  hover:bg-panel-2 transition-all text-left"
              >
                <div className="text-xl mb-1">
                  {species.id === "bear" ? "🐻" : species.id === "eagle" ? "🦅" : "🐯"}
                </div>
                <div className="text-sm font-bold text-ink">{species.name}</div>
                <div className="text-xs text-muted mt-0.5">{species.description}</div>
                <div className="text-xs text-muted mt-1">
                  HP:{species.baseStats.maxHp} SPD:{species.baseStats.speed} ATK:
                  {species.baseStats.attackPower}
                </div>
              </button>
            ))}
          </div>
          <div className="text-center text-xs text-muted mt-2">New units are added to stable</div>
        </div>
      )}

      {/* Squad management tab */}
      {tab === "squad" && (
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-xs text-muted uppercase tracking-wider mb-2">
              Active Squad (max 3)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {roster.squad.map((unit, idx) => (
                <div key={unit.id}>
                  <UnitCard unit={unit} compact />
                  <div className="text-center text-xs text-muted mt-0.5">Slot {idx + 1}</div>
                </div>
              ))}
            </div>
          </div>

          {stableUnits.length > 0 && (
            <div>
              <div className="text-xs text-muted uppercase tracking-wider mb-2">
                Stable — tap to swap into squad
              </div>
              <div className="grid grid-cols-2 gap-2">
                {stableUnits.map((unit) => (
                  <div key={unit.id} className="flex flex-col gap-1">
                    <UnitCard unit={unit} compact />
                    <div className="flex gap-1">
                      {roster.squad.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => swapSquadMember(idx, unit.id)}
                          className="flex-1 text-xs py-1 rounded bg-panel-2 hover:bg-panel-2
                            text-muted border border-line transition-all"
                        >
                          →{idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stableUnits.length === 0 && roster.stable.length === 0 && (
            <div className="text-center text-muted text-sm py-8">
              No units in stable.
              <br />
              <span className="text-xs">Recruit or breed new units.</span>
            </div>
          )}
        </div>
      )}

      {/* Scanner tab */}
      {tab === "scanner" && (
        <div className="flex flex-col gap-4">
          {/* Scanner status */}
          <div className="p-4 rounded-xl border border-accent/40 bg-panel">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-accent">Genetic Scanner</div>
                <div className="text-xs text-muted mt-0.5">
                  Capacity:{" "}
                  <span className="text-accent font-semibold">
                    {scannerCapacity}/{SCANNER_MAX_CAPACITY}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted">Scans remaining</div>
                <div className="text-2xl font-bold text-accent">{effectiveScansRemaining}</div>
              </div>
            </div>

            {upgradeCost !== null && (
              <button
                type="button"
                disabled={scrapTech < upgradeCost}
                onClick={() => upgradeScannerCapacity()}
                className="w-full py-2 rounded-lg text-sm font-semibold transition-all
                  bg-accent/15 hover:bg-accent text-accent
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Upgrade to {scannerCapacity + 1} scans — {upgradeCost} ST
                {scrapTech < upgradeCost && (
                  <span className="text-xs text-muted ml-1">
                    (need {upgradeCost - scrapTech} more)
                  </span>
                )}
              </button>
            )}
            {upgradeCost === null && scannerCapacity >= SCANNER_MAX_CAPACITY && (
              <div className="text-center text-xs text-accent mt-1">Maximum capacity reached</div>
            )}
          </div>

          {/* Unit gene reveal list */}
          <div>
            <div className="text-xs text-muted uppercase tracking-wider mb-2">
              Reveal Hidden Genes
            </div>
            {allUnits.length === 0 ? (
              <div className="text-center text-muted text-sm py-4">No units available</div>
            ) : (
              <div className="flex flex-col gap-2">
                {allUnits.map((unit) => {
                  const genes = ["maxHp", "speed", "attackPower"] as const;
                  const geneLabels: Record<string, string> = {
                    maxHp: "HP",
                    speed: "SPD",
                    attackPower: "ATK",
                  };
                  return (
                    <div key={unit.id} className="p-3 rounded-xl border border-line bg-panel">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-ink">
                          {getSpeciesName(unit.speciesId)}
                        </span>
                        <span className="text-xs text-muted">Lv.{unit.level}</span>
                      </div>
                      <div className="flex gap-2">
                        {genes.map((gene) => {
                          const revealed = unit.revealedGenes[gene];
                          return (
                            <button
                              key={gene}
                              type="button"
                              disabled={revealed || effectiveScansRemaining <= 0}
                              onClick={() => {
                                if (!revealed && effectiveScansRemaining > 0) {
                                  revealGene(unit.id, gene);
                                  setScansRemaining((prev) =>
                                    prev !== null ? prev - 1 : scannerCapacity - 1,
                                  );
                                }
                              }}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all
                                ${
                                  revealed
                                    ? "bg-accent/15 text-accent cursor-default border border-accent/40"
                                    : effectiveScansRemaining > 0
                                      ? "bg-panel-2 hover:bg-panel-2 text-ink border border-line"
                                      : "bg-panel text-muted cursor-not-allowed border border-line"
                                }
                              `}
                            >
                              {geneLabels[gene]}
                              {revealed && (
                                <span className="ml-1 text-accent">
                                  {unit.geneticPotential[gene]}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {effectiveScansRemaining === 0 && (
            <div className="text-center text-xs text-muted py-2">
              No scans remaining this visit. Return after the next encounter to reset.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
