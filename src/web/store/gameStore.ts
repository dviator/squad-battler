import { create } from "zustand";
import { simulateBattle } from "@/core/battle";
import type { GameState, SaveData } from "@/core/gameState";
import {
  addGold,
  addMaterials,
  addScrapTech,
  advanceTime,
  advanceTimeAfterCombat,
  createGameState,
  getScannerUpgradeCost,
  SCANNER_MAX_CAPACITY,
  SCANNER_UPGRADE_COSTS,
  unlockScanner,
  unlockSpecies,
  unlockStation,
  upgradeScanner,
} from "@/core/gameState";
import {
  addToStable,
  applyHealing,
  collectOffspring as coreCollectOffspring,
  recruitUnit as coreRecruitUnit,
  startBreeding as coreStartBreeding,
  isBreedingComplete,
  isHealingComplete,
  startHealing,
  swapSquadUnit,
} from "@/core/lab";
import {
  applyConsumableToUnit,
  applyGeneticModToUnit,
  generateShop,
  purchaseItem,
} from "@/core/shop";
import type { BattleState, ConsumableItem, GeneticModItem, ShopItem, Unit } from "@/core/types";
import { ItemCategory, Position } from "@/core/types";
import { createUnit, gainExperience } from "@/core/unit";
import type { Campaign, Encounter } from "@/core/world";
import {
  advanceEncounter,
  createGoobCampaign,
  EncounterType,
  getCurrentEncounter,
} from "@/core/world";
import { GOOB, HEAVY_GOOB, MEGA_GOOB } from "@/data/enemies";
import { BEAR, EAGLE, SPECIES_BY_ID, TIGER } from "@/data/species";

type View = "menu" | "campaign" | "shop" | "battle" | "lab";

interface BattleCtx {
  battleState: BattleState;
  initialPlayerUnits: Unit[];
  initialEnemyUnits: Unit[];
  encounter: Encounter;
}

interface AppStore {
  view: View;
  gameState: GameState | null;
  campaign: Campaign | null;
  shopItems: ShopItem[];
  shopPurchasedIds: string[];
  battleCtx: BattleCtx | null;

  startNewGame(): void;
  loadSave(): boolean;
  saveGame(): void;

  goToShop(): void;
  goToLab(): void;
  goToCampaign(): void;

  buyItem(item: ShopItem, unitId: string): { ok: boolean; error?: string };

  runBattle(): void;
  afterBattleWin(): void;
  afterBattleLoss(): void;

  sendToHealing(unitId: string): void;
  collectHealed(unitId: string): void;
  advanceGameTime(hours: number): void;
  recruitUnit(speciesId: string): void;
  startBreeding(parent1Id: string, parent2Id: string): void;
  collectOffspring(speciesId: string): void;
  swapSquadMember(squadIdx: number, stableUnitId: string): void;
  upgradeScannerCapacity(): void;
  revealGene(unitId: string, gene: "maxHp" | "speed" | "attackPower"): void;
}

const SAVE_KEY = "squad-battler-v1";
const STARTING_GOLD = 10;

let _idCounter = 0;

function makeUnitId(): string {
  return `u_${Date.now()}_${(_idCounter++).toString(36)}`;
}

function makeUnit(species: typeof BEAR, position: Position): Unit {
  const unit = createUnit(species, position);
  return { ...unit, id: makeUnitId() };
}

function findUnit(gameState: GameState, unitId: string): Unit | undefined {
  return (
    gameState.roster.squad.find((u) => u.id === unitId) ??
    gameState.roster.stable.find((u) => u.id === unitId)
  );
}

function replaceUnit(gameState: GameState, updated: Unit): GameState {
  return {
    ...gameState,
    roster: {
      ...gameState.roster,
      squad: gameState.roster.squad.map((u) => (u.id === updated.id ? updated : u)),
      stable: gameState.roster.stable.map((u) => (u.id === updated.id ? updated : u)),
    },
  };
}

function serializeSave(gameState: GameState, campaign: Campaign): string {
  const saveData: SaveData = {
    scrapTech: gameState.scrapTech,
    scannerCapacity: gameState.scannerCapacity,
    stable: gameState.roster.stable,
    unlockedSpecies: gameState.unlockedSpecies,
    unlockedStations: gameState.unlockedStations,
    progress: gameState.progress,
  };
  return JSON.stringify({ saveData, campaign, gameState });
}

function deserializeSave(raw: string): { gameState: GameState; campaign: Campaign } | null {
  try {
    const parsed = JSON.parse(raw) as {
      saveData?: SaveData;
      campaign: Campaign;
      gameState: GameState;
    };
    return { gameState: parsed.gameState, campaign: parsed.campaign };
  } catch {
    return null;
  }
}

export const useGameStore = create<AppStore>((set, get) => ({
  view: "menu",
  gameState: null,
  campaign: null,
  shopItems: [],
  shopPurchasedIds: [],
  battleCtx: null,

  startNewGame() {
    const squad = [
      makeUnit(BEAR, Position.Left),
      makeUnit(EAGLE, Position.Center),
      makeUnit(TIGER, Position.Right),
    ];

    let gameState = createGameState(squad, []);
    gameState = addGold(gameState, STARTING_GOLD);

    const campaign = createGoobCampaign(GOOB, HEAVY_GOOB, MEGA_GOOB, [BEAR, EAGLE, TIGER]);
    const shopItems = generateShop(0);

    set({
      view: "shop",
      gameState,
      campaign,
      shopItems,
      shopPurchasedIds: [],
      battleCtx: null,
    });
    get().saveGame();
  },

  loadSave(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const result = deserializeSave(raw);
      if (!result) return false;
      const { gameState, campaign } = result;
      const shopItems = generateShop(gameState.progress.encountersCompleted);
      set({
        view: "campaign",
        gameState,
        campaign,
        shopItems,
        shopPurchasedIds: [],
        battleCtx: null,
      });
      return true;
    } catch {
      return false;
    }
  },

  saveGame() {
    const { gameState, campaign } = get();
    if (!gameState || !campaign) return;
    localStorage.setItem(SAVE_KEY, serializeSave(gameState, campaign));
  },

  goToShop() {
    const { gameState } = get();
    if (!gameState) return;
    const shopItems = generateShop(gameState.progress.encountersCompleted);
    set({ view: "shop", shopItems, shopPurchasedIds: [] });
  },

  goToLab() {
    set({ view: "lab" });
  },

  goToCampaign() {
    set({ view: "campaign" });
    get().saveGame();
  },

  buyItem(item: ShopItem, unitId: string): { ok: boolean; error?: string } {
    const { gameState, shopPurchasedIds } = get();
    if (!gameState) return { ok: false, error: "No active game" };

    const { success, newCurrency, error } = purchaseItem(gameState.currency, item);
    if (!success) return { ok: false, error };

    let newGameState = { ...gameState, currency: newCurrency };

    const unit = findUnit(newGameState, unitId);
    if (!unit) return { ok: false, error: "Unit not found" };

    const species = SPECIES_BY_ID[unit.speciesId];
    if (!species) return { ok: false, error: "Unknown species" };

    let updatedUnit = unit;

    if (item.category === ItemCategory.Consumable) {
      updatedUnit = applyConsumableToUnit(unit, item as ConsumableItem, species).unit;
    } else if (item.category === ItemCategory.GeneticMod) {
      updatedUnit = applyGeneticModToUnit(unit, item as GeneticModItem, species);
    } else if (item.category === ItemCategory.Equipment) {
      updatedUnit = { ...unit, equipment: [...unit.equipment, item.id] };
    }

    newGameState = replaceUnit(newGameState, updatedUnit);

    set({ gameState: newGameState, shopPurchasedIds: [...shopPurchasedIds, item.id] });
    return { ok: true };
  },

  runBattle() {
    const { gameState, campaign } = get();
    if (!gameState || !campaign) return;

    const encounter = getCurrentEncounter(campaign);
    if (!encounter) return;

    const playerUnits = gameState.roster.squad;
    const enemyUnits = encounter.enemies;
    const battleState = simulateBattle(playerUnits, enemyUnits);

    set({
      view: "battle",
      battleCtx: {
        battleState,
        initialPlayerUnits: playerUnits,
        initialEnemyUnits: enemyUnits,
        encounter,
      },
    });
  },

  afterBattleWin() {
    const { gameState, campaign, battleCtx } = get();
    if (!gameState || !campaign || !battleCtx) return;

    const { encounter, battleState } = battleCtx;

    let newGameState: GameState = {
      ...gameState,
      roster: {
        ...gameState.roster,
        squad: battleState.playerUnits,
      },
    };

    newGameState = addGold(newGameState, encounter.goldReward);
    if (encounter.materialsReward > 0) {
      newGameState = addMaterials(newGameState, encounter.materialsReward);
    }
    if (encounter.scrapTechReward > 0) {
      newGameState = addScrapTech(newGameState, encounter.scrapTechReward);
    }

    newGameState = {
      ...newGameState,
      roster: {
        ...newGameState.roster,
        squad: newGameState.roster.squad.map((unit) =>
          unit.stats.currentHp > 0 ? gainExperience(unit, 50) : unit,
        ),
      },
    };

    newGameState = advanceTimeAfterCombat(newGameState);
    newGameState = {
      ...newGameState,
      progress: {
        ...newGameState.progress,
        encountersCompleted: newGameState.progress.encountersCompleted + 1,
      },
    };

    const { campaign: newCampaign, reward } = advanceEncounter(campaign);
    if (reward) {
      if (reward.gold) newGameState = addGold(newGameState, reward.gold);
      if (reward.materials) newGameState = addMaterials(newGameState, reward.materials);
      if (reward.unlockedStation)
        newGameState = unlockStation(newGameState, reward.unlockedStation);
      if (reward.unlockedSpecies)
        newGameState = unlockSpecies(newGameState, reward.unlockedSpecies);
    }

    if (encounter.type === EncounterType.Boss && newGameState.scannerCapacity === 0) {
      newGameState = unlockScanner(newGameState);
    }

    const shopItems = generateShop(newGameState.progress.encountersCompleted);

    set({
      view: "shop",
      gameState: newGameState,
      campaign: newCampaign,
      shopItems,
      shopPurchasedIds: [],
      battleCtx: null,
    });
    get().saveGame();
  },

  afterBattleLoss() {
    const { gameState } = get();
    if (!gameState) return;

    const restoredGameState = {
      ...gameState,
      roster: {
        ...gameState.roster,
        squad: gameState.roster.squad.map((unit) => ({
          ...unit,
          stats: { ...unit.stats, currentHp: Math.max(1, Math.floor(unit.stats.maxHp * 0.25)) },
        })),
      },
    };

    set({ view: "campaign", gameState: restoredGameState, battleCtx: null });
    get().saveGame();
  },

  sendToHealing(unitId: string) {
    const { gameState } = get();
    if (!gameState) return;

    const unit = findUnit(gameState, unitId);
    if (!unit) return;

    const slot = startHealing(unit, 100);
    const newGameState = {
      ...gameState,
      roster: { ...gameState.roster, healing: [...gameState.roster.healing, slot] },
    };

    set({ gameState: newGameState });
    get().saveGame();
  },

  collectHealed(unitId: string) {
    const { gameState } = get();
    if (!gameState) return;

    const slot = gameState.roster.healing.find((s) => s.unitId === unitId);
    if (!slot || !isHealingComplete(slot)) return;

    const unit = findUnit(gameState, unitId);
    if (!unit) return;

    const healed = applyHealing(unit);
    let newGameState = replaceUnit(gameState, healed);
    newGameState = {
      ...newGameState,
      roster: {
        ...newGameState.roster,
        healing: newGameState.roster.healing.filter((s) => s.unitId !== unitId),
      },
    };

    set({ gameState: newGameState });
    get().saveGame();
  },

  advanceGameTime(hours: number) {
    const { gameState } = get();
    if (!gameState) return;
    const newGameState = advanceTime(gameState, hours / 24);
    set({ gameState: newGameState });
    get().saveGame();
  },

  recruitUnit(speciesId: string) {
    const { gameState } = get();
    if (!gameState) return;

    const species = SPECIES_BY_ID[speciesId];
    if (!species) return;

    const unit = coreRecruitUnit(species, Position.Center);
    const webUnit = { ...unit, id: makeUnitId() };
    const newGameState = { ...gameState, roster: addToStable(gameState.roster, webUnit) };

    set({ gameState: newGameState });
    get().saveGame();
  },

  startBreeding(parent1Id: string, parent2Id: string) {
    const { gameState } = get();
    if (!gameState) return;

    const parent1 = findUnit(gameState, parent1Id);
    const parent2 = findUnit(gameState, parent2Id);
    if (!parent1 || !parent2) return;

    const slot = coreStartBreeding(parent1, parent2);
    const newGameState = {
      ...gameState,
      roster: { ...gameState.roster, breeding: [...gameState.roster.breeding, slot] },
    };

    set({ gameState: newGameState });
    get().saveGame();
  },

  collectOffspring(speciesId: string) {
    const { gameState } = get();
    if (!gameState) return;

    const slot = gameState.roster.breeding.find((s) => isBreedingComplete(s));
    if (!slot?.offspringGenome) return;

    const species = SPECIES_BY_ID[speciesId] ?? SPECIES_BY_ID[slot.offspringGenome.speciesId];
    if (!species) return;

    const offspring = coreCollectOffspring(slot, species, Position.Center);
    const webOffspring = { ...offspring, id: makeUnitId() };

    let newGameState = {
      ...gameState,
      roster: {
        ...gameState.roster,
        breeding: gameState.roster.breeding.filter((s) => s !== slot),
      },
    };
    newGameState = { ...newGameState, roster: addToStable(newGameState.roster, webOffspring) };

    set({ gameState: newGameState });
    get().saveGame();
  },

  swapSquadMember(squadIdx: number, stableUnitId: string) {
    const { gameState } = get();
    if (!gameState) return;

    try {
      const newRoster = swapSquadUnit(gameState.roster, squadIdx, stableUnitId);
      set({ gameState: { ...gameState, roster: newRoster } });
      get().saveGame();
    } catch {
      // Invalid swap
    }
  },

  upgradeScannerCapacity() {
    const { gameState } = get();
    if (!gameState) return;

    const result = upgradeScanner(gameState);
    if (!result.success) return;

    set({ gameState: result.newState });
    get().saveGame();
  },

  revealGene(unitId: string, gene: "maxHp" | "speed" | "attackPower") {
    const { gameState } = get();
    if (!gameState) return;

    const unit = findUnit(gameState, unitId);
    if (!unit) return;

    const updatedUnit: Unit = {
      ...unit,
      revealedGenes: { ...unit.revealedGenes, [gene]: true },
    };

    const newGameState = replaceUnit(gameState, updatedUnit);
    set({ gameState: newGameState });
    get().saveGame();
  },
}));

export { SCANNER_MAX_CAPACITY, SCANNER_UPGRADE_COSTS, getScannerUpgradeCost };
