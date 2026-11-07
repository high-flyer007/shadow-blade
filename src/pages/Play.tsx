import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { GameCanvas, type GameHandle } from "@/components/game/GameCanvas";
import { HUD } from "@/components/game/HUD";
import { TouchControls } from "@/components/game/TouchControls";
import { PauseMenu } from "@/components/game/PauseMenu";
import { EndScreen } from "@/components/game/EndScreen";
import { useGameSettings } from "@/game/settings";
import type { HudSnapshot } from "@/game/GameConfig";

const INITIAL_HUD: HudSnapshot = {
  hp: 100,
  maxHp: 100,
  score: 0,
  kills: 0,
  totalEnemies: 12,
  dashCharge: 1,
  dashActive: false,
  shurikens: 5,
  maxShurikens: 5,
  comboStep: 0,
  state: "RESPAWNING",
  status: "playing",
  exitUnlocked: false,
  fps: 60,
  elapsed: 0,
  message: "",
};

export default function Play() {
  const navigate = useNavigate();
  const settings = useGameSettings();
  const gameRef = useRef<GameHandle>(null);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [paused, setPaused] = useState(false);
  const [end, setEnd] = useState<"gameover" | "victory" | null>(null);

  const handleEnd = useCallback((status: "gameover" | "victory") => {
    setEnd(status);
    setPaused(false);
  }, []);

  const handleRestart = useCallback(() => {
    setEnd(null);
    setPaused(false);
    gameRef.current?.restart();
  }, []);

  const handleMainMenu = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleVirtual = useCallback((control: Parameters<GameHandle["setVirtual"]>[0], down: boolean) => {
    gameRef.current?.setVirtual(control, down);
  }, []);

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-[#04060c] text-white">
      <GameCanvas
        ref={gameRef}
        onHud={setHud}
        onEnd={handleEnd}
        onPauseChange={setPaused}
        settings={settings}
      />

      {/* Cinematic framing over the canvas */}
      <div className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_120px_rgba(0,0,0,0.75)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-[#04060c]/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-[#04060c]/80 to-transparent" />

      <HUD hud={hud} showFps={settings.showFps} onPause={() => gameRef.current?.pause()} />

      {!paused && !end && <TouchControls onVirtual={handleVirtual} />}

      {paused && !end && (
        <PauseMenu
          hud={hud}
          onResume={() => gameRef.current?.resume()}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
        />
      )}

      {end && (
        <EndScreen
          status={end}
          hud={hud}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
        />
      )}
    </main>
  );
}
