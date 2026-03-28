import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { SaveData } from "../core/gameState";

const SAVE_PATH = `${process.cwd()}/saves/save.json`;

export async function saveGameState(data: SaveData): Promise<void> {
  await mkdir(dirname(SAVE_PATH), { recursive: true });
  await Bun.write(SAVE_PATH, JSON.stringify(data, null, 2));
}

export async function loadSave(): Promise<SaveData | null> {
  try {
    const file = Bun.file(SAVE_PATH);
    const exists = await file.exists();
    if (!exists) return null;
    return (await file.json()) as SaveData;
  } catch {
    return null;
  }
}
