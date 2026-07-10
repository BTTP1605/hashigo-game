// Codex CLI (ChatGPT Plusサブスク) を使ってゲーム用画像を一括生成するバッチ。
// 前提: `npm i -g @openai/codex` 済みで `codex` にサインインしていること。
//
// 使い方:
//   node scripts/generate-images.mjs --list            対象一覧を表示
//   node scripts/generate-images.mjs --only bg_shrine  1枚だけ生成
//   node scripts/generate-images.mjs --bg              背景のみ全生成
//   node scripts/generate-images.mjs --char            立ち絵のみ全生成
//   node scripts/generate-images.mjs                   全て生成（既存ファイルはスキップ＝再開可能）
//   node scripts/generate-images.mjs --force           既存ファイルも作り直す
//
// 仕組み: Codexのサンドボックスは読み取り専用のため、Codexには生成だけさせ、
// ~/.codex/generated_images に出力されたPNGをこのスクリプトが回収して配置する。
//
// 注意: 画像生成はChatGPT Plusの利用枠をテキストの3〜5倍の速さで消費します。
// 枠切れで失敗した場合は、時間を置いて同じコマンドを再実行すれば続きから生成されます。
import { spawnSync } from "node:child_process";
import { readFileSync, mkdirSync, copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const prompts = JSON.parse(readFileSync(join(root, "scripts", "image-prompts.json"), "utf-8"));
const genRoot = join(process.env.USERPROFILE ?? process.env.HOME ?? "", ".codex", "generated_images");

const args = process.argv.slice(2);
const onlyIdx = args.indexOf("--only");
const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null;
const bgOnly = args.includes("--bg");
const charOnly = args.includes("--char");
const listOnly = args.includes("--list");
const force = args.includes("--force");

const jobs = [];

if (!charOnly) {
  for (const bg of prompts.backgrounds) {
    jobs.push({
      file: join("public", "assets", "bg", `${bg.file}.png`),
      id: bg.file,
      prompt: `${prompts.stylePrefix}. ${bg.prompt}. ${prompts.backgroundSuffix}`,
      size: "1536x1024",
    });
  }
}
if (!bgOnly) {
  for (const ch of prompts.characters) {
    for (const ex of ch.expressions) {
      jobs.push({
        file: join("public", "assets", "char", `${ex.file}.png`),
        id: ex.file,
        prompt: `${prompts.stylePrefix}. ${ch.base}, ${ex.desc}. ${prompts.portraitSuffix}`,
        size: "1024x1536",
      });
    }
  }
}

const targets = only ? jobs.filter((j) => j.id === only) : jobs;

if (listOnly) {
  for (const j of targets) {
    const done = existsSync(join(root, j.file)) ? "[済]" : "[未]";
    console.log(`${done} ${j.id}  ->  ${j.file}`);
  }
  console.log(`計 ${targets.length} 枚`);
  process.exit(0);
}

if (targets.length === 0) {
  console.error(`対象が見つかりません: ${only}`);
  process.exit(1);
}

mkdirSync(join(root, "public", "assets", "bg"), { recursive: true });
mkdirSync(join(root, "public", "assets", "char"), { recursive: true });

/** since(ms) より新しい生成PNGのうち最新のものを探す */
function newestPngSince(since) {
  if (!existsSync(genRoot)) return null;
  let best = null;
  for (const dir of readdirSync(genRoot)) {
    const dirPath = join(genRoot, dir);
    let entries;
    try {
      entries = statSync(dirPath).isDirectory() ? readdirSync(dirPath) : [];
    } catch {
      continue;
    }
    for (const f of entries) {
      if (!f.toLowerCase().endsWith(".png")) continue;
      const p = join(dirPath, f);
      const m = statSync(p).mtimeMs;
      if (m > since && (!best || m > best.mtime)) best = { path: p, mtime: m };
    }
  }
  return best?.path ?? null;
}

const pending = targets.filter((j) => force || !existsSync(join(root, j.file)));
const skipped = targets.length - pending.length;
if (skipped > 0) console.log(`${skipped} 枚は生成済みのためスキップ（--force で作り直し）`);
console.log(`${pending.length} 枚を生成します（ChatGPT Plusの利用枠を消費します）`);

const failed = [];

for (const job of pending) {
  console.log(`\n=== ${job.id} ===`);
  const started = Date.now() - 2000;
  const instruction = [
    `$imagegen Generate exactly one image, size ${job.size}, with the following prompt:`,
    job.prompt,
    "Only generate the image with the built-in image generation tool. Do not write, copy, or modify any files.",
  ].join("\n");

  const r = spawnSync("codex exec --skip-git-repo-check -", {
    cwd: root,
    input: instruction,
    stdio: ["pipe", "inherit", "inherit"],
    shell: true,
    timeout: 10 * 60 * 1000,
  });

  const png = newestPngSince(started);
  if (r.status !== 0 || !png) {
    console.error(`生成に失敗: ${job.id}（利用枠切れの可能性）`);
    failed.push(job.id);
    continue;
  }
  copyFileSync(png, join(root, job.file));
  console.log(`保存: ${job.file}`);
}

if (failed.length > 0) {
  console.log(`\n失敗 ${failed.length} 件: ${failed.join(", ")}`);
  console.log("時間を置いて同じコマンドを再実行すると、失敗分だけ再生成されます。");
  process.exit(1);
}
console.log("\n全て完了。立ち絵はクロマキー緑背景つきなので、次を実行して透過化してください:");
console.log("  node scripts/remove-chroma.mjs");
