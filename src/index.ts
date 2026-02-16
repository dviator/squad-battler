export { createBattleState, simulateBattle, tickBattle } from "./core/battle";
export { breed, createGenome, extractGenome } from "./core/genetics";
export { logBattle, logSquadStatus } from "./core/logger";
export { resolveTargets } from "./core/targeting";
export type {
  Attack,
  BattleEvent,
  BattleState,
  Genome,
  Mutation,
  Species,
  Stats,
  Unit,
} from "./core/types";
export { BattleEventType, Position, TargetType } from "./core/types";
export { createUnit, isAlive, takeDamage } from "./core/unit";
export { ALL_MUTATIONS, MUTATIONS_BY_ID } from "./data/mutations";
export { ALL_SPECIES, BEAR, EAGLE, SPECIES_BY_ID, TIGER } from "./data/species";
