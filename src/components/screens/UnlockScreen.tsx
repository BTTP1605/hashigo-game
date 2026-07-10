import { useState } from "react";
import { useGameStore } from "../../store/gameStore";

// 販売開始時に、note の有料記事URLへ差し替えてください。
const NOTE_URL = "https://note.com/your_account/n/xxxxxxxxxxxx";

export default function UnlockScreen() {
  const unlock = useGameStore((s) => s.unlock);
  const backToTitle = useGameStore((s) => s.backToTitle);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!code.trim() || busy) return;
    setBusy(true);
    setError("");
    const ok = await unlock(code);
    if (!ok) {
      setError("解錠できませんでした。コードを確認してください。");
      setBusy(false);
    }
  }

  return (
    <div className="unlock-screen">
      <h2>―― 体験版はここまで ――</h2>
      <p>
        CASE 04「1月2日、13時43分」以降は、製品版シナリオです。
        <br />
        解錠コードを入力すると、この端末のセーブデータを引き継いだまま、
        <br />
        最終章まで続きをプレイできます。
      </p>
      <p className="unlock-note">
        解錠コードは note の有料記事に記載されています：
        <br />
        <a href={NOTE_URL} target="_blank" rel="noreferrer">
          {NOTE_URL}
        </a>
      </p>
      <input
        type="text"
        value={code}
        placeholder="解錠コードを入力"
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <div className="unlock-error">{error}</div>
      <div className="unlock-actions">
        <button onClick={submit} disabled={busy}>
          {busy ? "確認中…" : "解錠する"}
        </button>
        <button onClick={backToTitle}>タイトルへ</button>
      </div>
    </div>
  );
}
