import { Eye, Swords, Wind, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HowToPlayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CONTROLS = [
  { keys: ["A", "D"], action: "Move", note: "Momentum-based ground and air control" },
  { keys: ["SPACE"], action: "Jump", note: "Hold higher, tap short, again mid-air to double" },
  { keys: ["SHIFT"], action: "Shadow Dash", note: "Invincible burst · 1.2s cooldown" },
  { keys: ["J"], action: "Katana", note: "Chain three strikes inside the 0.5s combo window" },
  { keys: ["I"], action: "Shuriken", note: "Five blades, slowly replenished" },
  { keys: ["ESC"], action: "Pause", note: "Freeze the simulation" },
];

const MOVES = [
  {
    icon: Zap,
    title: "Shadow Dash",
    body: "Phase through danger for 200ms. Passing through a guard's attack window keeps your vitals intact.",
    color: "text-neon-cyan",
  },
  {
    icon: Swords,
    title: "Three-Strike Kenjutsu",
    body: "Rising Cut, Ascending Fang, Crimson Tempest. Land the finisher for heavy knockback and critical damage.",
    color: "text-neon-crimson",
  },
  {
    icon: Wind,
    title: "Wall Routes",
    body: "Jump into a wall to slide, then jump away with a directional kick. Wall jumps reset one air jump.",
    color: "text-neon-purple",
  },
  {
    icon: Eye,
    title: "Read The Vision",
    body: "Guards sweep a cone of light. Break line of sight and they will hunt your last known position.",
    color: "text-neon-green",
  },
];

export function HowToPlayDialog({ open, onOpenChange }: HowToPlayDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sb-panel sb-cut max-h-[88vh] max-w-3xl overflow-y-auto border-neon-cyan/20 p-6 sm:max-w-3xl">
        <DialogHeader>
          <div className="sb-label text-neon-cyan/70">FIELD MANUAL // OPERATIVE</div>
          <DialogTitle className="font-display text-2xl tracking-wide text-white uppercase">
            How to play
          </DialogTitle>
          <DialogDescription className="text-xs text-white/45">
            You are the last shadow in Sector 07. Twelve hostiles stand between you and extraction.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div>
            <div className="sb-label mb-2 text-white/50">CONTROLS</div>
            <div className="space-y-1.5">
              {CONTROLS.map((row) => (
                <div
                  key={row.action}
                  className="flex items-start justify-between gap-3 border-b border-white/[0.06] py-2 last:border-b-0"
                >
                  <div className="flex flex-wrap gap-1">
                    {row.keys.map((key) => (
                      <kbd
                        key={key}
                        className="inline-flex min-w-7 items-center justify-center border border-white/15 bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-semibold text-[#d5e5ff]"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-semibold tracking-[0.14em] text-white/80 uppercase">
                      {row.action}
                    </div>
                    <div className="text-[10px] leading-tight text-white/35">{row.note}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 border-l-2 border-neon-crimson/60 bg-neon-crimson/[0.05] px-3 py-2 text-[11px] leading-relaxed text-white/50">
              Electric floors and laser gates hurt. Falling off the district is fatal. Defeat every
              hostile to unlock the extraction gate.
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            {MOVES.map((move) => {
              const Icon = move.icon;
              return (
                <div key={move.title} className="sb-panel sb-cut-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`size-4 ${move.color}`} strokeWidth={2.2} />
                    <span className="text-[11px] font-bold tracking-[0.14em] text-white/85 uppercase">
                      {move.title}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-white/40">{move.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
