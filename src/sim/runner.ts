import { simulateBattle } from "../core/battle";
import { createUnit } from "../core/unit";
import { logBattle, logSquadStatus } from "../core/logger";
import { BEAR, EAGLE, TIGER, SPECIES_BY_ID } from "../data/species";
import { Position } from "../core/types";
import { breed, createGenome } from "../core/genetics";

interface SimulationResult {
  totalBattles: number;
  playerWins: number;
  enemyWins: number;
  avgTicksPerBattle: number;
  winRate: number;
}

export function runTournament(
  battles: number = 100,
  playerSpecies: string[] = ["tiger", "eagle", "bear"],
  enemySpecies: string[] = ["tiger", "eagle", "bear"]
): SimulationResult {
  let playerWins = 0;
  let enemyWins = 0;
  let totalTicks = 0;

  for (let i = 0; i < battles; i++) {
    const playerSquad = playerSpecies.map(
      (speciesId, idx) =>
        createUnit(SPECIES_BY_ID[speciesId]!, idx as Position)
    );
    const enemySquad = enemySpecies.map(
      (speciesId, idx) =>
        createUnit(SPECIES_BY_ID[speciesId]!, idx as Position)
    );

    const result = simulateBattle(playerSquad, enemySquad);

    if (result.winner === "player") playerWins++;
    else enemyWins++;

    totalTicks += result.tick;
  }

  return {
    totalBattles: battles,
    playerWins,
    enemyWins,
    avgTicksPerBattle: totalTicks / battles,
    winRate: playerWins / battles,
  };
}

export function demonstrateBattle() {
  console.log("=== SQUAD BATTLER DEMO ===\n");

  const playerSquad = [
    createUnit(TIGER, Position.Left),
    createUnit(EAGLE, Position.Center),
    createUnit(BEAR, Position.Right, {
      mutations: ["thick_hide"],
    }),
  ];

  const enemySquad = [
    createUnit(BEAR, Position.Left),
    createUnit(TIGER, Position.Center),
    createUnit(EAGLE, Position.Right),
  ];

  console.log(logSquadStatus(playerSquad, "PLAYER SQUAD"));
  console.log();
  console.log(logSquadStatus(enemySquad, "ENEMY SQUAD"));
  console.log("\n");

  const result = simulateBattle(playerSquad, enemySquad);
  console.log(logBattle(result));
}

export function demonstrateGeneticLineage() {
  console.log("\n\n=== GENETIC LINEAGE DEMO ===\n");

  const parent1 = createGenome("tiger", ["thick_hide"], 0);
  const parent2 = createGenome("tiger", ["powerful_muscles"], 0);

  console.log("Parent 1:", parent1);
  console.log("Parent 2:", parent2);
  console.log();

  for (let i = 0; i < 5; i++) {
    const offspring = breed(parent1, parent2, 0.3);
    console.log(`Offspring ${i + 1}:`, offspring);
  }
}

export function demonstrateRoguelikeRun() {
  console.log("\n\n=== ROGUELIKE RUN DEMO ===\n");

  let squad = [
    createUnit(TIGER, Position.Left),
    createUnit(EAGLE, Position.Center),
    createUnit(BEAR, Position.Right),
  ];

  console.log("Starting Squad:");
  console.log(logSquadStatus(squad, "SQUAD"));
  console.log();

  for (let round = 1; round <= 5; round++) {
    console.log(`\n--- ROUND ${round} ---`);

    const enemyDifficulty = round;
    const enemySquad = [
      createUnit(BEAR, Position.Left),
      createUnit(TIGER, Position.Center),
      createUnit(EAGLE, Position.Right),
    ];

    enemySquad.forEach((enemy) => {
      enemy.stats.attackPower += enemyDifficulty * 3;
      enemy.stats.maxHp += enemyDifficulty * 10;
      enemy.stats.currentHp = enemy.stats.maxHp;
    });

    const result = simulateBattle(squad, enemySquad);

    console.log(`Battle ${round}: ${result.winner === "player" ? "WIN" : "LOSS"}`);
    console.log(`Ticks: ${result.tick}`);

    if (result.winner === "enemy") {
      console.log("\n💀 RUN ENDED 💀");
      console.log(`Reached Round: ${round}`);
      break;
    }

    squad = result.playerUnits;
    console.log(logSquadStatus(squad, "Squad Status After Battle"));

    if (squad.filter((u) => u.stats.currentHp > 0).length === 0) {
      console.log("\n💀 ALL UNITS DIED 💀");
      break;
    }
  }
}

demonstrateBattle();
demonstrateGeneticLineage();
demonstrateRoguelikeRun();

console.log("\n\n=== TOURNAMENT SIMULATION ===\n");
const tournamentResult = runTournament(1000);
console.log("Results after 1000 battles:");
console.log(`  Player Wins: ${tournamentResult.playerWins}`);
console.log(`  Enemy Wins: ${tournamentResult.enemyWins}`);
console.log(`  Win Rate: ${(tournamentResult.winRate * 100).toFixed(1)}%`);
console.log(`  Avg Ticks/Battle: ${tournamentResult.avgTicksPerBattle.toFixed(1)}`);
