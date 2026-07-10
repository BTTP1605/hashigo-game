// 立ち絵PNGのクロマキー緑背景を透過化する（pngjs使用・Python不要）。
// 使い方: node scripts/remove-chroma.mjs [ファイル名...]（省略時は public/assets/char/*.png 全部）
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const charDir = join(root, "public", "assets", "char");

const args = process.argv.slice(2);
const files = args.length > 0 ? args : existsSync(charDir) ? readdirSync(charDir).filter((f) => f.endsWith(".png")) : [];

if (files.length === 0) {
  console.log("対象PNGがありません。先に npm run genimg -- --char を実行してください。");
  process.exit(0);
}

for (const file of files) {
  const path = join(charDir, file);
  const png = PNG.sync.read(readFileSync(path));
  const { data, width, height } = png;
  let changed = 0;

  for (let i = 0; i < width * height * 4; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const maxRB = Math.max(r, b);
    // 緑がどれだけ支配的か（0〜）
    const dominance = g - maxRB;
    if (g > 90 && dominance > 60) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0; // 完全に背景
      changed++;
    } else if (g > 90 && dominance > 25) {
      // 輪郭部: 半透明化＋緑かぶり除去
      data[i + 3] = Math.max(0, 255 - dominance * 6);
      data[i + 1] = maxRB;
      changed++;
    }
  }

  writeFileSync(path, PNG.sync.write(png, { colorType: 6 }));
  console.log(`${file}: ${changed} px 透過化`);
}
console.log("done");
