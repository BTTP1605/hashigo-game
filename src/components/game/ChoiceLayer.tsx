import type { ScenarioNode } from "../../engine/types";
import { evalCond } from "../../engine/conditions";
import { useGameStore } from "../../store/gameStore";

type ChoiceNode = Extract<ScenarioNode, { type: "choice" }>;

export default function ChoiceLayer({ node }: { node: ChoiceNode }) {
  const choose = useGameStore((s) => s.choose);
  const flags = useGameStore((s) => s.flags);
  const items = useGameStore((s) => s.items);
  const keywords = useGameStore((s) => s.keywords);

  const visible = node.options.filter(
    (o) => !o.if || evalCond(o.if, { flags, items, keywords })
  );

  return (
    <div className="choice-layer">
      {node.prompt && <div className="choice-prompt">{node.prompt}</div>}
      {visible.map((o, i) => (
        <button key={i} onClick={() => choose(o)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
