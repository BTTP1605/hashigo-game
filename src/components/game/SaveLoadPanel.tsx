import { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { listSaves, type SlotId } from "../../engine/saveSystem";

const SLOT_NAMES: Record<string, string> = {
  auto: "AUTO",
  "0": "SLOT 1",
  "1": "SLOT 2",
  "2": "SLOT 3",
};

export default function SaveLoadPanel({
  mode,
  onClose,
}: {
  mode: "save" | "load";
  onClose: () => void;
}) {
  const saveSlot = useGameStore((s) => s.saveSlot);
  const loadSlot = useGameStore((s) => s.loadSlot);
  // 保存後に一覧を更新するための再描画トリガ
  const [, setTick] = useState(0);

  const saves = listSaves();

  function handle(slot: SlotId, hasData: boolean) {
    if (mode === "save") {
      if (slot === "auto") return;
      saveSlot(slot);
      setTick((t) => t + 1);
    } else {
      if (!hasData) return;
      loadSlot(slot);
      onClose();
    }
  }

  return (
    <div className="overlay-panel">
      <h2>
        {mode === "save" ? "セーブ" : "ロード"} <button onClick={onClose}>閉じる</button>
      </h2>
      <div className="overlay-body">
        <div className="slot-list">
          {saves.map(({ slot, data }) => {
            const disabled =
              (mode === "save" && slot === "auto") || (mode === "load" && !data);
            return (
              <button
                key={String(slot)}
                disabled={disabled}
                onClick={() => handle(slot, !!data)}
              >
                <span className="slot-name">{SLOT_NAMES[String(slot)]}</span>
                <span className="slot-info">
                  {data ? data.chapterTitle || "調査記録" : "―― NO DATA ――"}
                </span>
                <span className="slot-date">
                  {data ? new Date(data.timestamp).toLocaleString("ja-JP") : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
