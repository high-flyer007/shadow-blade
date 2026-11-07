import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { GameEngine } from "@/game/GameEngine";
import type { GameSettings, HudSnapshot } from "@/game/GameConfig";
import type { Control } from "@/game/core/InputManager";

export interface GameHandle {
  pause: () => void;
  resume: () => void;
  restart: () => void;
  updateSettings: (settings: GameSettings) => void;
  setVirtual: (control: Control, down: boolean) => void;
}

interface GameCanvasProps {
  onHud: (snapshot: HudSnapshot) => void;
  onEnd: (status: "gameover" | "victory") => void;
  onPauseChange: (paused: boolean) => void;
  settings: GameSettings;
}

/**
 * Mounts the canvas and owns exactly one GameEngine for the lifetime of the
 * route. React never drives the simulation; it only receives HUD snapshots.
 */
export const GameCanvas = forwardRef<GameHandle, GameCanvasProps>(function GameCanvas(
  props,
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const callbacksRef = useRef(props);
  callbacksRef.current = props;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const engine = new GameEngine(canvas, {
      onHud: (snapshot) => callbacksRef.current.onHud(snapshot),
      onEnd: (status) => callbacksRef.current.onEnd(status),
      onPauseChange: (paused) => callbacksRef.current.onPauseChange(paused),
      settings: callbacksRef.current.settings,
    });
    engineRef.current = engine;

    const applySize = () => {
      const rect = wrap.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) engine.resize(rect.width, rect.height);
    };
    applySize();
    const observer = new ResizeObserver(applySize);
    observer.observe(wrap);
    window.addEventListener("orientationchange", applySize);

    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", applySize);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.updateSettings(props.settings);
  }, [props.settings]);

  useImperativeHandle(ref, () => ({
    pause: () => engineRef.current?.pause(),
    resume: () => engineRef.current?.resume(),
    restart: () => engineRef.current?.restart(),
    updateSettings: (settings) => engineRef.current?.updateSettings(settings),
    setVirtual: (control, down) => engineRef.current?.setVirtualControl(control, down),
  }));

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden bg-[#04060c]">
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />
    </div>
  );
});
