// サウンド再生（SE/BGM）。ファイルが存在しない場合は静かに無視する。
// ブラウザの自動再生制限に対応: 再生がブロックされたら初回操作時に再試行する。
//
// BGMは「単一の永続Audio要素」を使い回す設計。トラック切替は同じ要素の src を
// 差し替えるだけなので、前のトラックは必ず停止し、鳴りっぱなしの孤児要素が生まれない。

import { GAME_KEY } from "./saveSystem";

const BASE = import.meta.env.BASE_URL;

export type SeName =
  | "se_click"
  | "se_choice"
  | "se_get"
  | "se_correct"
  | "se_wrong"
  | "se_chapter"
  | "se_unlock"
  | "se_page";

/** 背景ID → BGMトラック名。ファイルは public/assets/audio/bgm/<name>.mp3 */
export const BGM_BY_BG: Record<string, string | null> = {
  bg_black: null,
  bg_rain_conveni: "bgm_rain",
  bg_street: "bgm_rain",
  bg_street_day: "bgm_daily",
  bg_room: "bgm_daily",
  bg_koban: "bgm_daily",
  bg_doutor: "bgm_daily",
  bg_station: "bgm_daily",
  bg_bbs: "bgm_bbs",
  bg_void: "bgm_void",
  bg_shrine: "bgm_tension",
  bg_car: "bgm_tension",
  bg_home2028: "bgm_home",
};

const BGM_VOLUME = 0.35;
const SE_VOLUME = 0.5;

class AudioManager {
  /** BGM再生に使う唯一の要素。使い回すことで多重再生を構造的に防ぐ。 */
  private bgmEl: HTMLAudioElement | null = null;
  private currentBgm: string | null = null;
  private wantedBgm: string | null = null;
  private retryArmed = false;
  private retryHandler: (() => void) | null = null;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  private seCache = new Map<string, HTMLAudioElement>();
  enabled: boolean;

  constructor() {
    this.enabled = localStorage.getItem(`${GAME_KEY}_sound`) !== "off";
    // タブが非表示になったら必ずBGMを止める（別タブ・閉じ忘れタブで鳴り続けるのを防ぐ）。
    // 再表示時は、音がONで再生中だったトラックがあれば再開する。
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.clearFade();
        this.bgmEl?.pause();
      } else if (this.enabled && this.wantedBgm && this.currentBgm && this.bgmEl) {
        void this.bgmEl.play().catch(() => {});
      }
    });
    // ページ離脱・破棄時にも確実に止める。
    const stop = () => this.bgmEl?.pause();
    window.addEventListener("pagehide", stop);
    window.addEventListener("beforeunload", stop);
  }

  private clearFade(): void {
    if (this.fadeTimer) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
  }

  // 自動再生リトライ用のpointerdownリスナーを解除する（音OFF時などに呼ぶ）。
  private cancelRetry(): void {
    if (this.retryHandler) {
      document.removeEventListener("pointerdown", this.retryHandler);
      this.retryHandler = null;
    }
    this.retryArmed = false;
  }

  private ensureEl(): HTMLAudioElement {
    if (!this.bgmEl) {
      const el = new Audio();
      el.loop = true;
      el.volume = BGM_VOLUME;
      this.bgmEl = el;
    }
    return this.bgmEl;
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    localStorage.setItem(`${GAME_KEY}_sound`, on ? "on" : "off");
    if (!on) {
      this.clearFade();
      this.cancelRetry();
      this.bgmEl?.pause();
      return;
    }
    // 再開: 現在望まれているトラックを鳴らし直す
    const track = this.wantedBgm;
    this.currentBgm = null;
    this.playBgm(track);
  }

  playSe(name: SeName): void {
    if (!this.enabled) return;
    try {
      let base = this.seCache.get(name);
      if (!base) {
        base = new Audio(`${BASE}assets/audio/se/${name}.wav`);
        base.preload = "auto";
        this.seCache.set(name, base);
      }
      const el = base.cloneNode() as HTMLAudioElement;
      el.volume = SE_VOLUME;
      void el.play().catch(() => {});
    } catch {
      // 音が出せなくてもゲームは止めない
    }
  }

  /** track: BGM名 または null（停止） */
  playBgm(track: string | null): void {
    this.wantedBgm = track;
    if (!this.enabled) return;
    if (track === this.currentBgm) return;
    this.currentBgm = track;
    this.clearFade();

    if (!track) {
      // フェードアウトして停止（要素は再利用するため破棄しない）
      const el = this.bgmEl;
      if (!el || el.paused) return;
      this.fadeTimer = setInterval(() => {
        el.volume = Math.max(0, el.volume - 0.06);
        if (el.volume <= 0.01) {
          this.clearFade();
          el.pause();
        }
      }, 50);
      return;
    }

    // 同じ要素の src を差し替える＝前のトラックは自動的に停止する
    const el = this.ensureEl();
    el.onerror = null;
    el.src = `${BASE}assets/audio/bgm/${track}.mp3`;
    el.loop = true;
    el.volume = BGM_VOLUME;
    try {
      el.currentTime = 0;
    } catch {
      // 一部ブラウザで load 前の currentTime 設定が投げることがある。無視でよい。
    }
    void el.play().catch(() => this.armRetry());
  }

  /** 自動再生がブロックされた場合、次の操作で再試行 */
  private armRetry(): void {
    if (this.retryArmed) return;
    this.retryArmed = true;
    const retry = () => {
      this.retryHandler = null;
      this.retryArmed = false;
      const track = this.wantedBgm;
      // タブが非表示なら再開しない。音がONのときだけ鳴らし直す。
      if (this.enabled && track && !document.hidden) {
        this.currentBgm = null; // 強制的に鳴らし直す
        this.playBgm(track);
      }
    };
    this.retryHandler = retry;
    document.addEventListener("pointerdown", retry, { once: true });
  }
}

export const audio = new AudioManager();

// 開発時のみ: 再生状態を検査できるように公開
if (import.meta.env.DEV) {
  (window as unknown as { __audio: AudioManager }).__audio = audio;
}
