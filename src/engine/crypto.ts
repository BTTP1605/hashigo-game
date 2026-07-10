// 有料章シナリオの復号（Web Crypto API / AES-GCM）
// ファイル形式: [salt 16B][iv 12B][ciphertext]
// scripts/encrypt-scenario.mjs と対になっている。

const PBKDF2_ITERATIONS = 150000;

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase.trim()),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

/** 復号に成功すればJSON文字列を返し、失敗（＝コード違い）なら null を返す */
export async function decryptPaidBundle(
  buf: ArrayBuffer,
  passphrase: string
): Promise<string | null> {
  try {
    const data = new Uint8Array(buf);
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const body = data.slice(28);
    const key = await deriveKey(passphrase, salt);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      body as BufferSource
    );
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}
