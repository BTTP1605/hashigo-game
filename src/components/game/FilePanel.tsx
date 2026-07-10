import { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import keywordDefs from "../../data/keywords.json";
import itemDefs from "../../data/items.json";

export default function FilePanel({ onClose }: { onClose: () => void }) {
  const keywords = useGameStore((s) => s.keywords);
  const items = useGameStore((s) => s.items);
  const [tab, setTab] = useState<"kw" | "item">("kw");

  return (
    <div className="overlay-panel">
      <h2>
        調査ファイル <button onClick={onClose}>閉じる</button>
      </h2>
      <div className="file-tabs">
        <button className={tab === "kw" ? "active" : ""} onClick={() => setTab("kw")}>
          手がかり {keywords.length}/{keywordDefs.length}
        </button>
        <button className={tab === "item" ? "active" : ""} onClick={() => setTab("item")}>
          証拠品 {items.length}/{itemDefs.length}
        </button>
      </div>
      <div className="overlay-body">
        {tab === "kw" && (
          <>
            {keywords.length === 0 && <div className="file-empty">手がかりはまだない。</div>}
            {keywordDefs
              .filter((k) => keywords.includes(k.id))
              .map((k) => (
                <div key={k.id} className="file-entry">
                  <div className="fe-name">{k.label}</div>
                  <div className="fe-desc">{k.desc}</div>
                </div>
              ))}
          </>
        )}
        {tab === "item" && (
          <>
            {items.length === 0 && <div className="file-empty">証拠品はまだない。</div>}
            {itemDefs
              .filter((i) => items.includes(i.id))
              .map((i) => (
                <div key={i.id} className="file-entry">
                  <div className="fe-name">{i.name}</div>
                  <div className="fe-desc">{i.desc}</div>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
