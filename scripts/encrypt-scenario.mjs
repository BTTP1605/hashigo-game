// 有料章シナリオを AES-GCM で暗号化して public/scenario/paid.enc に出力する。
// パスフレーズは環境変数 HASHIGO_PASSPHRASE、未指定なら開発用デフォルト。
// 出力形式: [salt 16B][iv 12B][ciphertext] — src/engine/crypto.ts と対。
import { webcrypto as crypto } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "scenario-src", "paid");
const outDir = join(root, "public", "scenario");
const outFile = join(outDir, "paid.enc");

const DEFAULT_PASSPHRASE = "HONRYU-2028";
const passphrase = (process.env.HASHIGO_PASSPHRASE ?? DEFAULT_PASSPHRASE).trim();
const PBKDF2_ITERATIONS = 150000;

if (!existsSync(srcDir)) {
  if (existsSync(outFile)) {
    console.log("[encrypt] scenario-src/paid がないため、既存の paid.enc をそのまま使います。");
    process.exit(0);
  }
  console.error("[encrypt] scenario-src/paid が見つかりません。有料章シナリオを配置してください。");
  process.exit(1);
}

const bundle = {};
for (const file of readdirSync(srcDir).filter((f) => f.endsWith(".json"))) {
  const scene = JSON.parse(readFileSync(join(srcDir, file), "utf-8"));
  bundle[scene.sceneId] = scene;
}

const plaintext = new TextEncoder().encode(JSON.stringify(bundle));
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));

const material = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(passphrase),
  "PBKDF2",
  false,
  ["deriveKey"]
);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
  material,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt"]
);
const cipher = new Uint8Array(
  await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext)
);

const out = new Uint8Array(salt.length + iv.length + cipher.length);
out.set(salt, 0);
out.set(iv, salt.length);
out.set(cipher, salt.length + iv.length);

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, out);

const scenes = Object.keys(bundle).join(", ");
console.log(`[encrypt] ${scenes} -> public/scenario/paid.enc (${out.length} bytes)`);
if (passphrase === DEFAULT_PASSPHRASE) {
  console.log("[encrypt] 注意: 開発用デフォルトのパスフレーズを使用中。販売前に HASHIGO_PASSPHRASE を設定して再ビルドしてください。");
}
