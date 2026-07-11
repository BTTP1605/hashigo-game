# BGM生成プロンプト集

Suno / Udio などの音楽生成AIで各トラックを生成し、**下記のファイル名どおり**に
`public/assets/audio/bgm/` へ配置してください（形式はmp3）。配置して再デプロイするだけで、
ゲームが場面に応じて自動的に再生します。**ファイルが無いトラックは自動的に無音になる**ので、
1曲ずつ追加していけます。

## 共通指定（全トラックのプロンプト末尾に付ける）

> instrumental only, no vocals, seamless loop, subtle and atmospheric, for a dark mystery visual novel game, quiet enough to sit behind reading text

- **インスト限定・ボーカル無し**（歌詞があると文章が読めなくなるため）
- 長さは1〜2分でOK（ゲーム側でループ再生します）
- 曲の頭と終わりが自然につながる「ループ向き」の構成を指定すると理想的
- 音量ラウドネスは控えめに。ゲーム側でも音量0.35に絞って再生します

## トラック一覧（8曲）

| ファイル名 | 使われる場面 | プロンプト（英語） | 雰囲気メモ |
|---|---|---|---|
| bgm_title.mp3 | タイトル画面 | Slow ambient piano with soft rain textures and distant reverb, mysterious and melancholic, a single repeating motif like memory fading, sparse and spacious | 物語の顔。雨と追憶。静かで神秘的に |
| bgm_rain.mp3 | 雨のコンビニ・夜の路上 | Gentle rain ambience with sparse felt piano notes and low warm pad, nocturnal city loneliness, 2000s Japan night, calm but slightly uneasy | 導入部。日常の中の微かな違和感 |
| bgm_daily.mp3 | アパート・ドトール・駅など日常 | Quiet lo-fi ambient with soft electric piano and vinyl noise, everyday melancholy, introspective and warm but tinged with sadness | 生活の音。温かいが少し寂しい |
| bgm_bbs.mp3 | 掲示板パート | Dark minimal electronic ambient with faint CRT hum, slow pulsing sub bass, occasional glitchy textures, early internet nostalgia turned ominous | ブラウン管の光。不穏なデジタル感 |
| bgm_void.mp3 | 誰もいない空間 | Vast empty drone with high thin shimmering overtones, unnaturally still, time suspended, faint reversed piano echoes, liminal space, unsettling serenity | 音が「無い」ことを感じさせる浮遊感 |
| bgm_tension.mp3 | 神社・車内など緊迫場面 | Tense cinematic underscore with low string drones, slow heartbeat-like percussion, rising unease, restrained and cold, no melody | 心拍のような低音。決断の場面 |
| bgm_home2028.mp3※ | 2028年の家 | Nostalgic warm ambient with music box and soft strings, summer afternoon haze, bittersweet happiness that feels like a dream about to end | 偽物かもしれない幸福。切なく温かく |
| bgm_ending.mp3 | エンディング画面 | Emotional minimal piano ballad instrumental, quiet resolution and acceptance, hopeful sadness, like closing a book at dawn | 読後感。静かな余韻と少しの希望 |

※ bgm_home2028.mp3 はゲーム内では `bgm_home.mp3` の名前で参照されます。生成後は **`bgm_home.mp3`** にリネームして配置してください。

## 配置と反映の手順

1. 生成したmp3を上記ファイル名で `public/assets/audio/bgm/` に置く
2. ローカル確認: `npm run dev` → ゲーム内右上の「♪」がONであることを確認
3. 公開反映: `$env:HASHIGO_PASSPHRASE = "本番コード"; npm run deploy`

## 効果音について

効果音8種（テキスト送り・選択・手がかり入手・推理成功/失敗・章開始・解錠・パネル開閉）は
`npm run gense` でプログラム合成され、`public/assets/audio/se/` に出力済みです（外部素材不使用）。
差し替えたい場合は同名のwavを上書きするだけで反映されます。
