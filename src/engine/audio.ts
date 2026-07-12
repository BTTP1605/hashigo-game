// サウンド再生（SE/BGM）。ファイルが存在しない場合は静かに無視する。
// ブラウザの自動再生制限に対応: 再生がブロックされたら初回操作時に再試行する。

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
  private bgmEl: HTMLAudioElement | null = null;
  private currentBgm: string | null = null;
  private wantedBgm: string | null = null;
  private retryArmed = false;
  private seCache = new Map<string, HTMLAudioElement>();
  enabled: boolean;

  constructor() {
    this.enabled = localStorage.getItem("hashigo_sound") !== "off";
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    localStorage.setItem("hashigo_sound", on ? "on" : "off");
    if (!on) {
      this.bgmEl?.pause();
    } else if (this.wantedBgm) {
      const track = this.wantedBgm;
      this.currentBgm = null;
      this.playBgm(track);
    }
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

    const old = this.bgmEl;
    if (old) {
      this.fadeOut(old);
      this.bgmEl = null;
    }
    this.currentBgm = track;
    if (!track) return;

    try {
      const el = new Audio(`${BASE}assets/audio/bgm/${track}.mp3`);
      el.loop = true;
      el.volume = BGM_VOLUME;
      el.onerror = () => {
        // ファイル未配置なら黙って何もしない
        if (this.bgmEl === el) this.bgmEl = null;
      };
      this.bgmEl = el;
      void el.play().catch(() => this.armRetry());
    } catch {
      this.bgmEl = null;
    }
  }

  /** 自動再生がブロックされた場合、次のクリックで再試行 */
  private armRetry(): void {
    if (this.retryArmed) return;
    this.retryArmed = true;
    const retry = () => {
      this.retryArmed = false;
      if (this.enabled && this.wantedBgm) {
        const track = this.wantedBgm;
        this.currentBgm = null;
        if (this.bgmEl) {
          this.bgmEl.pause();
          this.bgmEl = null;
        }
        this.playBgm(track);
      }
    };
    document.addEventListener("pointerdown", retry, { once: true });
  }

  private fadeOut(el: HTMLAudioElement): void {
    const step = () => {
      el.volume = Math.max(0, el.volume - 0.06);
      if (el.volume > 0.01) {
        setTimeout(step, 50);
      } else {
        el.pause();
        el.src = "";
      }
    };
    step();
  }
}

export const audio = new AudioManager();

// 開発時のみ: 再生状態を検査できるように公開
if (import.meta.env.DEV) {
  (window as unknown as { __audio: AudioManager }).__audio = audio;
}
