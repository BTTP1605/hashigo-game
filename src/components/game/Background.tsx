import { useEffect, useState } from "react";

const BG_LABELS: Record<string, string> = {
  bg_black: "",
  bg_rain_conveni: "雨のコンビニ",
  bg_room: "アパート",
  bg_bbs: "掲示板 ～enigma～",
  bg_street: "夜の路上",
  bg_koban: "交番",
  bg_doutor: "ドトールコーヒー",
  bg_void: "誰もいない空間",
  bg_station: "駅構内",
  bg_shrine: "S区の神社",
  bg_home2028: "2028年の家",
  bg_car: "車内",
};

export default function Background({ bg }: { bg: string }) {
  const [imgOk, setImgOk] = useState(true);
  useEffect(() => setImgOk(true), [bg]);

  return (
    <div className={`bg-layer ${bg}`}>
      {imgOk && (
        <img
          src={`${import.meta.env.BASE_URL}assets/bg/${bg}.png`}
          onError={() => setImgOk(false)}
          alt=""
        />
      )}
      {!imgOk && <span className="bg-label">{BG_LABELS[bg] ?? ""}</span>}
    </div>
  );
}
