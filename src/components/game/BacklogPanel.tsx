import { useGameStore } from "../../store/gameStore";

export default function BacklogPanel({ onClose }: { onClose: () => void }) {
  const backlog = useGameStore((s) => s.backlog);

  return (
    <div className="overlay-panel">
      <h2>
        調査ログ <button onClick={onClose}>閉じる</button>
      </h2>
      <div className="overlay-body">
        {backlog.length === 0 && <div className="file-empty">まだ記録がありません。</div>}
        {backlog.map((e, i) => (
          <div key={i} className="backlog-entry">
            {e.speaker && <div className="bl-speaker">{e.speaker}</div>}
            <div className="bl-text">{e.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
