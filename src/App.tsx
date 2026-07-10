import { useEffect } from "react";
import { useGameStore } from "./store/gameStore";
import TitleScreen from "./components/screens/TitleScreen";
import GameScreen from "./components/screens/GameScreen";
import UnlockScreen from "./components/screens/UnlockScreen";
import EndingScreen from "./components/screens/EndingScreen";

export default function App() {
  const screen = useGameStore((s) => s.screen);

  useEffect(() => {
    useGameStore.getState().init();
  }, []);

  return (
    <div className="app-frame">
      {screen === "title" && <TitleScreen />}
      {screen === "game" && <GameScreen />}
      {screen === "unlock" && <UnlockScreen />}
      {screen === "ending" && <EndingScreen />}
    </div>
  );
}
