import { confirm } from "@inquirer/prompts";
import { createGameState, loadSave, saveGameState, unlockScanner } from "../core/gameState";
import { Position } from "../core/types";
import { createUnit } from "../core/unit";
import { advanceEncounter, createGoobCampaign, EncounterType } from "../core/world";
import { GOOB, HEAVY_GOOB, MEGA_GOOB } from "../data/enemies";
import { BEAR, EAGLE, TIGER } from "../data/species";
import { clearScreen, displayGameState, displayHeader } from "./display";
import { combatPhase, labPhase, shopPhase } from "./phases";

const ALL_SPECIES = [BEAR, EAGLE, TIGER, GOOB, HEAVY_GOOB, MEGA_GOOB];

// Main game loop
export async function playGame(): Promise<void> {
  clearScreen();
  displayHeader("🎮 Squad Battler");

  console.log("\n Welcome to Squad Battler - a genetic roguelike auto-battler!");
  console.log("\n Escape the MegaCorp lab by breeding increasingly powerful creatures.");

  // Load persistent save data
  const save = await loadSave();
  const isFirstRun = save === null;

  if (save) {
    console.log(
      `\n💾 Save loaded — 🔧 ${save.scrapTech} scrap tech | ${save.stable.length} creatures in stable`,
    );
  }

  const start = await confirm({
    message: isFirstRun ? "Start new game?" : "Continue?",
    default: true,
  });

  if (!start) {
    console.log("\nThanks for playing!");
    return;
  }

  // Build persistent state from save (or defaults for first run)
  let persistentScrapTech = save?.scrapTech ?? 0;
  const persistentScannerCapacity = save?.scannerCapacity ?? 0;
  let persistentStable = save?.stable ?? [];
  let persistentUnlockedSpecies = save?.unlockedSpecies ?? ["bear", "eagle", "tiger"];
  let persistentUnlockedStations = save?.unlockedStations ?? ["healing", "recruiting"];
  let persistentProgress = save?.progress ?? { worldsCompleted: 0, encountersCompleted: 0 };

  let playing = true;

  while (playing) {
    // Build game state from persistent data (squad is empty — selected in lab)
    let gameState = createGameState([], persistentStable);
    gameState = {
      ...gameState,
      scrapTech: persistentScrapTech,
      scannerCapacity: persistentScannerCapacity,
      unlockedSpecies: persistentUnlockedSpecies,
      unlockedStations: persistentUnlockedStations,
      currency: { gold: 10, materials: 0 },
      progress: persistentProgress,
    };

    if (isFirstRun && persistentStable.length === 0) {
      // First time ever: auto-create starting squad, skip lab
      displayHeader("🧬 Starting Lab");
      console.log("\n You've been assigned three test subjects to begin your escape.\n");
      gameState = {
        ...gameState,
        roster: {
          ...gameState.roster,
          squad: [
            createUnit(BEAR, Position.Left),
            createUnit(EAGLE, Position.Center),
            createUnit(TIGER, Position.Right),
          ],
          stable: [],
        },
      };
    } else {
      // Lab phase: heal units, select squad for this run
      gameState = await labPhase(gameState);
      // Refresh gold after lab (healing may have spent scrap tech, gold resets per run)
      gameState = { ...gameState, currency: { gold: 10, materials: 0 } };
    }

    // Fresh campaign for this run
    let campaign = createGoobCampaign(GOOB, HEAVY_GOOB, MEGA_GOOB, [BEAR, EAGLE, TIGER]);

    displayHeader("🏃 Run Started");
    console.log(`\n Squad: ${gameState.roster.squad.map((u) => u.speciesId).join(", ")}`);
    console.log(` 🔧 Scrap Tech: ${gameState.scrapTech}\n`);

    // Run loop
    let runEnded = false;
    let runVictory = false;
    let scrapTechEarned = 0;

    while (!runEnded) {
      // Shop phase
      gameState = await shopPhase(gameState, ALL_SPECIES);

      // Combat phase
      const combatResult = await combatPhase(gameState, campaign);
      gameState = combatResult.state;

      if (combatResult.victory) {
        scrapTechEarned += combatResult.encounter.scrapTechReward;

        gameState = {
          ...gameState,
          progress: {
            ...gameState.progress,
            encountersCompleted: gameState.progress.encountersCompleted + 1,
          },
        };

        if (combatResult.encounter.type === EncounterType.Boss) {
          // Boss defeated — unlock scanner if not already unlocked
          if (gameState.scannerCapacity === 0) {
            gameState = unlockScanner(gameState);
            console.log(
              "\n🔬 GENETIC SCANNER UNLOCKED! Visit the lab to scan 1 gene per run. Upgrade with Scrap Tech for more.",
            );
          }
          runEnded = true;
          runVictory = true;
        } else {
          // Advance to next encounter
          const advanceResult = advanceEncounter(campaign);
          campaign = advanceResult.campaign;

          if (advanceResult.levelCompleted) {
            displayHeader("🏆 Level Complete!");
            console.log("\n You completed the level! Heading deeper...\n");
            await confirm({ message: "Press Enter to continue...", default: true });
          }
        }
      } else {
        // Defeat — move dead squad members to stable
        const survivors = gameState.roster.squad.filter((u) => u.stats.currentHp > 0);
        const defeated = gameState.roster.squad.filter((u) => u.stats.currentHp <= 0);

        gameState = {
          ...gameState,
          roster: {
            ...gameState.roster,
            squad: survivors,
            stable: [...gameState.roster.stable, ...defeated],
          },
        };

        runEnded = true;
        runVictory = false;
      }

      // Check: did entire squad get wiped?
      if (!runEnded && gameState.roster.squad.filter((u) => u.stats.currentHp > 0).length === 0) {
        const defeated = gameState.roster.squad;
        gameState = {
          ...gameState,
          roster: {
            ...gameState.roster,
            squad: [],
            stable: [...gameState.roster.stable, ...defeated],
          },
        };
        runEnded = true;
        runVictory = false;
      }
    }

    // End of run: move all surviving squad members to stable (squad resets each run)
    const allUnitsAfterRun = [...gameState.roster.squad, ...gameState.roster.stable];
    gameState = {
      ...gameState,
      roster: {
        ...gameState.roster,
        squad: [],
        stable: allUnitsAfterRun,
      },
    };

    // Run summary
    displayHeader(runVictory ? "🏆 Run Complete!" : "💀 Run Failed");
    displayGameState(gameState);
    console.log(`\n📊 Run Summary:`);
    console.log(
      `   - Encounters completed this run: ${scrapTechEarned > 0 ? gameState.progress.encountersCompleted : 0}`,
    );
    console.log(`   - 🔧 Scrap Tech earned: ${scrapTechEarned}`);
    console.log(`   - 🔧 Total Scrap Tech: ${gameState.scrapTech}`);
    if (runVictory && persistentScannerCapacity === 0 && gameState.scannerCapacity > 0) {
      console.log(`   - 🔬 Genetic Scanner unlocked!`);
    }
    console.log(`\n  Creatures returning to stable:`);
    gameState.roster.stable.forEach((u) => {
      const status = u.stats.currentHp > 0 ? "✓ survived" : "☠️  defeated";
      console.log(`    - ${u.speciesId} (${status})`);
    });

    // Update persistent state
    persistentScrapTech = gameState.scrapTech;
    persistentStable = gameState.roster.stable;
    persistentUnlockedSpecies = gameState.unlockedSpecies;
    persistentUnlockedStations = gameState.unlockedStations;
    persistentProgress = gameState.progress;

    // Save to disk
    await saveGameState({
      scrapTech: persistentScrapTech,
      scannerCapacity: gameState.scannerCapacity,
      stable: persistentStable,
      unlockedSpecies: persistentUnlockedSpecies,
      unlockedStations: persistentUnlockedStations,
      progress: persistentProgress,
    });

    console.log("\n💾 Progress saved.");

    const retry = await confirm({ message: "Play another run?", default: true });
    if (!retry) playing = false;
  }

  displayHeader("Thanks for Playing!");
  console.log("\n See you next time! 👋\n");
}
