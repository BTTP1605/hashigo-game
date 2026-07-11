# ヤコブの梯子 ―停点調査記録―

Web小説「梯子の物語」を原作とする、ブラウザで遊べるミステリーアドベンチャーゲーム。
React + TypeScript + Vite 製。GitHub Pages にそのままデプロイでき、ランタイムの外部依存ゼロ（維持費0円）。

## 遊び方の流れ

- PROLOGUE〜CASE 03 …… 無料（体験版範囲）
- CASE 04〜FINAL …… 暗号化された製品版シナリオ。**解錠コード**（note有料記事に記載）を入力すると、同じ端末のセーブデータを引き継いだまま続きが遊べる
- エンディングは3種類。全推理をノーミスで解くと真エンド（END C）への分岐が開く

## セットアップ

```bash
npm install
npm run dev      # 開発サーバー（自動で有料章を暗号化してから起動）
npm run build    # 型チェック + 本番ビルド（dist/）
npm run deploy   # GitHub Pages へデプロイ（gh-pages ブランチ）
```

ローカル開発時の解錠コード（デフォルト）: `HONRYU-2028`
（このコードはローカル開発専用。公開デプロイには使わないこと）

## 販売運用（note連携）

1. [src/components/screens/UnlockScreen.tsx](src/components/screens/UnlockScreen.tsx) の `NOTE_URL` を実際の有料記事URLに差し替える
2. **本番用パスフレーズを環境変数で指定して**デプロイする
   ```powershell
   $env:HASHIGO_PASSPHRASE = "本番用コード"; npm run deploy
   ```
3. note の有料記事本文に本番用コードを記載して販売する

本番用コードのメモは `passphrase.local`（gitignore済み）に置く。note記事の下書きは [docs/note-article-draft.md](docs/note-article-draft.md)。

### セキュリティ設計

- `scenario-src/paid/`（有料章の平文）と `public/scenario/paid.enc`（暗号化バンドル）は**どちらもリポジトリに含めない**。encはビルド時にその都度生成され、デプロイ成果物にのみ同梱される
- 暗号はAES-GCM + PBKDF2。解錠コードはソースに一切埋め込まれないため、公開リポジトリを読んでも突破できない
- このリポジトリをクローンした第三者は体験版（無料章）のみビルド・プレイ可能
- コードの又貸しはサーバーレスでは防げない。必要になったら販売期ごとにコードを変えて再デプロイする

## 音声アセット

- 効果音: `npm run gense` でプログラム合成（`public/assets/audio/se/`、外部素材不使用）
- BGM: `public/assets/audio/bgm/*.mp3` に置くと場面連動で自動再生。無いトラックは無音。生成プロンプトは [docs/bgm-prompts.md](docs/bgm-prompts.md)

## 画像アセット

画像が無くてもプレースホルダで動作する。生成方法は [docs/image-prompts.md](docs/image-prompts.md) を参照。

- 背景: `public/assets/bg/{bg_id}.png`（例: `bg_shrine.png`）
- 立ち絵: `public/assets/char/{char}_{expression}.png`（例: `hashigo_normal.png`、透過PNG推奨）
- Codex CLI（ChatGPT Plus）での一括生成: `npm run genimg -- --list` で対象確認

## プロジェクト構成

```
src/
├── engine/          # UI非依存のノベルエンジン（型・条件評価・暗号・セーブ）
├── data/
│   ├── scenario/free/   # 無料章シナリオ（prologue〜case03）
│   ├── keywords.json    # 手がかり辞書
│   ├── items.json       # 証拠品辞書
│   ├── deductions.json  # 推理パート定義（8問）
│   └── characters.json  # キャラ定義（立ち絵ID・色）
├── store/gameStore.ts   # ゲーム状態（Zustand）
└── components/          # 画面・UI
scenario-src/paid/       # 有料章シナリオ平文（gitignore済み）
scripts/
├── encrypt-scenario.mjs # 有料章の暗号化（ビルド時に自動実行）
├── generate-images.mjs  # Codex CLIによる画像一括生成
└── image-prompts.json   # 画像プロンプト定義
```

## シナリオJSONの書き方（要約）

シーンは `{ sceneId, title, nodes[] }`。ノードは上から順に実行され、`goto`/`then` はノードIDへジャンプする。

| type | 役割 | 主なフィールド |
|---|---|---|
| chapter | 章タイトルカード | title, subtitle |
| bg | 背景切替 | value（bg_id） |
| text | 本文（地の文/会話/掲示板） | speaker, text, portrait, bbs{no,handle,date}, effects, next |
| choice | 選択肢 | prompt, options[{label, goto, if, effects}] |
| branch | フラグ分岐 | if, then, else |
| deduction | 推理パート | deductionId |
| jump | 別シーンへ | scene |
| ending | エンディング | endingId |

`effects` は `setFlags` / `addFlags`（加算） / `addItems` / `addKeywords`。
条件 `if` は `{flag, eq/gte/lte}` `{hasItem}` `{hasKeyword}` `{all/any/not}`。
