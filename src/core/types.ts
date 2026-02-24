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
  RightEnemy = "right_enemy", // Attack enemy to the right
  LeftEnemy = "left_enemy", // Attack enemy to the left
}

export const StatsSchema = z.object({
  maxHp: z.number().positive(),
  currentHp: z.number().nonnegative(),
  speed: z.number().positive(),
  attackPower: z.number().nonnegative(),
});

export type Stats = z.infer<typeof StatsSchema>;

export enum AttackSpecialEffect {
  SwarmStrike = "swarm_strike",
}

export const AttackSchema = z.object({
  id: z.string(),
  name: z.string(),
  baseCooldown: z.number().positive().int(),
  targetType: z.nativeEnum(TargetType),
  damageMultiplier: z.number().positive(),
  isAoe: z.boolean().default(false),
  specialEffect: z.nativeEnum(AttackSpecialEffect).optional(),
});

export type Attack = z.infer<typeof AttackSchema>;

export const AttackTimerSchema = z.object({
  attackId: z.string(),
  currentCooldown: z.number().nonnegative().int(),
});

export type AttackTimer = z.infer<typeof AttackTimerSchema>;

// Genetic Potential grades (S > A > B > C > D > F)
export enum GeneticGrade {
  S = "S",
  A = "A",
  B = "B",
  C = "C",
  D = "D",
  F = "F",
}

export const GeneticPotentialSchema = z.object({
  maxHp: z.nativeEnum(GeneticGrade),
  speed: z.nativeEnum(GeneticGrade),
  attackPower: z.nativeEnum(GeneticGrade),
});

export type GeneticPotential = z.infer<typeof GeneticPotentialSchema>;

// Life stages based on age
export enum LifeStage {
  Young = "young",
  Adult = "adult",
  Elderly = "elderly",
  Dead = "dead",
}

export const UnitSchema = z.object({
  id: z.string(),
  speciesId: z.string(),
  stats: StatsSchema,
  attacks: z.array(AttackSchema),
  attackTimers: z.array(AttackTimerSchema),
  position: z.nativeEnum(Position),
  mutations: z.array(z.string()).default([]),
  level: z.number().positive().int().default(1),
  xp: z.number().nonnegative().int().default(0),
  age: z.number().nonnegative().default(0), // in days
  lifeStage: z.nativeEnum(LifeStage).default(LifeStage.Young),
  geneticPotential: GeneticPotentialSchema,
  equipment: z.array(z.string()).default([]), // Equipment item IDs for this run
  cooldownReduction: z.number().nonnegative().default(0), // Temporary run-scoped cooldown reduction
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
  combatEffectStates: z.array(z.any()).optional(),
  lastAttackedTargetId: z.record(z.string(), z.string()).optional(),
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
  potential: GeneticPotentialSchema,
});

export type Genome = z.infer<typeof GenomeSchema>;

// Currencies
export const CurrencySchema = z.object({
  gold: z.number().nonnegative().int(),
  materials: z.number().nonnegative().int(),
});

export type Currency = z.infer<typeof CurrencySchema>;

// Shop Items
export enum ItemCategory {
  Consumable = "consumable",
  GeneticMod = "genetic_mod",
  Equipment = "equipment", // Lasts for the run, expires after
}

export enum ConsumableEffect {
  HealHealth = "heal_health",
  BoostStats = "boost_stats",
  ReduceCooldowns = "reduce_cooldowns",
}

export enum EquipmentEffect {
  BlockFirstAttack = "block_first_attack", // Bubble Shield
  InitiativeBoost = "initiative_boost", // Speed boost for all combats
  TeamDamageReduction = "team_damage_reduction", // Reduce damage for whole squad
  AttackRedirect = "attack_redirect", // Laser Pointer - confuse targeting
  PerfectDodge = "perfect_dodge", // Avoid one attack per combat
  RetaliationSpikes = "retaliation_spikes", // Deal damage when hit
}

export const ShopItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.nativeEnum(ItemCategory),
  cost: z.number().positive().int(),
  effect: z.any(), // Will be typed based on category
});

export type ShopItem = z.infer<typeof ShopItemSchema>;

// Consumable items (run-scoped effects)
export type ConsumableItem = ShopItem & {
  category: ItemCategory.Consumable;
  effect:
    | { type: ConsumableEffect.HealHealth; amount: number }
    | {
        type: ConsumableEffect.BoostStats;
        stats: Partial<Omit<Stats, "currentHp">>;
        duration: "next_battle" | "permanent";
      }
    | { type: ConsumableEffect.ReduceCooldowns; amount: number; duration: "next_battle" };
};

// Genetic mod items (permanent genome changes)
export type GeneticModItem = ShopItem & {
  category: ItemCategory.GeneticMod;
  effect:
    | { type: "add_mutation"; mutationId: string }
    | { type: "boost_potential"; stat: keyof GeneticPotential; amount: number };
};

// Equipment items (lasts for the run, expires after)
export type EquipmentItem = ShopItem & {
  category: ItemCategory.Equipment;
  effect:
    | { type: EquipmentEffect.BlockFirstAttack } // Blocks first attack each combat
    | { type: EquipmentEffect.InitiativeBoost; amount: number } // +Speed for all combats
    | { type: EquipmentEffect.TeamDamageReduction; percent: number } // % damage reduction
    | { type: EquipmentEffect.AttackRedirect; chance: number } // % chance to confuse enemies
    | { type: EquipmentEffect.PerfectDodge } // Dodge one attack per combat
    | { type: EquipmentEffect.RetaliationSpikes; damage: number }; // Damage when hit
};
