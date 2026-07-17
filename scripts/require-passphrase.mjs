// デプロイ前ガード: 本番パスフレーズが未設定（または開発用デフォルトのまま）なら失敗させる。
// 開発ビルド（npm run dev / build）はデフォルトコードで動くが、公開だけは事故を防ぐ。
const DEV_DEFAULTS = ["DEV-0000", "HONRYU-2028"];
const pass = (process.env.HASHIGO_PASSPHRASE ?? "").trim();

if (!pass || DEV_DEFAULTS.includes(pass)) {
  console.error("");
  console.error("[deploy中止] 本番用の解錠コードが設定されていません。");
  console.error("開発用デフォルトのままデプロイすると、既知のコードで有料章を解錠できてしまいます。");
  console.error("");
  console.error("  $env:HASHIGO_PASSPHRASE = \"本番用コード\"; npm run deploy");
  console.error("");
  console.error("本番用コードは passphrase.local を参照してください。");
  process.exit(1);
}
console.log("[deploy] 本番パスフレーズを確認しました。");
