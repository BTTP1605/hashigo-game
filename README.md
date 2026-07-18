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
npm run dev      # 開発サーバー
npm run build    # 型チェック + 本番ビルド（dist/）
```

デプロイはエックスサーバーへFTPで行う（`../xserver-deploy/` の `node deploy.mjs --game hashigo`）。
公開先: https://bttp.info/games/hashigo/ 。

## 販売運用（note連携・サーバー配信型解錠）

有料章はサーバー内の非公開領域（`games/_private/paid/hashigo.json`）に置き、解錠Cookieを持つ
端末にだけ `games/api/scenario.php` が配信する。暗号化ファイルの配布は行わない。

1. note有料記事の**有料部分**に「解錠リンク」を貼る:
   `https://bttp.info/games/api/unlock.php?g=hashigo&t=<トークン>`
   （実際のリンクは `../xserver-deploy/UNLOCK-LINKS.local.md` 参照）
2. [src/components/screens/UnlockScreen.tsx](src/components/screens/UnlockScreen.tsx) の
   `NOTE_ARTICLE_URL` を実際の記事URLに差し替えて再デプロイ
3. リンク流出時はサーバーの `_private/config.php` でトークンを変更し、note側リンクを差し替える
   （ゲームの再ビルドは不要）

### セキュリティ設計

- 有料章は公開ファイルとして存在しない（`_private` は直アクセス403）。持ち帰り解析の対象が無い
- 解錠はnote参照元チェック＋トークン＋レート制限＋ログ。Cookieは署名付きHttpOnly（1年）
- リポジトリをクローンした第三者は体験版（無料章）のみプレイ可能
- 限界: 参照元が空になる環境や、購入者本人によるデータ再配布は防げない

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
├── engine/          # UI非依存のノベルエンジン（型・条件評価・セーブ・音声）
├── data/
│   ├── scenario/free/   # 無料章シナリオ（prologue〜case03）
│   ├── keywords.json    # 手がかり辞書
│   ├── items.json       # 証拠品辞書
│   ├── deductions.json  # 推理パート定義（8問）
│   └── characters.json  # キャラ定義（立ち絵ID・色）
├── store/gameStore.ts   # ゲーム状態（Zustand）
└── components/          # 画面・UI
scenario-src/paid/       # 有料章シナリオ平文（gitignore済み。xserver-deploy/build-paid.mjsが取り込む）
scripts/
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
