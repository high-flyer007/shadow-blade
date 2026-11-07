import { ArrowLeft, ArrowRight, Sparkles, Swords, Zap } from "lucide-react";
import type { Control } from "@/game/core/InputManager";

interface TouchControlsProps {
  onVirtual: (control: Control, down: boolean) => void;
}

function TouchButton({
  control,
  onVirtual,
  children,
  className = "",
  label,
}: {
  control: Control;
  onVirtual: (control: Control, down: boolean) => void;
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`pointer-events-auto flex select-none flex-col items-center justify-center gap-0.5 border border-neon-cyan/30 bg-[#071019]/75 text-neon-cyan backdrop-blur-sm transition active:scale-95 active:border-neon-cyan active:bg-neon-cyan/20 ${className}`}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        onVirtual(control, true);
      }}
      onPointerUp={(event) => {
        event.preventDefault();
        onVirtual(control, false);
      }}
      onPointerCancel={() => onVirtual(control, false)}
      onPointerLeave={() => onVirtual(control, false)}
      onLostPointerCapture={() => onVirtual(control, false)}
    >
      {children}
      {label && <span className="text-[8px] font-semibold tracking-[0.18em] uppercase">{label}</span>}
    </button>
  );
}

/** Optional touch overlay; talks to InputManager through the engine handle. */
export function TouchControls({ onVirtual }: TouchControlsProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-between p-4 pb-6 select-none md:hidden">
      <div className="flex gap-3">
        <TouchButton control="left" onVirtual={onVirtual} className="size-14 rounded-full" label="MOVE">
          <ArrowLeft className="size-5" />
        </TouchButton>
        <TouchButton control="right" onVirtual={onVirtual} className="size-14 rounded-full" label="MOVE">
          <ArrowRight className="size-5" />
        </TouchButton>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-2">
          <TouchButton control="shuriken" onVirtual={onVirtual} className="size-11 rounded-full">
            <Sparkles className="size-4" />
          </TouchButton>
          <TouchButton control="dash" onVirtual={onVirtual} className="size-12 rounded-full" label="DASH">
            <Zap className="size-4" />
          </TouchButton>
        </div>
        <div className="flex flex-col gap-2">
          <TouchButton control="attack" onVirtual={onVirtual} className="size-14 rounded-full" label="SLASH">
            <Swords className="size-5" />
          </TouchButton>
          <TouchButton
            control="jump"
            onVirtual={onVirtual}
            className="h-14 w-16 rounded-md border-neon-crimson/40 text-white"
            label="JUMP"
          >
            <span className="text-base font-bold text-neon-crimson">↑</span>
          </TouchButton>
        </div>
      </div>
    </div>
  );
}
