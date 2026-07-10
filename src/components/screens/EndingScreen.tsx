import { useGameStore } from "../../store/gameStore";
import { getEnding } from "../../data/endings";
import keywordDefs from "../../data/keywords.json";

export default function EndingScreen() {
  const endingId = useGameStore((s) => s.endingId);
  const flags = useGameStore((s) => s.flags);
  const keywords = useGameStore((s) => s.keywords);
  const finishEnding = useGameStore((s) => s.finishEnding);

  if (!endingId) return null;
  const ending = getEnding(endingId);
  const perfect = typeof flags.deduction_perfect === "number" ? flags.deduction_perfect : 0;

  return (
    <div className="ending-screen">
      <div className="end-code">{ending.code}</div>
      <h2>{ending.title}</h2>
      <div className="end-desc">{ending.desc}</div>
      <div className="end-stats">
        完全推理 {perfect} / 8　　手がかり {keywords.length} / {keywordDefs.length}
      </div>
      {ending.id === "end_a" && perfect < 8 && (
        <div className="end-stats">
          ——すべての推理をノーミスで解いた者だけが辿り着く、最後の頁があるという。
        </div>
      )}
      <button onClick={finishEnding}>タイトルへ</button>
    </div>
  );
}
