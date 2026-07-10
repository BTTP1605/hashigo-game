import type { Cond, Effects, GameFlags } from "./types";

export interface CondState {
  flags: GameFlags;
  items: string[];
  keywords: string[];
}

export function evalCond(cond: Cond, s: CondState): boolean {
  if ("all" in cond) return cond.all.every((c) => evalCond(c, s));
  if ("any" in cond) return cond.any.some((c) => evalCond(c, s));
  if ("not" in cond) return !evalCond(cond.not, s);
  if ("hasItem" in cond) return s.items.includes(cond.hasItem);
  if ("hasKeyword" in cond) return s.keywords.includes(cond.hasKeyword);

  const v = s.flags[cond.flag];
  if (cond.eq !== undefined) return v === cond.eq;
  const n = typeof v === "number" ? v : v === true ? 1 : 0;
  if (cond.gte !== undefined && !(n >= cond.gte)) return false;
  if (cond.lte !== undefined && !(n <= cond.lte)) return false;
  if (cond.eq === undefined && cond.gte === undefined && cond.lte === undefined) {
    // 条件指定なしは「truthy かどうか」
    return v === true || (typeof v === "number" && v !== 0);
  }
  return true;
}

export interface EffectResult {
  flags: GameFlags;
  items: string[];
  keywords: string[];
  /** この適用で新規に増えたもの（トースト通知用） */
  gainedItems: string[];
  gainedKeywords: string[];
}

export function applyEffects(effects: Effects | undefined, s: CondState): EffectResult {
  const flags = { ...s.flags };
  const items = [...s.items];
  const keywords = [...s.keywords];
  const gainedItems: string[] = [];
  const gainedKeywords: string[] = [];

  if (effects) {
    if (effects.setFlags) {
      for (const [k, v] of Object.entries(effects.setFlags)) flags[k] = v;
    }
    if (effects.addFlags) {
      for (const [k, v] of Object.entries(effects.addFlags)) {
        const cur = flags[k];
        const n = typeof cur === "number" ? cur : cur === true ? 1 : 0;
        flags[k] = n + v;
      }
    }
    if (effects.addItems) {
      for (const it of effects.addItems) {
        if (!items.includes(it)) {
          items.push(it);
          gainedItems.push(it);
        }
      }
    }
    if (effects.addKeywords) {
      for (const kw of effects.addKeywords) {
        if (!keywords.includes(kw)) {
          keywords.push(kw);
          gainedKeywords.push(kw);
        }
      }
    }
  }
  return { flags, items, keywords, gainedItems, gainedKeywords };
}
