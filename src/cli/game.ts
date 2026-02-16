import { confirm } from "@inquirer/prompts";
import { createGameState } from "../core/gameState";
import { Position } from "../core/types";
import { createUnit } from "../core/unit";
import { advanceEncounter, createGoobCampaign } from "../core/world";
import { GOOB, MEGA_GOOB } from "../data/enemies";
import { BEAR, EAGLE, TIGER } from "../data/species";
import { clearScreen, displayHeader } from "./display";
import { combatPhase, shopPhase } from "./phases";

const ALL_SPECIES = [BEAR, EAGLE, TIGER, GOOB, MEGA_GOOB];

// Main game loop
export async function playGame(): Promise<void> {
  clearScreen();
  displayHeader("🎮 Squad Battler");

  console.log("\n Welcome to Squad Battler - a roguelike auto-battler!");
  console.log("\n Build your squad, upgrade through battles, and conquer the campaign.");

  const start = await confirm({
    message: "Start new game?",
    default: true,
  });

  if (!start) {
    console.log("\nThanks for playing!");
    return;
  }

  // Create initial game state with starting squad
  const initialSquad = [
    createUnit(BEAR, Position.Left),
    createUnit(EAGLE, Position.Center),
    createUnit(TIGER, Position.Right),
  ];

  let gameState = createGameState(initialSquad, []);

  // Give starting gold
  gameState = {
    ...gameState,
    currency: {
      gold: 10,
      materials: 0,
    },
  };

  // Create campaign
  let campaign = createGoobCampaign(GOOB, MEGA_GOOB, [BEAR, EAGLE, TIGER]);

  // Main game loop
  let playing = true;
  let runComplete = false;

  while (playing && !runComplete) {
    // Shop phase
    gameState = await shopPhase(gameState, ALL_SPECIES);

    // Combat phase
    const { state: newState, victory } = await combatPhase(gameState, campaign);
    gameState = newState;

    // Increment encounters completed on victory
    if (victory) {
      gameState = {
        ...gameState,
        progress: {
          ...gameState.progress,
          encountersCompleted: gameState.progress.encountersCompleted + 1,
        },
      };
    }

    if (!victory) {
      displayHeader("💀 Run Failed");
      console.log("\n Your squad was defeated!");
      console.log(`\n 📊 Final Stats:`);
      console.log(`   - Encounters completed: ${gameState.progress.encountersCompleted}`);
      console.log(`   - Gold earned: ${gameState.currency.gold}`);
      console.log(`   - Materials collected: ${gameState.currency.materials}`);

      const retry = await confirm({
        message: "Try again?",
        default: true,
      });

      if (retry) {
        // Reset for new run with fresh starting squad (true roguelike - total reset)
        const freshSquad = [
          createUnit(BEAR, Position.Left),
          createUnit(EAGLE, Position.Center),
          createUnit(TIGER, Position.Right),
        ];

        gameState = createGameState(freshSquad, []);
        gameState = {
          ...gameState,
          currency: {
            gold: 10,
            materials: 0,
          },
        };
        campaign = createGoobCampaign(GOOB, MEGA_GOOB, [BEAR, EAGLE, TIGER]);
      } else {
        playing = false;
      }
      continue;
    }

    // Advance campaign
    const advanceResult = advanceEncounter(campaign);

    if (advanceResult.levelCompleted) {
      displayHeader("🏆 Level Complete!");
      console.log("\n You completed the level!");

      if (advanceResult.worldCompleted) {
        displayHeader("🌟 World Complete!");
        console.log("\n You conquered the world!");

        if (!advanceResult.campaign) {
          displayHeader("👑 Campaign Complete!");
          console.log("\n 🎉 CONGRATULATIONS! You've completed the entire campaign!");
          console.log(`\n 📊 Final Stats:`);
          console.log(`   - Encounters completed: ${gameState.progress.encountersCompleted}`);
          console.log(`   - Gold earned: ${gameState.currency.gold}`);
          console.log(`   - Materials collected: ${gameState.currency.materials}`);
          runComplete = true;
          playing = false;
          continue;
        }
      }

      await confirm({
        message: "Press Enter to continue...",
        default: true,
      });
    }

    campaign = advanceResult.campaign;

    // Check if squad is too weak to continue
    const livingSquad = gameState.roster.squad.filter((u) => u.stats.currentHp > 0);
    if (livingSquad.length === 0) {
      displayHeader("💀 Squad Wiped Out");
      console.log("\n Your entire squad was defeated!");

      const retry = await confirm({
        message: "Start new run?",
        default: true,
      });

      if (retry) {
        // Reset for new run with fresh starting squad (true roguelike - total reset)
        const freshSquad = [
          createUnit(BEAR, Position.Left),
          createUnit(EAGLE, Position.Center),
          createUnit(TIGER, Position.Right),
        ];

        gameState = createGameState(freshSquad, []);
        gameState = {
          ...gameState,
          currency: {
            gold: 10,
            materials: 0,
          },
        };
        campaign = createGoobCampaign(GOOB, MEGA_GOOB, [BEAR, EAGLE, TIGER]);
      } else {
        playing = false;
      }
    }
  }

  displayHeader("Thanks for Playing!");
  console.log("\n See you next time! 👋\n");
}
