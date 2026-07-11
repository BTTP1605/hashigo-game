import { useEffect } from "react";
import { useGameStore } from "../../store/gameStore";
import { getScene } from "../../data/scenario";
import Background from "../game/Background";
import PortraitView from "../game/PortraitView";
import MessageWindow from "../game/MessageWindow";
import ChoiceLayer from "../game/ChoiceLayer";
import DeductionView from "../game/DeductionView";
import BacklogPanel from "../game/BacklogPanel";
import FilePanel from "../game/FilePanel";
import SaveLoadPanel from "../game/SaveLoadPanel";
import ToastArea from "../game/ToastArea";

export default function GameScreen() {
  const sceneId = useGameStore((s) => s.sceneId);
  const nodeIndex = useGameStore((s) => s.nodeIndex);
  const bg = useGameStore((s) => s.bg);
  const overlay = useGameStore((s) => s.overlay);
  const advance = useGameStore((s) => s.advance);
  const setOverlay = useGameStore((s) => s.setOverlay);
  const backToTitle = useGameStore((s) => s.backToTitle);
  const autoMode = useGameStore((s) => s.autoMode);
  const skipMode = useGameStore((s) => s.skipMode);
  const toggleAuto = useGameStore((s) => s.toggleAuto);
  const toggleSkip = useGameStore((s) => s.toggleSkip);

  const scene = getScene(sceneId);
  const node = scene?.nodes[nodeIndex] ?? null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " ") {
        const st = useGameStore.getState();
        if (st.overlay) return;
        const n = getScene(st.sceneId)?.nodes[st.nodeIndex];
        if (n && (n.type === "text" || n.type === "chapter")) {
          e.preventDefault();
          st.advance();
        }
      }
      if (e.key === "Escape") {
        useGameStore.getState().setOverlay(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!node) return <div className="game-screen" />;

  return (
    <div className="game-screen">
      <Background bg={bg} />
      {node.type === "text" && node.portrait && <PortraitView portrait={node.portrait} />}

      <div className="game-menu">
        <button className={autoMode ? "mode-on" : ""} onClick={toggleAuto}>AUTO</button>
        <button className={skipMode ? "mode-on" : ""} onClick={toggleSkip}>SKIP</button>
        <button onClick={() => setOverlay("backlog")}>LOG</button>
        <button onClick={() => setOverlay("file")}>FILE</button>
        <button onClick={() => setOverlay("save")}>SAVE</button>
        <button onClick={() => setOverlay("load")}>LOAD</button>
        <button onClick={backToTitle}>TITLE</button>
      </div>

      {node.type === "chapter" && (
        <div className="chapter-card" onClick={advance}>
          <div className="ch-title">{node.title}</div>
          {node.subtitle && <div className="ch-sub">{node.subtitle}</div>}
          <div className="ch-hint">▼ CLICK TO CONTINUE</div>
        </div>
      )}

      {node.type === "text" && <MessageWindow node={node} />}
      {node.type === "choice" && <ChoiceLayer node={node} />}
      {node.type === "deduction" && <DeductionView deductionId={node.deductionId} />}

      <ToastArea />

      {overlay === "backlog" && <BacklogPanel onClose={() => setOverlay(null)} />}
      {overlay === "file" && <FilePanel onClose={() => setOverlay(null)} />}
      {overlay === "save" && <SaveLoadPanel mode="save" onClose={() => setOverlay(null)} />}
      {overlay === "load" && <SaveLoadPanel mode="load" onClose={() => setOverlay(null)} />}
    </div>
  );
}
