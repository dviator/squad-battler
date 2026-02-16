export { simulateBattle, createBattleState, tickBattle } from "./core/battle";
export { createUnit, isAlive, takeDamage } from "./core/unit";
export { breed, createGenome, extractGenome } from "./core/genetics";
export { resolveTargets } from "./core/targeting";
export { logBattle, logSquadStatus } from "./core/logger";

export { ALL_SPECIES, SPECIES_BY_ID, BEAR, EAGLE, TIGER } from "./data/species";
export { ALL_MUTATIONS, MUTATIONS_BY_ID } from "./data/mutations";

export type {
  Unit,
  Species,
  Attack,
  BattleState,
  BattleEvent,
  Mutation,
  Genome,
  Stats,
} from "./core/types";

export { Position, TargetType, BattleEventType } from "./core/types";
