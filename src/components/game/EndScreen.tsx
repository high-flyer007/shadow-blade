import { Home, RotateCcw } from "lucide-react";
import type { HudSnapshot } from "@/game/GameConfig";

interface EndScreenProps {
  status: "gameover" | "victory";
  hud: HudSnapshot;
  onRestart: () => void;
  onMainMenu: () => void;
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="sb-label text-[8px]">{label}</div>
      <div className={`sb-num mt-1 text-xl font-bold ${accent ?? "text-white"}`}>{value}</div>
    </div>
  );
}

export function EndScreen({ status, hud, onRestart, onMainMenu }: EndScreenProps) {
  const victory = status === "victory";
  const minutes = Math.floor(hud.elapsed / 60);
  const seconds = Math.floor(hud.elapsed % 60)
    .toString()
    .padStart(2, "0");

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-[#03060c]/85 p-4 backdrop-blur-[7px]">
      <div className="sb-scanlines relative w-full max-w-2xl">
        <div
          className={`${victory ? "sb-panel" : "sb-panel-crimson"} sb-cut sb-rise relative overflow-hidden p-6 md:p-10`}
        >
          <div
            className={`absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent ${
              victory ? "via-neon-green/70" : "via-neon-crimson/70"
            } to-transparent`}
          />
          <div
            className={`sb-label ${victory ? "text-neon-green/70" : "text-neon-crimson/70"}`}
          >
            {victory ? "OPERATION // COMPLETE" : "OPERATION // FAILED"}
          </div>
          <h2
            className={`sb-title mt-2 text-5xl md:text-7xl ${
              victory ? "text-white sb-glow-cyan" : "text-white sb-glow-crimson"
            }`}
          >
            {victory ? (
              <>
                SECTOR
                <br />
                <span className="text-neon-green">CLEARED</span>
              </>
            ) : (
              <>
                GAME
                <br />
                <span className="text-neon-crimson">OVER</span>
              </>
            )}
          </h2>
          <p className="mt-3 max-w-md text-xs leading-relaxed text-white/40">
            {victory
              ? "The extraction gate seals behind you. Sector 07 will remember the blade in the dark."
              : "Your vitals flatline in the rain. The district forgets another name — but the shadows keep score."}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="FINAL SCORE" value={hud.score.toLocaleString("en-US")} accent="text-neon-cyan" />
            <Stat label="ELIMINATED" value={`${hud.kills} / ${hud.totalEnemies}`} accent="text-neon-crimson" />
            <Stat label="TIME" value={`${minutes}:${seconds}`} />
            <Stat label="STATUS" value={victory ? "EXFIL" : "KIA"} accent={victory ? "text-neon-green" : "text-neon-crimson"} />
          </div>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={onRestart}
              className="group flex flex-1 items-center justify-center gap-2 border border-neon-cyan/50 bg-neon-cyan/[0.08] px-6 py-3 text-[11px] font-bold tracking-[0.24em] text-neon-cyan uppercase transition hover:bg-neon-cyan/[0.18]"
            >
              <RotateCcw className="size-3.5 transition group-hover:-rotate-45" />
              {victory ? "Run it again" : "Redeploy"}
            </button>
            <button
              type="button"
              onClick={onMainMenu}
              className="flex flex-1 items-center justify-center gap-2 border border-white/15 bg-white/[0.02] px-6 py-3 text-[11px] font-bold tracking-[0.24em] text-white/60 uppercase transition hover:border-white/35 hover:text-white"
            >
              <Home className="size-3.5" />
              Main menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
