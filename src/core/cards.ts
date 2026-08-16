import { z } from "zod";
import { TargetType } from "./types";

export const CardTopFaceSchema = z.object({
  damageMultiplier: z.number().positive(),
  targetType: z.nativeEnum(TargetType),
});

export type CardTopFace = z.infer<typeof CardTopFaceSchema>;

export const CardBottomFaceSchema = z.object({
  type: z.enum(["defend", "move", "utility"]),
  value: z.number(),
});

export type CardBottomFace = z.infer<typeof CardBottomFaceSchema>;

// Union schema covering both face variants
export const CardFaceSchema = z.union([CardTopFaceSchema, CardBottomFaceSchema]);

export type CardFace = z.infer<typeof CardFaceSchema>;

export const CardSchema = z.object({
  id: z.string(),
  name: z.string(),
  top: CardTopFaceSchema,
  bottom: CardBottomFaceSchema,
  speciesId: z.string(),
});

export type Card = z.infer<typeof CardSchema>;

export const DeckSchema = z.array(CardSchema);

export type Deck = z.infer<typeof DeckSchema>;
