import type { GameFlags } from "./types";

// LocalStorageキーの作品別プレフィックス。同一オリジン（GitHub Pagesの同一ユーザー）で
// 複数作品を公開してもセーブ・エンディング・解錠状態が衝突しないよう、作品ごとに一意にする。
// ※hashigoは既公開プレイヤーのセーブを維持するため従来キーのまま。
export const GAME_KEY = "hashigo";

export interface SaveData {
  version: 1;
  timestamp: number;
  sceneId: string;
  nodeId: string;
  chapterTitle: string;
  bg: string;
  flags: GameFlags;
  items: string[];
  keywords: string[];
}

export type SlotId = 0 | 1 | 2 | "auto";

const keyOf = (slot: SlotId) => `${GAME_KEY}_save_${slot}`;

export function saveGame(slot: SlotId, data: SaveData): void {
  try {
    localStorage.setItem(keyOf(slot), JSON.stringify(data));
  } catch {
    // 容量超過等は黙殺（ゲーム進行を止めない）
  }
}

export function loadGame(slot: SlotId): SaveData | null {
  try {
    const raw = localStorage.getItem(keyOf(slot));
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

export function deleteSave(slot: SlotId): void {
  localStorage.removeItem(keyOf(slot));
}

export function listSaves(): { slot: SlotId; data: SaveData | null }[] {
  const slots: SlotId[] = ["auto", 0, 1, 2];
  return slots.map((slot) => ({ slot, data: loadGame(slot) }));
}

// ===== 周回をまたいで永続化する記録（エンディング・解錠コード） =====

export function getSeenEndings(): string[] {
  try {
    return JSON.parse(localStorage.getItem(`${GAME_KEY}_endings`) ?? "[]");
  } catch {
    return [];
  }
}

export function addSeenEnding(id: string): string[] {
  const seen = getSeenEndings();
  if (!seen.includes(id)) seen.push(id);
  localStorage.setItem(`${GAME_KEY}_endings`, JSON.stringify(seen));
  return seen;
}

export function getStoredPassphrase(): string | null {
  return localStorage.getItem(`${GAME_KEY}_unlock`);
}

export function storePassphrase(pass: string): void {
  localStorage.setItem(`${GAME_KEY}_unlock`, pass);
}
