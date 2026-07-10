import type { EndingDef } from "../engine/types";

export const ENDINGS: EndingDef[] = [
  {
    id: "end_a",
    code: "END A",
    title: "本流",
    desc: "選ばれなかった役割。改変された世界で、それでも梯子は記録を続ける。",
  },
  {
    id: "end_b",
    code: "END B",
    title: "編集された頁",
    desc: "自らの手でピアスを渡した世界。家族は還り、代わりに何かが永遠に失われた。",
  },
  {
    id: "end_c",
    code: "END C",
    title: "停点の狭間",
    desc: "すべての推理を完全に解いた者だけが辿り着く、頁の綴じ方の真実。",
  },
];

export function getEnding(id: string): EndingDef {
  return ENDINGS.find((e) => e.id === id) ?? ENDINGS[0];
}
