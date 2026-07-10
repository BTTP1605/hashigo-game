import { useEffect, useState } from "react";
import type { ScenarioNode } from "../../engine/types";
import { useGameStore } from "../../store/gameStore";

type TextNode = Extract<ScenarioNode, { type: "text" }>;

export default function MessageWindow({ node }: { node: TextNode }) {
  const advance = useGameStore((s) => s.advance);
  const [count, setCount] = useState(0);
  const full = node.text;
  const isBbs = !!node.bbs;
  const speed = isBbs ? 8 : 26;

  useEffect(() => {
    setCount(0);
    const timer = setInterval(() => {
      setCount((c) => {
        if (c >= full.length) {
          clearInterval(timer);
          return c;
        }
        return c + 1;
      });
    }, speed);
    return () => clearInterval(timer);
  }, [node.id, full, speed]);

  const done = count >= full.length;
  const shown = done ? full : full.slice(0, count);

  function handleClick() {
    if (!done) {
      setCount(full.length);
    } else {
      advance();
    }
  }

  if (isBbs) {
    return (
      <div className="message-window bbs-mode" onClick={handleClick}>
        <div className="bbs-post">
          <div className="bbs-header">
            {node.bbs!.no > 0 && <span>{node.bbs!.no}：</span>}
            <span className="bbs-name">{node.bbs!.handle || "以下、名無しにかわりましてお送りします"}</span>
            {node.bbs!.date && <span>：{node.bbs!.date}</span>}
          </div>
          <div className="bbs-body">{shown}</div>
        </div>
        {done && <div className="advance-cursor">▼</div>}
      </div>
    );
  }

  return (
    <div className="message-window" onClick={handleClick}>
      {node.speaker && <span className="speaker">{node.speaker}</span>}
      <div className="msg-text">{shown}</div>
      {done && <div className="advance-cursor">▼</div>}
    </div>
  );
}
