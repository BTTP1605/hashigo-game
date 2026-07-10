import { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { listSaves } from "../../engine/saveSystem";
import { ENDINGS } from "../../data/endings";
import SaveLoadPanel from "../game/SaveLoadPanel";

export default function TitleScreen() {
  const startNew = useGameStore((s) => s.startNew);
  const endingsSeen = useGameStore((s) => s.endingsSeen);
  const [showLoad, setShowLoad] = useState(false);
  const hasSave = listSaves().some((s) => s.data !== null);

  return (
    <div className="title-screen">
      <div className="title-sub">―停点調査記録―</div>
      <h1>ヤコブの梯子</h1>
      <div className="title-tag">JACOB'S LADDER : RECORDS OF STILL POINTS</div>
      <div className="title-menu">
        <button onClick={startNew}>はじめから</button>
        <button onClick={() => setShowLoad(true)} disabled={!hasSave}>
          つづきから
        </button>
      </div>
      <div className="title-endings">
        {ENDINGS.map((e) => (
          <span key={e.id} className={`end-badge ${endingsSeen.includes(e.id) ? "seen" : ""}`}>
            {endingsSeen.includes(e.id) ? `${e.code} ${e.title}` : `${e.code} ???`}
          </span>
        ))}
      </div>
      {showLoad && <SaveLoadPanel mode="load" onClose={() => setShowLoad(false)} />}
    </div>
  );
}
