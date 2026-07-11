import { create } from "zustand";
import type {
  ChoiceOption,
  Deduction,
  GameFlags,
  ScenarioNode,
} from "../engine/types";
import { applyEffects, evalCond, type CondState } from "../engine/conditions";
import {
  getScene,
  isPaidLoaded,
  isPaidScene,
  loadPaidScenes,
} from "../data/scenario";
import {
  addSeenEnding,
  getSeenEndings,
  getStoredPassphrase,
  loadGame,
  saveGame,
  storePassphrase,
  type SaveData,
  type SlotId,
} from "../engine/saveSystem";
import keywordDefs from "../data/keywords.json";
import itemDefs from "../data/items.json";
import { audio, BGM_BY_BG } from "../engine/audio";

export type Screen = "title" | "game" | "unlock" | "ending";
export type Overlay = null | "backlog" | "file" | "save" | "load";

export interface BacklogEntry {
  speaker?: string;
  text: string;
}

interface GameStore {
  screen: Screen;
  overlay: Overlay;
  sceneId: string;
  nodeIndex: number;
  flags: GameFlags;
  items: string[];
  keywords: string[];
  backlog: BacklogEntry[];
  bg: string;
  chapterTitle: string;
  endingsSeen: string[];
  endingId: string | null;
  paidReady: boolean;
  pendingScene: string | null;
  pendingSave: SaveData | null;
  toasts: { id: number; text: string }[];
  autoMode: boolean;
  skipMode: boolean;
  soundOn: boolean;

  init: () => void;
  startNew: () => void;
  advance: () => void;
  choose: (option: ChoiceOption) => void;
  completeDeduction: (ded: Deduction, perfect: boolean) => void;
  setOverlay: (o: Overlay) => void;
  saveSlot: (slot: SlotId) => void;
  loadSlot: (slot: SlotId) => void;
  backToTitle: () => void;
  finishEnding: () => void;
  unlock: (passphrase: string) => Promise<boolean>;
  dismissToast: (id: number) => void;
  toggleAuto: () => void;
  toggleSkip: () => void;
  cancelModes: () => void;
  toggleSound: () => void;
}

let toastSeq = 1;

function condState(s: Pick<GameStore, "flags" | "items" | "keywords">): CondState {
  return { flags: s.flags, items: s.items, keywords: s.keywords };
}

function labelOfKeyword(id: string): string {
  return keywordDefs.find((k) => k.id === id)?.label ?? id;
}

function labelOfItem(id: string): string {
  return itemDefs.find((i) => i.id === id)?.name ?? id;
}

export const useGameStore = create<GameStore>((set, get) => {
  /** 効果を適用し、入手トーストを積む */
  function runEffects(effects: Parameters<typeof applyEffects>[0]): void {
    const s = get();
    const r = applyEffects(effects, condState(s));
    const toasts = [...s.toasts];
    for (const kw of r.gainedKeywords) {
      toasts.push({ id: toastSeq++, text: `手がかり：${labelOfKeyword(kw)}` });
    }
    for (const it of r.gainedItems) {
      toasts.push({ id: toastSeq++, text: `証拠品：${labelOfItem(it)}` });
    }
    if (r.gainedKeywords.length > 0 || r.gainedItems.length > 0) {
      audio.playSe("se_get");
    }
    set({ flags: r.flags, items: r.items, keywords: r.keywords, toasts });
  }

  function makeSaveData(): SaveData {
    const s = get();
    return {
      version: 1,
      timestamp: Date.now(),
      sceneId: s.sceneId,
      nodeId: getScene(s.sceneId)?.nodes[s.nodeIndex]?.id ?? "",
      chapterTitle: s.chapterTitle,
      bg: s.bg,
      flags: s.flags,
      items: s.items,
      keywords: s.keywords,
    };
  }

  function indexOfNode(nodes: ScenarioNode[], id: string): number {
    const i = nodes.findIndex((n) => n.id === id);
    if (i < 0) console.error(`scenario node not found: ${id}`);
    return i;
  }

  function gotoScene(sceneId: string): void {
    if (isPaidScene(sceneId) && !get().paidReady) {
      // 体験版の壁。解錠画面へ。
      saveGame("auto", { ...makeSaveData() });
      set({ pendingScene: sceneId, screen: "unlock" });
      return;
    }
    const scene = getScene(sceneId);
    if (!scene) {
      console.error(`scene not found: ${sceneId}`);
      set({ screen: "title" });
      return;
    }
    set({ sceneId });
    processFrom(0);
  }

  /** index から自動ノードを消化し、表示すべきノードで停止する */
  function processFrom(startIndex: number): void {
    const scene = getScene(get().sceneId);
    if (!scene) return;
    let idx = startIndex;
    let guard = 0;

    while (guard++ < 1000) {
      const node = scene.nodes[idx];
      if (!node) {
        // シーン末尾。安全側でタイトルへ。
        set({ screen: "title" });
        return;
      }
      switch (node.type) {
        case "bg":
          set({ bg: node.value });
          audio.playBgm(BGM_BY_BG[node.value] ?? null);
          idx++;
          continue;
        case "branch": {
          const target = evalCond(node.if, condState(get())) ? node.then : node.else;
          const i = indexOfNode(scene.nodes, target);
          if (i < 0) return;
          idx = i;
          continue;
        }
        case "jump":
          gotoScene(node.scene);
          return;
        case "chapter":
          set({ nodeIndex: idx, chapterTitle: `${node.title} ${node.subtitle ?? ""}`.trim() });
          audio.playSe("se_chapter");
          saveGame("auto", makeSaveData());
          return;
        case "text": {
          if (node.effects) runEffects(node.effects);
          const backlog = [...get().backlog, { speaker: node.speaker ?? node.bbs?.handle, text: node.text }].slice(-200);
          set({ nodeIndex: idx, backlog });
          saveGame("auto", makeSaveData());
          return;
        }
        case "choice":
        case "deduction":
          set({ nodeIndex: idx });
          saveGame("auto", makeSaveData());
          return;
        case "ending": {
          const seen = addSeenEnding(node.endingId);
          audio.playBgm("bgm_ending");
          set({ endingId: node.endingId, endingsSeen: seen, screen: "ending" });
          return;
        }
      }
    }
    console.error("scenario runaway loop detected");
  }

  return {
    screen: "title",
    overlay: null,
    sceneId: "prologue",
    nodeIndex: 0,
    flags: {},
    items: [],
    keywords: [],
    backlog: [],
    bg: "bg_black",
    chapterTitle: "",
    endingsSeen: [],
    endingId: null,
    paidReady: false,
    pendingScene: null,
    pendingSave: null,
    toasts: [],
    autoMode: false,
    skipMode: false,
    soundOn: audio.enabled,

    init: () => {
      set({ endingsSeen: getSeenEndings() });
      const pass = getStoredPassphrase();
      if (pass) {
        loadPaidScenes(pass).then((ok) => {
          if (ok) set({ paidReady: true });
        });
      }
    },

    startNew: () => {
      set({
        sceneId: "prologue",
        nodeIndex: 0,
        flags: {},
        items: [],
        keywords: [],
        backlog: [],
        bg: "bg_black",
        chapterTitle: "",
        endingId: null,
        overlay: null,
        toasts: [],
        screen: "game",
      });
      processFrom(0);
    },

    advance: () => {
      const s = get();
      if (s.overlay) return;
      const scene = getScene(s.sceneId);
      const node = scene?.nodes[s.nodeIndex];
      if (!scene || !node) return;
      if (node.type === "text" && node.next) {
        const i = indexOfNode(scene.nodes, node.next);
        if (i >= 0) processFrom(i);
        return;
      }
      if (node.type === "text" || node.type === "chapter") {
        processFrom(s.nodeIndex + 1);
      }
    },

    choose: (option) => {
      const s = get();
      const scene = getScene(s.sceneId);
      if (!scene) return;
      if (option.effects) runEffects(option.effects);
      const backlog = [...get().backlog, { speaker: "▶ 選択", text: option.label }].slice(-200);
      set({ backlog });
      const i = indexOfNode(scene.nodes, option.goto);
      if (i >= 0) processFrom(i);
    },

    completeDeduction: (ded, perfect) => {
      if (ded.effects) runEffects(ded.effects);
      if (perfect && ded.perfectEffects) runEffects(ded.perfectEffects);
      processFrom(get().nodeIndex + 1);
    },

    setOverlay: (o) => {
      if (o !== null) audio.playSe("se_page");
      set({ overlay: o });
    },

    saveSlot: (slot) => {
      saveGame(slot, makeSaveData());
      set({ overlay: null });
    },

    loadSlot: (slot) => {
      const data = loadGame(slot);
      if (!data) return;
      if (isPaidScene(data.sceneId) && !get().paidReady) {
        set({ pendingSave: data, screen: "unlock" });
        return;
      }
      const scene = getScene(data.sceneId);
      if (!scene) return;
      const idx = scene.nodes.findIndex((n) => n.id === data.nodeId);
      set({
        sceneId: data.sceneId,
        nodeIndex: idx >= 0 ? idx : 0,
        flags: data.flags,
        items: data.items,
        keywords: data.keywords,
        bg: data.bg,
        chapterTitle: data.chapterTitle,
        backlog: [],
        overlay: null,
        endingId: null,
        screen: "game",
      });
      audio.playBgm(BGM_BY_BG[data.bg] ?? null);
    },

    backToTitle: () => {
      saveGame("auto", makeSaveData());
      set({ screen: "title", overlay: null });
    },

    finishEnding: () => {
      set({ screen: "title", endingId: null });
    },

    unlock: async (passphrase) => {
      const ok = await loadPaidScenes(passphrase);
      if (!ok) return false;
      storePassphrase(passphrase);
      set({ paidReady: true });
      const s = get();
      if (s.pendingSave) {
        const data = s.pendingSave;
        set({ pendingSave: null });
        const scene = getScene(data.sceneId);
        if (scene) {
          const idx = scene.nodes.findIndex((n) => n.id === data.nodeId);
          set({
            sceneId: data.sceneId,
            nodeIndex: idx >= 0 ? idx : 0,
            flags: data.flags,
            items: data.items,
            keywords: data.keywords,
            bg: data.bg,
            chapterTitle: data.chapterTitle,
            backlog: [],
            screen: "game",
          });
        }
        return true;
      }
      if (s.pendingScene) {
        const target = s.pendingScene;
        set({ pendingScene: null, screen: "game" });
        gotoScene(target);
        return true;
      }
      set({ screen: "title" });
      return true;
    },

    dismissToast: (id) => {
      set({ toasts: get().toasts.filter((t) => t.id !== id) });
    },

    toggleAuto: () => set({ autoMode: !get().autoMode, skipMode: false }),
    toggleSkip: () => set({ skipMode: !get().skipMode, autoMode: false }),
    cancelModes: () => set({ autoMode: false, skipMode: false }),
    toggleSound: () => {
      const on = !get().soundOn;
      audio.setEnabled(on);
      set({ soundOn: on });
    },
  };
});

/** 現在表示中のノードを取得するセレクタ用ヘルパ */
export function selectCurrentNode(s: Pick<GameStore, "sceneId" | "nodeIndex">): ScenarioNode | null {
  return getScene(s.sceneId)?.nodes[s.nodeIndex] ?? null;
}
