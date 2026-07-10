# 画像生成プロンプト集

『ヤコブの梯子 ―停点調査記録―』のアセットを、キャラクター・背景の一貫性を保って生成するためのプロンプト集です。
機械可読版は [scripts/image-prompts.json](../scripts/image-prompts.json) にあり、`npm run genimg` で Codex CLI（ChatGPT Plusサブスク）による一括生成ができます。

## 一貫性を保つ3層構造

すべてのプロンプトは次の3層を連結して作ります。**共通スタイル接頭辞は全画像で一字一句同じものを使う**ことが、絵柄の一貫性の鍵です。

```
[共通スタイル接頭辞] + [キャラ固有シート or 背景固有記述] + [用途別サフィックス]
```

### 共通スタイル接頭辞（全画像共通）

> Dark-toned Japanese occult mystery adventure game illustration, early 2000s Japan atmosphere, cinematic muted color palette with deep shadows, subtle film grain, serious and melancholic mood, semi-realistic anime style, high detail

### 立ち絵用サフィックス（キャラ共通）

> standing three-quarter body portrait facing the viewer, arms relaxed, neutral pose, soft even studio lighting, isolated on a solid uniform pure green chroma-key background (#00FF00), no background objects, no text

※ gpt-image-2 は透過背景を直接生成できないため、緑背景で生成し `rembg` 等で透過化します。

### 背景用サフィックス（背景共通）

> wide establishing shot, no people, no text, atmospheric lighting, 16:9 composition

## キャラクター固有シート

表情差分を作るときは「①まず normal を生成 → ②その画像を参照画像にして編集モードで表情だけ変える」の2段階にすると、顔の同一性が保たれます。

| ID | キャラ | 固有シート（英語プロンプト） | 表情差分 |
|---|---|---|---|
| hashigo | 梯子（主人公・26歳） | A 26-year-old Japanese man with slightly unkempt medium-short black hair, tired but gentle eyes, pale complexion, slim build, wearing a dark olive-green parka over a gray hoodie and worn jeans, ordinary and approachable presence | normal（憂いを帯びた無表情）/ worry（不安・眉根を寄せる） |
| sister | 妹（姉） | A Japanese woman in her early twenties with shoulder-length dark brown hair, soft kind features, wearing a cream-colored cardigan over a simple white blouse, warm and modest presence | normal（柔らかな微笑）/ cry（涙をこらえる） |
| dotoko | ドト子（ハラマオユミ） | A strikingly beautiful Japanese woman in her late twenties with a sleek black bob haircut, porcelain skin, wearing an elegant thin light-gray business suit unsuited for winter, carrying a silver duralumin-like metallic case bag on her shoulder, otherworldly composed aura, slightly unnatural stillness | normal（無表情・鋭い知性）/ sad（伏し目・微かな悲哀） |
| okada | 紳士（岡田派） | A distinguished Japanese gentleman in his mid-sixties with swept-back silver-gray hair, deep-set handsome features like a classic movie actor, wearing an impeccably tailored dark navy three-piece suit with a silk tie, holding an umbrella, refined and enigmatic presence | smile（優しくも不穏な微笑） |
| yunyun | ゆんゆん | A young Japanese woman of indeterminate age with very long straight black hair, pale skin, wearing a simple dark long dress, faint knowing smirk, inhuman and uncanny composure, eyes that seem far older than her face | normal（冷たい観察眼と嘲笑） |
| boots | ブーツの女性 | A Japanese woman in her mid-twenties with short brown hair, wearing a beige long winter coat with a fur-trimmed collar and reddish-brown high-heeled long boots, elegant winter New Year outfit, unaware innocent atmosphere | normal |
| friend | 知人 | A Japanese man in his late twenties with short black hair, wearing a black down jacket and dark pants, ordinary appearance twisted by desperation, hollow eyes | normal（追い詰められた笑み） |

保存先: `public/assets/char/{ID}_{表情}.png`（例: `hashigo_normal.png`）

## 背景（11点）

保存先: `public/assets/bg/{ID}.jpg`。推奨サイズ 1536x1024。

| ID | シーン | 固有記述（英語プロンプト） |
|---|---|---|
| bg_rain_conveni | 雨のコンビニ軒下 | Japanese convenience store at night in heavy rain, view from under the storefront eaves, wet asphalt reflecting fluorescent light, vending machine glow, September 2008 Tokyo suburb, typhoon approaching |
| bg_room | 梯子のアパート | Small cramp Japanese studio apartment interior at night, dim warm desk lamp, low table with a folded memo and a small jewelry case, CRT computer monitor glowing in the corner, lived-in 2008 atmosphere |
| bg_bbs | 掲示板（モニタ） | Extreme close-up of an old CRT computer monitor in a dark room, glowing text-board forum threads on screen, green-tinted phosphor light spilling into darkness, dust particles in the light, 2000s internet nostalgia, ominous |
| bg_street | 夜の路上 | Quiet Japanese residential street at night, lonely streetlights, utility poles and tangled wires, long shadows, cold november air, distant lit windows |
| bg_koban | 交番 | Small Japanese police box (koban) interior in daytime, plain desk and pipe chairs, notice posters on the wall, fluorescent lighting, slightly worn public atmosphere |
| bg_doutor | ドトール | Cozy Japanese coffee chain shop interior, warm brown wood tones, small tables by a window, afternoon light through glass, steam rising from coffee cups, 2008 |
| bg_void | 誰もいない空間 | The same coffee shop interior but completely empty of people, unnaturally still and silent like a hollow diorama model, desaturated washed-out colors, pale white even light with no shadows, uncanny emptiness |
| bg_station | 駅構内 | Japanese train station concourse in the evening, ticket gates, departure board glow, polished floor reflections, but eerily few people, cold fluorescent light |
| bg_shrine | 1月2日の神社 | Japanese shrine grounds on a clear winter afternoon of New Year, stone steps and torii gate, leafless trees, pale golden low winter sunlight, quiet tension in the air, January 2nd |
| bg_home2028 | 2028年の家 | Bright warm Japanese family living room in summer 2028, sofa with a napping cushion, watermelon on the table, sunlight through lace curtains, subtle near-future home appliances, nostalgic happy atmosphere with a faint uncanny stillness |
| bg_car | 車内 | Interior of a family car parked near a school in the afternoon, view across the front seats, empty passenger seat, light through the windshield, unsettling quiet |

## 生成手段

**A. Codex CLI 一括生成（推奨・サブスク枠内）**

```
npm i -g @openai/codex
codex                     # 初回に Sign in with ChatGPT
npm run genimg -- --list  # 対象一覧
npm run genimg -- --only bg_shrine   # 1枚ずつ
npm run genimg -- --bg    # 背景のみ
```

画像生成はテキストの3〜5倍の速さでPlusの利用枠を消費します。枠切れになったら日を分けて `--only` で再開してください。

**B. ChatGPT アプリで手動生成**

上記の3層を連結した文をそのまま貼り付け、生成画像を該当パスに保存してください。

**立ち絵の透過化（共通の後処理）**

```
pip install rembg
rembg i public/assets/char/hashigo_normal.png public/assets/char/hashigo_normal.png
```

画像が無い間も、ゲームは自動的にプレースホルダ（グラデーション背景・シルエット立ち絵）で動作します。
