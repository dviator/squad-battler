import type { Species, Unit } from "./types";
import { Position } from "./types";
import { createUnit } from "./unit";

// Combat encounter types
export enum EncounterType {
  Normal = "normal",
  MiniBoss = "mini_boss",
  Boss = "boss",
}

// Combat encounter definition
export interface Encounter {
  id: string;
  type: EncounterType;
  enemies: Unit[];
  goldReward: number;
  materialsReward: number;
}

// Level definition (sequence of encounters)
export interface Level {
  id: string;
  name: string;
  encounters: Encounter[];
  completionReward?: LevelReward;
}

// Rewards for completing a level
export interface LevelReward {
  gold?: number;
  materials?: number;
  unlockedSpecies?: string;
  unlockedStation?: string;
}

// World definition (collection of levels)
export interface World {
  id: string;
  name: string;
  description: string;
  levels: Level[];
  difficulty: number; // Affects enemy scaling
  theme: string;
}

// Enemy generation

export interface EnemySquadTemplate {
  species: Species[];
  positions: Position[];
  levelBoost: number; // Levels above 1
  mutationChance: number; // Chance each unit has mutations
}

// Generate a random enemy squad
export function generateEnemySquad(
  availableSpecies: Species[],
  difficulty: number,
  isBoss: boolean = false,
): Unit[] {
  const squadSize = isBoss ? 3 : Math.min(3, 1 + Math.floor(difficulty / 2));
  const enemies: Unit[] = [];

  const positions: Position[] = [0, 1, 2]; // Left, Center, Right

  for (let i = 0; i < squadSize; i++) {
    const species = availableSpecies[Math.floor(Math.random() * availableSpecies.length)];
    const position = positions[i];

    const enemy = createUnit(species, position);

    // Nerf enemies: reduce stats by 50% to make game winnable
    const nerfedEnemy = {
      ...enemy,
      stats: {
        ...enemy.stats,
        maxHp: Math.floor(enemy.stats.maxHp * 0.5),
        currentHp: Math.floor(enemy.stats.currentHp * 0.5),
        speed: Math.max(1, Math.floor(enemy.stats.speed * 0.5)),
        attackPower: Math.floor(enemy.stats.attackPower * 0.5),
      },
    };

    // Boss units get level boost (applied after nerf)
    let boostedEnemy = nerfedEnemy;
    if (isBoss) {
      const levelBoost = difficulty;
      boostedEnemy = {
        ...nerfedEnemy,
        level: 1 + levelBoost,
        stats: {
          ...nerfedEnemy.stats,
          maxHp: nerfedEnemy.stats.maxHp + levelBoost * 10,
          currentHp: nerfedEnemy.stats.currentHp + levelBoost * 10,
          speed: nerfedEnemy.stats.speed + levelBoost * 2,
          attackPower: nerfedEnemy.stats.attackPower + levelBoost * 3,
        },
      };
    }

    enemies.push(boostedEnemy);
  }

  return enemies;
}

// Generate a custom encounter with specific enemy layout
export function createCustomEncounter(
  encounterId: string,
  type: EncounterType,
  enemySpecies: Species[],
  positions: Position[],
  goldReward: number,
  materialsReward: number = 0,
): Encounter {
  const enemies = enemySpecies.map((species, i) =>
    createUnit(species, positions[i] || (i as Position)),
  );

  return {
    id: encounterId,
    type,
    enemies,
    goldReward,
    materialsReward,
  };
}

// Generate a normal encounter
export function generateNormalEncounter(
  encounterId: string,
  availableSpecies: Species[],
  difficulty: number,
  baseGoldReward: number = 3,
): Encounter {
  const enemies = generateEnemySquad(availableSpecies, difficulty, false);

  return {
    id: encounterId,
    type: EncounterType.Normal,
    enemies,
    goldReward: baseGoldReward,
    materialsReward: 0,
  };
}

// Generate a mini-boss encounter
export function generateMiniBossEncounter(
  encounterId: string,
  availableSpecies: Species[],
  difficulty: number,
  baseGoldReward: number = 3,
): Encounter {
  const enemies = generateEnemySquad(availableSpecies, difficulty + 1, true);

  return {
    id: encounterId,
    type: EncounterType.MiniBoss,
    enemies,
    goldReward: baseGoldReward * 2,
    materialsReward: 1,
  };
}

// Generate a boss encounter
export function generateBossEncounter(
  encounterId: string,
  availableSpecies: Species[],
  difficulty: number,
  baseGoldReward: number = 3,
): Encounter {
  const enemies = generateEnemySquad(availableSpecies, difficulty + 2, true);

  return {
    id: encounterId,
    type: EncounterType.Boss,
    enemies,
    goldReward: baseGoldReward * 3,
    materialsReward: 3,
  };
}

// Generate a complete level
export function generateLevel(
  levelId: string,
  levelName: string,
  availableSpecies: Species[],
  difficulty: number,
  encounterCount: number = 5,
  reward?: LevelReward,
): Level {
  const encounters: Encounter[] = [];

  // Determine boss placement
  const miniBossIndex = Math.floor(encounterCount / 2);
  const bossIndex = encounterCount - 1;

  for (let i = 0; i < encounterCount; i++) {
    const encounterId = `${levelId}_encounter_${i + 1}`;

    if (i === bossIndex) {
      // Final encounter is a boss
      encounters.push(generateBossEncounter(encounterId, availableSpecies, difficulty));
    } else if (i === miniBossIndex) {
      // Middle encounter is a mini-boss
      encounters.push(generateMiniBossEncounter(encounterId, availableSpecies, difficulty));
    } else {
      // Normal encounter
      encounters.push(generateNormalEncounter(encounterId, availableSpecies, difficulty));
    }
  }

  return {
    id: levelId,
    name: levelName,
    encounters,
    completionReward: reward,
  };
}

// Generate a complete world
export function generateWorld(
  worldId: string,
  worldName: string,
  description: string,
  availableSpecies: Species[],
  difficulty: number,
  levelCount: number = 2,
  theme: string = "corporate_lab",
): World {
  const levels: Level[] = [];

  for (let i = 0; i < levelCount; i++) {
    const levelId = `${worldId}_level_${i + 1}`;
    const levelName = `Floor ${i + 1}`;
    const encounterCount = 4 + Math.floor(Math.random() * 2); // 4-5 encounters

    // First level unlocks breeding station
    // Second level unlocks microscope
    let reward: LevelReward | undefined;
    if (i === 0) {
      reward = {
        materials: 5,
        unlockedStation: "breeding",
      };
    } else if (i === 1) {
      reward = {
        materials: 10,
        unlockedStation: "microscope",
      };
    }

    const level = generateLevel(
      levelId,
      levelName,
      availableSpecies,
      difficulty + i,
      encounterCount,
      reward,
    );

    levels.push(level);
  }

  return {
    id: worldId,
    name: worldName,
    description,
    levels,
    difficulty,
    theme,
  };
}

// Predefined world templates

// World 1: Basement Levels with custom Goob enemies
export function createWorld1Goobs(goobSpecies: Species, megaGoobSpecies: Species): World {
  const level1: Level = {
    id: "world_1_level_1",
    name: "Floor B1 - The Specimen Chambers",
    encounters: [
      // 2 Goobs
      createCustomEncounter(
        "w1_l1_e1",
        EncounterType.Normal,
        [goobSpecies, goobSpecies],
        [Position.Left, Position.Right],
        3,
        0,
      ),
      // 3 Goobs
      createCustomEncounter(
        "w1_l1_e2",
        EncounterType.Normal,
        [goobSpecies, goobSpecies, goobSpecies],
        [Position.Left, Position.Center, Position.Right],
        3,
        0,
      ),
      // Mini-boss: Mega Goob
      createCustomEncounter(
        "w1_l1_e3",
        EncounterType.MiniBoss,
        [megaGoobSpecies],
        [Position.Center],
        6,
        1,
      ),
      // 2 Goobs
      createCustomEncounter(
        "w1_l1_e4",
        EncounterType.Normal,
        [goobSpecies, goobSpecies],
        [Position.Left, Position.Center],
        3,
        0,
      ),
      // Boss: Mega Goob + 2 Goob sidekicks
      createCustomEncounter(
        "w1_l1_e5",
        EncounterType.Boss,
        [goobSpecies, megaGoobSpecies, goobSpecies],
        [Position.Left, Position.Center, Position.Right],
        9,
        3,
      ),
    ],
    completionReward: {
      materials: 5,
      unlockedStation: "breeding",
    },
  };

  return {
    id: "world_1",
    name: "Basement Levels",
    description: "Escape from the lower basement where the failed experiments lurk.",
    levels: [level1],
    difficulty: 1,
    theme: "dark_basement",
  };
}

export function createWorld1(availableSpecies: Species[]): World {
  return generateWorld(
    "world_1",
    "Basement Levels",
    "Escape from the lower basement floors where the experiments went wrong.",
    availableSpecies,
    1,
    2,
    "dark_basement",
  );
}

export function createWorld2(availableSpecies: Species[]): World {
  const world = generateWorld(
    "world_2",
    "Research Labs",
    "Fight through the main research laboratories.",
    availableSpecies,
    3,
    2,
    "research_lab",
  );

  // Override rewards for world 2
  if (world.levels[0]) {
    world.levels[0].completionReward = {
      materials: 15,
      unlockedSpecies: "wolf", // Example new species
    };
  }

  return world;
}

export function createWorld3(availableSpecies: Species[]): World {
  const world = generateWorld(
    "world_3",
    "Executive Offices",
    "Battle through the corporate offices and their security forces.",
    availableSpecies,
    5,
    2,
    "office_floors",
  );

  // Gene editing station unlock
  if (world.levels[0]) {
    world.levels[0].completionReward = {
      materials: 25,
      unlockedStation: "gene_editing",
    };
  }

  return world;
}

// Campaign structure (all worlds in order)
export interface Campaign {
  worlds: World[];
  currentWorldIndex: number;
  currentLevelIndex: number;
  currentEncounterIndex: number;
}

export function createCampaign(availableSpecies: Species[]): Campaign {
  return {
    worlds: [
      createWorld1(availableSpecies),
      createWorld2(availableSpecies),
      createWorld3(availableSpecies),
    ],
    currentWorldIndex: 0,
    currentLevelIndex: 0,
    currentEncounterIndex: 0,
  };
}

// Create campaign with custom enemies (Goob-based World 1)
export function createGoobCampaign(
  goobSpecies: Species,
  megaGoobSpecies: Species,
  playerSpecies: Species[],
): Campaign {
  return {
    worlds: [
      createWorld1Goobs(goobSpecies, megaGoobSpecies),
      createWorld2(playerSpecies), // Placeholder
      createWorld3(playerSpecies), // Placeholder
    ],
    currentWorldIndex: 0,
    currentLevelIndex: 0,
    currentEncounterIndex: 0,
  };
}

// Get current encounter
export function getCurrentEncounter(campaign: Campaign): Encounter | null {
  const world = campaign.worlds[campaign.currentWorldIndex];
  if (!world) return null;

  const level = world.levels[campaign.currentLevelIndex];
  if (!level) return null;

  return level.encounters[campaign.currentEncounterIndex] || null;
}

// Advance to next encounter
export function advanceEncounter(campaign: Campaign): {
  campaign: Campaign;
  levelCompleted: boolean;
  worldCompleted: boolean;
  reward?: LevelReward;
} {
  const world = campaign.worlds[campaign.currentWorldIndex];
  if (!world) {
    return { campaign, levelCompleted: false, worldCompleted: false };
  }

  const level = world.levels[campaign.currentLevelIndex];
  if (!level) {
    return { campaign, levelCompleted: false, worldCompleted: false };
  }

  const nextEncounterIndex = campaign.currentEncounterIndex + 1;

  // Check if level is complete
  if (nextEncounterIndex >= level.encounters.length) {
    const nextLevelIndex = campaign.currentLevelIndex + 1;

    // Check if world is complete
    if (nextLevelIndex >= world.levels.length) {
      return {
        campaign: {
          ...campaign,
          currentWorldIndex: campaign.currentWorldIndex + 1,
          currentLevelIndex: 0,
          currentEncounterIndex: 0,
        },
        levelCompleted: true,
        worldCompleted: true,
        reward: level.completionReward,
      };
    }

    return {
      campaign: {
        ...campaign,
        currentLevelIndex: nextLevelIndex,
        currentEncounterIndex: 0,
      },
      levelCompleted: true,
      worldCompleted: false,
      reward: level.completionReward,
    };
  }

  return {
    campaign: {
      ...campaign,
      currentEncounterIndex: nextEncounterIndex,
    },
    levelCompleted: false,
    worldCompleted: false,
  };
}

// Check if campaign is complete
export function isCampaignComplete(campaign: Campaign): boolean {
  return campaign.currentWorldIndex >= campaign.worlds.length;
}
