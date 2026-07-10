// シナリオデータの型定義。JSONシナリオはこのスキーマに従う。

export type FlagValue = number | boolean;
export type GameFlags = Record<string, FlagValue>;

export interface Effects {
  /** フラグを指定値に設定 */
  setFlags?: Record<string, FlagValue>;
  /** 数値フラグに加算（未定義なら0起点） */
  addFlags?: Record<string, number>;
  addItems?: string[];
  addKeywords?: string[];
}

export type Cond =
  | { flag: string; eq?: FlagValue; gte?: number; lte?: number }
  | { hasItem: string }
  | { hasKeyword: string }
  | { all: Cond[] }
  | { any: Cond[] }
  | { not: Cond };

export interface ChoiceOption {
  label: string;
  goto: string;
  /** 条件を満たすときだけ表示 */
  if?: Cond;
  effects?: Effects;
}

export interface BbsMeta {
  no: number;
  handle: string;
  date?: string;
}

export type ScenarioNode =
  | { id: string; type: "chapter"; title: string; subtitle?: string }
  | { id: string; type: "bg"; value: string }
  | {
      id: string;
      type: "text";
      speaker?: string;
      text: string;
      portrait?: string;
      bbs?: BbsMeta;
      effects?: Effects;
      next?: string;
    }
  | { id: string; type: "choice"; prompt?: string; options: ChoiceOption[] }
  | { id: string; type: "branch"; if: Cond; then: string; else: string }
  | { id: string; type: "deduction"; deductionId: string }
  | { id: string; type: "jump"; scene: string }
  | { id: string; type: "ending"; endingId: string };

export interface Scene {
  sceneId: string;
  title: string;
  nodes: ScenarioNode[];
}

// 推理パートの定義（deductions.json）
export type DeductionPart =
  | { t: "text"; v: string }
  | { t: "blank"; answer: string };

export interface Deduction {
  id: string;
  title: string;
  intro: string;
  parts: DeductionPart[];
  hint: string;
  success: string[];
  failure: string;
  /** ノーミスで正解したときのみ適用される */
  perfectEffects?: Effects;
  effects?: Effects;
}

export interface KeywordDef {
  id: string;
  label: string;
  desc: string;
}

export interface ItemDef {
  id: string;
  name: string;
  desc: string;
}

export interface CharacterDef {
  id: string;
  name: string;
  color: string;
}

export interface EndingDef {
  id: string;
  code: string;
  title: string;
  desc: string;
}
