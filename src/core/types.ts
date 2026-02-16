import { z } from "zod";

export enum Position {
  Left = 0,
  Center = 1,
  Right = 2,
}

export enum TargetType {
  OppositeEnemy = "opposite_enemy",
  LowestHpEnemy = "lowest_hp_enemy",
  AllEnemies = "all_enemies",
  RandomEnemy = "random_enemy",
  LeftAlly = "left_ally",
  RightAlly = "right_ally",
}

export const StatsSchema = z.object({
  maxHp: z.number().positive(),
  currentHp: z.number().nonnegative(),
  speed: z.number().positive(),
  attackPower: z.number().nonnegative(),
});

export type Stats = z.infer<typeof StatsSchema>;

export const AttackSchema = z.object({
  id: z.string(),
  name: z.string(),
  baseCooldown: z.number().positive().int(),
  targetType: z.nativeEnum(TargetType),
  damageMultiplier: z.number().positive(),
  isAoe: z.boolean().default(false),
});

export type Attack = z.infer<typeof AttackSchema>;

export const AttackTimerSchema = z.object({
  attackId: z.string(),
  currentCooldown: z.number().nonnegative().int(),
});

export type AttackTimer = z.infer<typeof AttackTimerSchema>;

export const UnitSchema = z.object({
  id: z.string(),
  speciesId: z.string(),
  stats: StatsSchema,
  attacks: z.array(AttackSchema),
  attackTimers: z.array(AttackTimerSchema),
  position: z.nativeEnum(Position),
  mutations: z.array(z.string()).default([]),
});

export type Unit = z.infer<typeof UnitSchema>;

export const SpeciesSchema = z.object({
  id: z.string(),
  name: z.string(),
  baseStats: StatsSchema.omit({ currentHp: true }),
  attacks: z.array(AttackSchema),
  description: z.string().optional(),
});

export type Species = z.infer<typeof SpeciesSchema>;

export enum BattleEventType {
  BattleStart = "battle_start",
  Tick = "tick",
  AttackExecuted = "attack_executed",
  Damage = "damage",
  UnitDied = "unit_died",
  BattleEnd = "battle_end",
}

export type BattleEvent =
  | { type: BattleEventType.BattleStart; tick: number }
  | { type: BattleEventType.Tick; tick: number }
  | {
      type: BattleEventType.AttackExecuted;
      tick: number;
      attackerId: string;
      attackName: string;
      targetIds: string[];
    }
  | {
      type: BattleEventType.Damage;
      tick: number;
      targetId: string;
      damage: number;
      remainingHp: number;
    }
  | { type: BattleEventType.UnitDied; tick: number; unitId: string }
  | {
      type: BattleEventType.BattleEnd;
      tick: number;
      winner: "player" | "enemy";
      survivors: string[];
    };

export const BattleStateSchema = z.object({
  tick: z.number().nonnegative().int(),
  playerUnits: z.array(UnitSchema),
  enemyUnits: z.array(UnitSchema),
  events: z.array(z.any()),
  isComplete: z.boolean(),
  winner: z.enum(["player", "enemy"]).nullable(),
});

export type BattleState = z.infer<typeof BattleStateSchema>;

export const MutationSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  statModifiers: z
    .object({
      maxHp: z.number().optional(),
      speed: z.number().optional(),
      attackPower: z.number().optional(),
    })
    .optional(),
  attackModifiers: z
    .array(
      z.object({
        attackId: z.string(),
        cooldownModifier: z.number().optional(),
        damageModifier: z.number().optional(),
      }),
    )
    .optional(),
});

export type Mutation = z.infer<typeof MutationSchema>;

export const GenomeSchema = z.object({
  speciesId: z.string(),
  mutations: z.array(z.string()),
  generation: z.number().nonnegative().int(),
  parentIds: z.array(z.string()).optional(),
});

export type Genome = z.infer<typeof GenomeSchema>;
