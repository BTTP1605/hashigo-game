import type { Scene } from "../../engine/types";
import prologue from "./free/prologue.json";
import case01 from "./free/case01.json";
import case02 from "./free/case02.json";
import case03 from "./free/case03.json";

// この作品のID（サーバーの解錠API・Cookie名と一致させる）
export const GAME_ID = "hashigo";
// 有料シナリオ配信API。本番は同一オリジンの相対パス（/games/api/scenario.php）。
// 開発時は VITE_PAID_API で上書き可能（未設定なら有料章はローカルで読めない＝壁のまま）。
const PAID_API =
  import.meta.env.VITE_PAID_API ?? `${import.meta.env.BASE_URL}../api/scenario.php`;

const freeScenes: Record<string, Scene> = {
  prologue: prologue as unknown as Scene,
  case01: case01 as unknown as Scene,
  case02: case02 as unknown as Scene,
  case03: case03 as unknown as Scene,
};

export const PAID_SCENE_IDS = ["case04", "case05", "case06", "case07", "final"];

let paidScenes: Record<string, Scene> = {};
let paidReady = false;

export function isPaidScene(sceneId: string): boolean {
  return PAID_SCENE_IDS.includes(sceneId);
}

export function isPaidLoaded(): boolean {
  return paidReady;
}

export function getScene(sceneId: string): Scene | null {
  return freeScenes[sceneId] ?? paidScenes[sceneId] ?? null;
}

/**
 * 有料章をサーバーから取得する。解錠Cookieを持つ端末だけが200で受け取れる。
 * 未解錠（403）やネットワーク失敗では false を返す。成功後はキャッシュする。
 */
export async function loadPaidScenes(): Promise<boolean> {
  if (paidReady) return true;
  try {
    const res = await fetch(`${PAID_API}?g=${GAME_ID}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return false;
    const parsed = (await res.json()) as Record<string, Scene>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
    paidScenes = parsed;
    paidReady = true;
    return true;
  } catch {
    return false;
  }
}
