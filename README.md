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

開発用の解錠コード（デフォルト）: `HONRYU-2028`

## 販売運用（note連携）

1. 販売用のパスフレーズを決めて再ビルドする
   ```bash
   # PowerShell
   $env:HASHIGO_PASSPHRASE = "新しいコード"; npm run build
   ```
2. [src/components/screens/UnlockScreen.tsx](src/components/screens/UnlockScreen.tsx) の `NOTE_URL` を実際の有料記事URLに差し替える
3. note の有料記事本文に解錠コードを記載して販売する

### セキュリティ上の注意

- `scenario-src/paid/`（有料章の平文）は `.gitignore` 済み。**公開リポジトリにコミットしないこと**
- 配布されるのは暗号化済みの `public/scenario/paid.enc` のみ（AES-GCM + PBKDF2）。コードはソースに埋め込まれていないため、ソースを読んでも突破できない
- コードの又貸しはサーバーレスでは防げない。必要になったら販売期ごとにコードを変えて再ビルドする

## 画像アセット

画像が無くてもプレースホルダで動作する。生成方法は [docs/image-prompts.md](docs/image-prompts.md) を参照。

- 背景: `public/assets/bg/{bg_id}.jpg`（例: `bg_shrine.jpg`）
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
