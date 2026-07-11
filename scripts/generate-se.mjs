// 効果音をプログラム合成して public/assets/audio/se/*.wav に出力する。
// 外部素材不使用（ライセンスフリー）。使い方: node scripts/generate-se.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "assets", "audio", "se");
mkdirSync(outDir, { recursive: true });

const SR = 44100;

/** Float32(-1..1) を 16bit PCM mono WAV にして保存 */
function writeWav(name, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  writeFileSync(join(outDir, name), buf);
  console.log(`${name}: ${(n / SR).toFixed(2)}s`);
}

function make(dur, fn) {
  const n = Math.floor(SR * dur);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) s[i] = fn(i / SR);
  return s;
}

/** 指数減衰エンベロープ */
const decay = (t, k) => Math.exp(-t * k);
/** アタック付きエンベロープ */
const ad = (t, attack, k) => (t < attack ? t / attack : decay(t - attack, k));
const sine = (t, f) => Math.sin(2 * Math.PI * f * t);

// 乱数（シード固定で再現性を持たせる）
let seed = 1343;
function rand() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff - 0.5;
}
const noiseBuf = new Float32Array(SR * 2);
for (let i = 0; i < noiseBuf.length; i++) noiseBuf[i] = rand() * 2;
const noise = (t) => noiseBuf[Math.floor(t * SR) % noiseBuf.length];

// ---- テキスト送り: ごく短い柔らかいティック ----
writeWav("se_click.wav", make(0.06, (t) =>
  sine(t, 1150) * decay(t, 90) * 0.16
));

// ---- 選択決定: 二音ブリップ ----
writeWav("se_choice.wav", make(0.18, (t) => {
  const f = t < 0.07 ? 660 : 880;
  return sine(t, f) * ad(t, 0.005, 22) * 0.24;
}));

// ---- 手がかり入手: 上昇アルペジオ（ベル風） ----
writeWav("se_get.wav", make(0.5, (t) => {
  let v = 0;
  const notes = [[0, 523.25], [0.09, 659.25], [0.18, 783.99]];
  for (const [st, f] of notes) {
    if (t >= st) {
      const lt = t - st;
      v += (sine(lt, f) + 0.35 * sine(lt, f * 2)) * decay(lt, 9) * 0.16;
    }
  }
  return v;
}));

// ---- 推理成功: 解決和音 ----
writeWav("se_correct.wav", make(1.1, (t) => {
  let v = 0;
  for (const f of [523.25, 659.25, 783.99, 1046.5]) {
    v += (sine(t, f) + 0.25 * sine(t, f * 2)) * 0.09;
  }
  return v * ad(t, 0.01, 3.2);
}));

// ---- 推理失敗: 低いバズ ----
writeWav("se_wrong.wav", make(0.35, (t) => {
  const sq = Math.sign(sine(t, 110)) * 0.5 + Math.sign(sine(t, 112)) * 0.5;
  return (sq * 0.5 + noise(t) * 0.12) * ad(t, 0.005, 9) * 0.3;
}));

// ---- 章開始: 低音ブーム＋余韻 ----
writeWav("se_chapter.wav", make(1.6, (t) => {
  const boom = sine(t, 52 * (1 + 0.4 * decay(t, 6))) * decay(t, 2.2) * 0.7;
  const air = noise(t) * decay(t, 4) * 0.05;
  const shimmer = sine(t, 1568) * decay(t, 5) * 0.02;
  return boom + air + shimmer;
}));

// ---- 解錠: 上昇チャイム ----
writeWav("se_unlock.wav", make(0.9, (t) => {
  let v = 0;
  const notes = [[0, 392], [0.12, 523.25], [0.24, 783.99], [0.36, 1046.5]];
  for (const [st, f] of notes) {
    if (t >= st) {
      const lt = t - st;
      v += (sine(lt, f) + 0.3 * sine(lt, f * 3)) * decay(lt, 5) * 0.13;
    }
  }
  return v;
}));

// ---- パネル開閉: ノイズの短いウーシュ ----
writeWav("se_page.wav", make(0.22, (t) => {
  const env = ad(t, 0.04, 16);
  // 簡易ローパス（近傍平均）
  const lp = (noise(t) + noise(t + 0.0002) + noise(t + 0.0004)) / 3;
  return lp * env * 0.2;
}));

console.log("done -> public/assets/audio/se/");
