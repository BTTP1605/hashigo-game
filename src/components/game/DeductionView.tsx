import { useMemo, useState } from "react";
import deductions from "../../data/deductions.json";
import keywordDefs from "../../data/keywords.json";
import type { Deduction } from "../../engine/types";
import { audio } from "../../engine/audio";
import { useGameStore } from "../../store/gameStore";

export default function DeductionView({ deductionId }: { deductionId: string }) {
  const ded = useMemo(
    () => (deductions as unknown as Deduction[]).find((d) => d.id === deductionId),
    [deductionId]
  );
  const keywords = useGameStore((s) => s.keywords);
  const completeDeduction = useGameStore((s) => s.completeDeduction);

  const blankCount = ded ? ded.parts.filter((p) => p.t === "blank").length : 0;
  const [answers, setAnswers] = useState<(string | null)[]>(Array(blankCount).fill(null));
  const [wrong, setWrong] = useState<boolean[]>(Array(blankCount).fill(false));
  const [everWrong, setEverWrong] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [picking, setPicking] = useState<number | null>(null);
  const [phase, setPhase] = useState<"input" | "success">("input");

  if (!ded) return null;

  const allFilled = answers.every((a) => a !== null);

  function labelOf(id: string | null): string {
    if (!id) return "？？？";
    return keywordDefs.find((k) => k.id === id)?.label ?? id;
  }

  function submit() {
    const blanks = ded!.parts.filter((p) => p.t === "blank") as { t: "blank"; answer: string }[];
    const wrongNow = blanks.map((b, i) => answers[i] !== b.answer);
    if (wrongNow.some(Boolean)) {
      audio.playSe("se_wrong");
      setEverWrong(true);
      setShowHint(true);
      setWrong(wrongNow);
      setAnswers(answers.map((a, i) => (wrongNow[i] ? null : a)));
    } else {
      audio.playSe("se_correct");
      setPhase("success");
    }
  }

  let blankIdx = -1;

  return (
    <div className="deduction-view">
      <div className="ded-title">{ded.title}</div>
      <div className="ded-intro">{ded.intro}</div>

      {phase === "input" && (
        <>
          <div className="ded-sentence">
            {ded.parts.map((p, i) => {
              if (p.t === "text") return <span key={i}>{p.v}</span>;
              blankIdx++;
              const bi = blankIdx;
              return (
                <button
                  key={i}
                  className={`ded-blank ${answers[bi] ? "filled" : ""} ${wrong[bi] ? "wrong" : ""}`}
                  onClick={() => {
                    setWrong(wrong.map((w, j) => (j === bi ? false : w)));
                    setPicking(bi);
                  }}
                >
                  {labelOf(answers[bi])}
                </button>
              );
            })}
          </div>
          <div className="ded-actions">
            <button disabled={!allFilled} onClick={submit}>
              解読する
            </button>
          </div>
          {showHint && (
            <div className="ded-feedback">
              {ded.failure}
              <div className="ded-hint">ヒント：{ded.hint}</div>
            </div>
          )}
        </>
      )}

      {phase === "success" && (
        <>
          <div className="ded-sentence">
            {ded.success.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          <div className="ded-actions">
            <button onClick={() => completeDeduction(ded, !everWrong)}>
              {everWrong ? "解読完了" : "完全解読"}
            </button>
          </div>
        </>
      )}

      {picking !== null && (
        <div className="kw-picker" onClick={() => setPicking(null)}>
          <div className="kw-picker-panel" onClick={(e) => e.stopPropagation()}>
            <h3>手がかりを選択</h3>
            <div className="kw-grid">
              {keywords.map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    setAnswers(answers.map((a, j) => (j === picking ? id : a)));
                    setPicking(null);
                  }}
                >
                  {labelOf(id)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
