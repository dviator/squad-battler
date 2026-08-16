import type { Deck } from "../core/cards";
import { TargetType } from "../core/types";

export const BEAR_DECK: Deck = [
  {
    id: "bear_card_maul",
    name: "Crushing Blow",
    top: { damageMultiplier: 3.5, targetType: TargetType.OppositeEnemy },
    bottom: { type: "defend", value: 5 },
    speciesId: "bear",
  },
  {
    id: "bear_card_roar",
    name: "Roar & Steady",
    top: { damageMultiplier: 0.8, targetType: TargetType.AllEnemies },
    bottom: { type: "utility", value: 8 },
    speciesId: "bear",
  },
  {
    id: "bear_card_hug",
    name: "Wild Grab",
    top: { damageMultiplier: 2.0, targetType: TargetType.RandomEnemy },
    bottom: { type: "move", value: 1 },
    speciesId: "bear",
  },
  {
    id: "bear_card_greedy",
    name: "All-In Maul",
    top: { damageMultiplier: 4.5, targetType: TargetType.OppositeEnemy },
    bottom: { type: "utility", value: 1 },
    speciesId: "bear",
  },
];

export const EAGLE_DECK: Deck = [
  {
    id: "eagle_card_dive",
    name: "Dive Strike",
    top: { damageMultiplier: 3.5, targetType: TargetType.OppositeEnemy },
    bottom: { type: "defend", value: 4 },
    speciesId: "eagle",
  },
  {
    id: "eagle_card_talon",
    name: "Talon & Glide",
    top: { damageMultiplier: 1.8, targetType: TargetType.LowestHpEnemy },
    bottom: { type: "utility", value: 7 },
    speciesId: "eagle",
  },
  {
    id: "eagle_card_strafe",
    name: "Wing Sweep",
    top: { damageMultiplier: 1.5, targetType: TargetType.RightEnemy },
    bottom: { type: "move", value: 1 },
    speciesId: "eagle",
  },
  {
    id: "eagle_card_greedy",
    name: "Death Dive",
    top: { damageMultiplier: 5.0, targetType: TargetType.LowestHpEnemy },
    bottom: { type: "utility", value: 1 },
    speciesId: "eagle",
  },
];

export const TIGER_DECK: Deck = [
  {
    id: "tiger_card_pounce",
    name: "Pounce & Guard",
    top: { damageMultiplier: 3.5, targetType: TargetType.OppositeEnemy },
    bottom: { type: "defend", value: 5 },
    speciesId: "tiger",
  },
  {
    id: "tiger_card_bite",
    name: "Savage Bite",
    top: { damageMultiplier: 2.5, targetType: TargetType.RandomEnemy },
    bottom: { type: "utility", value: 6 },
    speciesId: "tiger",
  },
  {
    id: "tiger_card_rake",
    name: "Rake & Shift",
    top: { damageMultiplier: 1.4, targetType: TargetType.LeftEnemy },
    bottom: { type: "move", value: 1 },
    speciesId: "tiger",
  },
  {
    id: "tiger_card_greedy",
    name: "Feral Frenzy",
    top: { damageMultiplier: 4.0, targetType: TargetType.RandomEnemy },
    bottom: { type: "utility", value: 1 },
    speciesId: "tiger",
  },
];

export const ALL_DECKS: Record<string, Deck> = {
  bear: BEAR_DECK,
  eagle: EAGLE_DECK,
  tiger: TIGER_DECK,
};
