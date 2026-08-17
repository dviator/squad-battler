import { z } from "zod";
import { type Deck, DeckSchema } from "./cards";
import { Position, TargetType } from "./types";

const DEFAULT_ATTACK_POWER = 10;

export const SquadSlotSchema = z.object({
  position: z.nativeEnum(Position),
  speciesId: z.string(),
  attackPower: z.number().positive(),
});
export type SquadSlot = z.infer<typeof SquadSlotSchema>;

export const CardChoiceSchema = z.object({
  cardId: z.string(),
  face: z.enum(["top", "bottom"]),
});
export type CardChoice = z.infer<typeof CardChoiceSchema>;

export const CardCombatStateSchema = z.object({
  playerDeck: DeckSchema,
  playerDiscard: DeckSchema,
  enemyDeck: DeckSchema,
  enemyDiscard: DeckSchema,
  playerHand: DeckSchema,
  enemyHand: DeckSchema,
  playerSlots: z.array(SquadSlotSchema),
  enemySlots: z.array(SquadSlotSchema),
  enemyIntents: z.array(CardChoiceSchema),
  playerSquadHp: z.number().nonnegative(),
  enemySquadHp: z.number().nonnegative(),
  turnNumber: z.number().nonnegative().int(),
  isComplete: z.boolean(),
  winner: z.enum(["player", "enemy"]).nullable(),
});
export type CardCombatState = z.infer<typeof CardCombatStateSchema>;

const SLOT_POSITIONS = [Position.Left, Position.Center, Position.Right] as const;

function deriveSlots(deck: Deck): SquadSlot[] {
  const seen = new Set<string>();
  const slots: SquadSlot[] = [];
  for (const card of deck) {
    if (!seen.has(card.speciesId)) {
      seen.add(card.speciesId);
      slots.push({
        position: SLOT_POSITIONS[slots.length] ?? Position.Left,
        speciesId: card.speciesId,
        attackPower: DEFAULT_ATTACK_POWER,
      });
    }
    if (slots.length === 3) break;
  }
  return slots;
}

export function createCardCombatState(
  playerDeck: Deck,
  enemyDeck: Deck,
  playerTotalHp: number,
  enemyTotalHp: number,
): CardCombatState {
  return {
    playerDeck,
    playerDiscard: [],
    enemyDeck,
    enemyDiscard: [],
    playerHand: [],
    enemyHand: [],
    playerSlots: deriveSlots(playerDeck),
    enemySlots: deriveSlots(enemyDeck),
    enemyIntents: [],
    playerSquadHp: playerTotalHp,
    enemySquadHp: enemyTotalHp,
    turnNumber: 0,
    isComplete: false,
    winner: null,
  };
}

function drawCards(
  deck: Deck,
  discard: Deck,
  count: number,
): { hand: Deck; deck: Deck; discard: Deck } {
  let workingDeck = [...deck];
  let workingDiscard = [...discard];

  if (workingDeck.length < count) {
    workingDeck = [...workingDeck, ...workingDiscard];
    workingDiscard = [];
  }

  return {
    hand: workingDeck.slice(0, count),
    deck: workingDeck.slice(count),
    discard: workingDiscard,
  };
}

// Draws 3 cards for both player and enemy, and generates enemy intents.
// Enemy intents (telegraphed actions) are visible before the player picks their own faces.
export function drawHand(state: CardCombatState): CardCombatState {
  const {
    hand: playerHand,
    deck: playerDeck,
    discard: playerDiscard,
  } = drawCards(state.playerDeck, state.playerDiscard, 3);

  const {
    hand: enemyHand,
    deck: enemyDeck,
    discard: enemyDiscard,
  } = drawCards(state.enemyDeck, state.enemyDiscard, 3);

  // Simple default AI: always attack (top face). Ticket #29 wires a real CombatPolicy.
  const enemyIntents: CardChoice[] = enemyHand.map((card) => ({
    cardId: card.id,
    face: "top" as const,
  }));

  return {
    ...state,
    playerDeck,
    playerDiscard,
    playerHand,
    enemyDeck,
    enemyDiscard,
    enemyHand,
    enemyIntents,
    turnNumber: state.turnNumber + 1,
  };
}

// Resolves a directional target type from the attacker's position against the given slots.
// Returns the position of the slot that would be hit, or null if no valid target exists.
export function resolveCardTarget(
  attackerPosition: Position,
  targetType: TargetType,
  targetSlots: SquadSlot[],
): Position | null {
  if (targetSlots.length === 0) return null;

  const fallback = targetSlots[0]!.position;

  switch (targetType) {
    case TargetType.OppositeEnemy: {
      const hit = targetSlots.find((s) => s.position === attackerPosition);
      return hit?.position ?? fallback;
    }
    case TargetType.LowestHpEnemy:
    case TargetType.RandomEnemy:
      // Shared HP pool — no per-slot HP; fall through to first slot
      return fallback;
    case TargetType.AllEnemies:
      // All positions are hit; damage is to the shared pool (tracked by caller)
      return fallback;
    case TargetType.RightEnemy: {
      const hit = targetSlots.find((s) => s.position === (attackerPosition as number) + 1);
      return hit?.position ?? fallback;
    }
    case TargetType.LeftEnemy: {
      const hit = targetSlots.find((s) => s.position === (attackerPosition as number) - 1);
      return hit?.position ?? fallback;
    }
    case TargetType.LeftAlly:
    case TargetType.RightAlly:
      return null;
    default:
      return null;
  }
}

// Applies player choices and enemy intents simultaneously, then moves all played cards
// to their respective discards. Move bottom faces do not currently shift slot positions;
// that interaction will be resolved when positional repositioning is designed.
export function resolveChoices(state: CardCombatState, choices: CardChoice[]): CardCombatState {
  let playerDamage = 0;
  let playerDefense = 0;

  for (const choice of choices) {
    const card = state.playerHand.find((c) => c.id === choice.cardId);
    if (!card) continue;
    const slot = state.playerSlots.find((s) => s.speciesId === card.speciesId);
    const ap = slot?.attackPower ?? DEFAULT_ATTACK_POWER;

    if (choice.face === "top") {
      playerDamage += card.top.damageMultiplier * ap;
    } else if (card.bottom.type === "defend") {
      playerDefense += card.bottom.value;
    }
  }

  let enemyDamage = 0;
  let enemyDefense = 0;

  for (const intent of state.enemyIntents) {
    const card = state.enemyHand.find((c) => c.id === intent.cardId);
    if (!card) continue;
    const slot = state.enemySlots.find((s) => s.speciesId === card.speciesId);
    const ap = slot?.attackPower ?? DEFAULT_ATTACK_POWER;

    if (intent.face === "top") {
      enemyDamage += card.top.damageMultiplier * ap;
    } else if (card.bottom.type === "defend") {
      enemyDefense += card.bottom.value;
    }
  }

  const newEnemyHp = Math.max(0, state.enemySquadHp - Math.max(0, playerDamage - enemyDefense));
  const newPlayerHp = Math.max(0, state.playerSquadHp - Math.max(0, enemyDamage - playerDefense));

  const playedIds = new Set(choices.map((c) => c.cardId));
  const enemyPlayedIds = new Set(state.enemyIntents.map((c) => c.cardId));

  const playerDiscard = [
    ...state.playerDiscard,
    ...state.playerHand.filter((c) => playedIds.has(c.id)),
  ];
  const enemyDiscard = [
    ...state.enemyDiscard,
    ...state.enemyHand.filter((c) => enemyPlayedIds.has(c.id)),
  ];

  const isComplete = newEnemyHp <= 0 || newPlayerHp <= 0;
  // Player wins on simultaneous 0-HP (both squads eliminated same turn)
  const winner: "player" | "enemy" | null = isComplete
    ? newEnemyHp <= 0
      ? "player"
      : "enemy"
    : null;

  return {
    ...state,
    playerHand: [],
    enemyHand: [],
    enemyIntents: [],
    playerDiscard,
    enemyDiscard,
    playerSquadHp: newPlayerHp,
    enemySquadHp: newEnemyHp,
    isComplete,
    winner,
  };
}
