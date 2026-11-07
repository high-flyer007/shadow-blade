import { useState } from "react";
import { Settings, Volume2 } from "lucide-react";
import type { HudSnapshot } from "@/game/GameConfig";
import { SettingsDialog } from "./SettingsDialog";

interface PauseMenuProps {
  hud: HudSnapshot;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

function MenuAction({
  index,
  label,
  hint,
  onClick,
  accent = false,
}: {
  index: string;
  label: string;
  hint: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full items-center gap-4 border px-5 py-3.5 text-left transition-all duration-200 ${
        accent
          ? "border-neon-cyan/50 bg-neon-cyan/[0.07] hover:bg-neon-cyan/[0.14]"
          : "border-white/10 bg-white/[0.015] hover:border-neon-cyan/40 hover:bg-neon-cyan/[0.05]"
      }`}
    >
      <span
        className={`sb-num text-[10px] tracking-[0.2em] ${
          accent ? "text-neon-cyan" : "text-white/25 group-hover:text-neon-cyan/60"
        }`}
      >
        {index}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-bold tracking-[0.18em] text-white/90 uppercase">
          {label}
        </span>
        <span className="mt-0.5 block text-[10px] tracking-[0.12em] text-white/30 uppercase">
          {hint}
        </span>
      </span>
      <span
        className={`h-px w-6 transition-all duration-200 group-hover:w-10 ${
          accent ? "bg-neon-cyan" : "bg-white/20 group-hover:bg-neon-cyan"
        }`}
      />
    </button>
  );
}

export function PauseMenu({ hud, onResume, onRestart, onMainMenu }: PauseMenuProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center overflow-y-auto bg-[#03060c]/80 p-4 py-8 backdrop-blur-[6px] md:items-center">
      <div className="sb-scanlines relative w-full max-w-3xl overflow-hidden">
        <div className="sb-panel sb-cut sb-rise relative grid gap-8 p-6 md:grid-cols-[1.1fr_1fr] md:p-9">
          <div className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-neon-cyan/60 to-transparent" />
          <div>
            <div className="sb-label text-neon-cyan/70">SIMULATION // HALTED</div>
            <h2 className="sb-title mt-2 text-6xl text-white md:text-7xl">
              PAU<span className="text-neon-cyan sb-glow-cyan">S</span>ED
            </h2>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-white/40">
              The rain keeps falling, but the district holds its breath. Press{" "}
              <kbd className="border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/70">
                ESC
              </kbd>{" "}
              to dive back in.
            </p>

            <div className="mt-5 flex gap-6 border-t border-white/10 pt-4">
              <div>
                <div className="sb-label text-[8px]">SCORE</div>
                <div className="sb-num text-lg font-bold text-white">{hud.score.toLocaleString("en-US")}</div>
              </div>
              <div>
                <div className="sb-label text-[8px]">HOSTILES</div>
                <div className="sb-num text-lg font-bold text-neon-crimson">
                  {hud.kills}/{hud.totalEnemies}
                </div>
              </div>
              <div>
                <div className="sb-label text-[8px]">VITALS</div>
                <div className="sb-num text-lg font-bold text-neon-cyan">{hud.hp}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <MenuAction index="01" label="Resume" hint="Return to the district" onClick={onResume} accent />
            <MenuAction index="02" label="Restart sector" hint="Reset the full level" onClick={onRestart} />
            <MenuAction index="03" label="Settings" hint="Audio, HUD, camera" onClick={() => setSettingsOpen(true)} />
            <MenuAction index="04" label="Main menu" hint="Abandon the operation" onClick={onMainMenu} />
            <div className="mt-2 flex items-center gap-2 text-[9px] tracking-[0.2em] text-white/25 uppercase">
              <Volume2 className="size-3" />
              Audio suspends while paused
              <Settings className="ml-auto size-3 text-neon-cyan/40" />
            </div>
          </div>
        </div>
      </div>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
