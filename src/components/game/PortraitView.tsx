import { useEffect, useState } from "react";
import characters from "../../data/characters.json";

export default function PortraitView({ portrait }: { portrait: string }) {
  const [imgOk, setImgOk] = useState(true);
  useEffect(() => setImgOk(true), [portrait]);

  const charId = portrait.split("_")[0];
  const char = characters.find((c) => c.id === charId);

  return (
    <div className="portrait-layer">
      {imgOk ? (
        <img
          src={`${import.meta.env.BASE_URL}assets/char/${portrait}.png`}
          onError={() => setImgOk(false)}
          alt={char?.name ?? ""}
        />
      ) : (
        char && (
          <div className="portrait-fallback" style={{ background: char.color }}>
            {char.name}
          </div>
        )
      )}
    </div>
  );
}
