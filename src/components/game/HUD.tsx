import { Pause, Zap } from "lucide-react";
import type { HudSnapshot } from "@/game/GameConfig";

interface HUDProps {
  hud: HudSnapshot;
  showFps: boolean;
  onPause: () => void;
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-6 items-center justify-center rounded-sm border border-white/15 bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-[#c7d7ef] shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]">
      {children}
    </kbd>
  );
}

export function HUD({ hud, showFps, onPause }: HUDProps) {
  const hpRatio = hud.hp / hud.maxHp;
  const low = hpRatio <= 0.34;
  const segments = 10;
  const filledSegments = Math.ceil((hud.hp / hud.maxHp) * segments);
  const dashPercent = Math.round(hud.dashCharge * 100);
  const hostilesLeft = Math.max(0, hud.totalEnemies - hud.kills);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 select-none font-hud">
      {/* Top: vitals / objective / score */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 md:p-5">
        <div className={`sb-panel sb-cut-sm w-[210px] px-3 py-2.5 md:w-[272px] md:px-4 ${low ? "border-neon-crimson/40" : ""}`}>
          <div className="flex items-center justify-between">
            <span className="sb-label text-[8px] md:text-[9px]">VITAL // SHADOW</span>
            <span
              className={`sb-num text-[11px] font-bold md:text-sm ${
                low ? "sb-dot-pulse text-neon-crimson" : "text-neon-cyan"
              }`}
            >
              {hud.hp}
              <span className="text-[9px] text-white/35 md:text-[10px]"> / {hud.maxHp}</span>
            </span>
          </div>
          <div className="mt-2 flex gap-[3px]">
            {Array.from({ length: segments }).map((_, index) => (
              <span
                key={index}
                className={`h-2 flex-1 -skew-x-12 transition-colors duration-150 ${
                  index < filledSegments
                    ? low
                      ? "bg-neon-crimson shadow-[0_0_8px_rgba(255,49,85,0.7)]"
                      : "bg-gradient-to-r from-neon-cyan to-[#6ff2ff] shadow-[0_0_8px_rgba(0,229,255,0.5)]"
                    : "bg-white/[0.08]"
                }`}
              />
            ))}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[8px] tracking-[0.22em] uppercase">
            <span className="text-white/35">NEURAL LINK</span>
            <span className={low ? "text-neon-crimson" : "text-neon-green/80"}>
              {hud.state === "DYING" ? "FLATLINE" : low ? "CRITICAL" : "STABLE"}
            </span>
          </div>
        </div>

        <div className="hidden flex-1 flex-col items-center pt-1 md:flex">
          <div className="flex items-center gap-2 text-[9px] tracking-[0.34em] text-white/45 uppercase">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-neon-cyan/60" />
            SECTOR 07 // FORGOTTEN DISTRICT
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-neon-cyan/60" />
          </div>
          {hud.message ? (
            <div className="sb-cut-sm mt-2 border border-neon-cyan/25 bg-[#050a14]/80 px-4 py-1.5 text-[10px] tracking-[0.18em] text-neon-cyan uppercase">
              {hud.message}
            </div>
          ) : (
            <div className="mt-2 text-[9px] tracking-[0.24em] text-white/30 uppercase">
              {hud.exitUnlocked ? "EXTRACTION GATE ONLINE" : `${hostilesLeft} HOSTILES REMAIN`}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="sb-panel sb-cut-sm px-3 py-2.5 text-right md:px-4">
            <span className="sb-label text-[8px] md:text-[9px]">SCORE</span>
            <div className="sb-num text-lg leading-none font-bold text-white md:text-2xl">
              {hud.score.toLocaleString("en-US")}
            </div>
            <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[8px] tracking-[0.2em] uppercase">
              <span className="text-white/35">ELIMINATED</span>
              <span className="sb-num text-neon-crimson">
                {hud.kills.toString().padStart(2, "0")}
                <span className="text-white/30"> / {hud.totalEnemies}</span>
              </span>
            </div>
            <div className="mt-1.5 flex justify-end gap-[3px]">
              {Array.from({ length: hud.totalEnemies }).map((_, index) => (
                <span
                  key={index}
                  className={`h-1 w-1.5 -skew-x-12 ${
                    index < hud.kills ? "bg-neon-green/80" : "bg-neon-crimson/40"
                  }`}
                />
              ))}
            </div>
            {showFps && (
              <div className="sb-num mt-1 text-[8px] tracking-[0.18em] text-neon-cyan/50 uppercase">
                {hud.fps} FPS
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onPause}
            aria-label="Pause game"
            className="pointer-events-auto flex size-8 items-center justify-center border border-white/15 bg-[#070d18]/80 text-white/70 transition hover:border-neon-cyan/50 hover:text-neon-cyan"
          >
            <Pause className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Combo indicator */}
      {hud.comboStep > 0 && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center md:bottom-28">
          <div className="sb-label text-neon-crimson/80">KENJUTSU CHAIN</div>
          <div className="sb-title text-2xl text-white sb-glow-crimson">
            COMBO <span className="text-neon-crimson">×{hud.comboStep}</span>
          </div>
        </div>
      )}

      {/* Bottom: abilities / controls */}
      <div className="absolute inset-x-0 bottom-0 hidden items-end justify-between gap-3 p-3 md:flex md:p-5">
        <div className="sb-panel sb-cut-sm flex items-center gap-3 px-3 py-2.5 md:gap-4 md:px-4">
          <div className="relative flex items-center gap-2.5">
            <div
              className={`relative grid size-11 place-items-center rounded-full md:size-12 ${
                hud.dashCharge >= 1 ? "shadow-[0_0_18px_rgba(0,229,255,0.35)]" : ""
              }`}
              style={{
                background: `conic-gradient(${
                  hud.dashActive ? "#FF3155" : "#00E5FF"
                } ${dashPercent * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
              }}
            >
              <div className="absolute inset-[3px] rounded-full bg-[#070c16]" />
              <Zap
                className={`relative size-4 ${
                  hud.dashCharge >= 1 ? "text-neon-cyan" : "text-white/35"
                }`}
                strokeWidth={2.4}
              />
            </div>
            <div>
              <div className="sb-label text-[7px] md:text-[8px]">SHADOW DASH</div>
              <div
                className={`text-[10px] font-bold tracking-[0.16em] uppercase md:text-[11px] ${
                  hud.dashCharge >= 1 ? "text-neon-cyan" : "text-white/35"
                }`}
              >
                {hud.dashActive ? "PHASE" : hud.dashCharge >= 1 ? "READY" : `${dashPercent}%`}
              </div>
              <div className="mt-1 h-[3px] w-16 overflow-hidden bg-white/10">
                <div
                  className="h-full bg-neon-cyan transition-[width] duration-150"
                  style={{ width: `${dashPercent}%` }}
                />
              </div>
            </div>
          </div>

          <span className="h-9 w-px bg-white/10" />

          <div>
            <div className="sb-label text-[7px] md:text-[8px]">SHURIKEN</div>
            <div className="mt-1.5 flex items-center gap-1.5">
              {Array.from({ length: hud.maxShurikens }).map((_, index) => (
                <span
                  key={index}
                  className={`block size-2.5 rotate-45 border ${
                    index < hud.shurikens
                      ? "border-neon-cyan/70 bg-neon-cyan shadow-[0_0_8px_rgba(0,229,255,0.7)]"
                      : "border-white/15 bg-transparent"
                  }`}
                />
              ))}
              <span className="sb-num ml-1 text-[10px] text-white/50">
                {hud.shurikens}/{hud.maxShurikens}
              </span>
            </div>
          </div>
        </div>

        <div className="hidden flex-col items-end gap-1.5 text-[10px] text-white/45 lg:flex">
          <div className="flex items-center gap-2">
            <Key>A</Key>
            <Key>D</Key>
            <span className="tracking-[0.16em] uppercase">Move</span>
          </div>
          <div className="flex items-center gap-2">
            <Key>SPACE</Key>
            <span className="tracking-[0.16em] uppercase">Jump / Double</span>
          </div>
          <div className="flex items-center gap-2">
            <Key>SHIFT</Key>
            <span className="tracking-[0.16em] uppercase">Dash</span>
            <span className="mx-1 h-3 w-px bg-white/10" />
            <Key>J</Key>
            <span className="tracking-[0.16em] uppercase">Katana</span>
            <Key>I</Key>
            <span className="tracking-[0.16em] uppercase">Throw</span>
          </div>

        </div>
      </div>
    </div>
  );
}
