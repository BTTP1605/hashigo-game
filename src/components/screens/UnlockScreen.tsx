import { useState } from "react";
import { audio } from "../../engine/audio";
import { useGameStore } from "../../store/gameStore";

// note有料記事のURL（この記事の有料部分に解錠リンクを掲載する）。販売時に差し替える。
const NOTE_ARTICLE_URL = "https://note.com/bttp";

export default function UnlockScreen() {
  const recheckUnlock = useGameStore((s) => s.recheckUnlock);
  const backToTitle = useGameStore((s) => s.backToTitle);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // 同じ端末で別タブ等から解錠済みの場合の「確認」ボタン。
  async function recheck() {
    if (busy) return;
    setBusy(true);
    setError("");
    const ok = await recheckUnlock();
    if (ok) {
      audio.playSe("se_unlock");
    } else {
      setError("まだ解錠されていません。note有料記事の解錠リンクから開いてください。");
      setBusy(false);
    }
  }

  return (
    <div className="unlock-screen">
      <h2>―― 体験版はここまで ――</h2>
      <p>
        CASE 04「1月2日、13時43分」以降は、製品版シナリオです。
        <br />
        note有料記事内の「解錠リンク」を開くと、この端末のセーブデータを
        <br />
        引き継いだまま、最終章まで続きをプレイできます。
      </p>
      <p className="unlock-note">
        まだ購入していない方は、こちらの記事からどうぞ：
        <br />
        <a href={NOTE_ARTICLE_URL} target="_blank" rel="noreferrer">
          {NOTE_ARTICLE_URL}
        </a>
      </p>
      <div className="unlock-error">{error}</div>
      <div className="unlock-actions">
        <button onClick={recheck} disabled={busy}>
          {busy ? "確認中…" : "解錠を確認する"}
        </button>
        <button onClick={backToTitle}>タイトルへ</button>
      </div>
    </div>
  );
}
