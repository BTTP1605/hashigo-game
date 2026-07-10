import type { Scene } from "../../engine/types";
import { decryptPaidBundle } from "../../engine/crypto";
import prologue from "./free/prologue.json";
import case01 from "./free/case01.json";
import case02 from "./free/case02.json";
import case03 from "./free/case03.json";

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

/** 暗号化済み有料章バンドルを取得し、パスフレーズで復号する。成功で true。 */
export async function loadPaidScenes(passphrase: string): Promise<boolean> {
  if (paidReady) return true;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}scenario/paid.enc`);
    if (!res.ok) return false;
    const buf = await res.arrayBuffer();
    const json = await decryptPaidBundle(buf, passphrase);
    if (json === null) return false;
    const parsed = JSON.parse(json) as Record<string, Scene>;
    paidScenes = parsed;
    paidReady = true;
    return true;
  } catch {
    return false;
  }
}
