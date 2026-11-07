import { Gauge, RotateCcw, Volume2, VolumeX } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useGameSettings, updateSettings, resetSettings } from "@/game/settings";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SettingRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-white/[0.06] py-3.5 last:border-b-0">
      <div>
        <div className="text-[11px] font-semibold tracking-[0.2em] text-white/85 uppercase">
          {label}
        </div>
        <div className="mt-0.5 text-[11px] text-white/40">{hint}</div>
      </div>
      {children}
    </div>
  );
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const settings = useGameSettings();
  const masterPercent = Math.round(settings.masterVolume * 100);
  const sfxPercent = Math.round(settings.sfxVolume * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sb-panel sb-cut max-h-[90vh] max-w-md overflow-y-auto border-neon-cyan/20 p-6 sm:max-w-lg">
        <DialogHeader>
          <div className="sb-label text-neon-cyan/70">SYSTEM // CONFIG</div>
          <DialogTitle className="font-display text-2xl tracking-wide text-white uppercase">
            Settings
          </DialogTitle>
          <DialogDescription className="text-xs text-white/45">
            Tune the operator interface. Audio initialises on your first input.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          <SettingRow label="Master volume" hint="All game audio">
            <div className="flex w-40 items-center gap-3">
              <Volume2 className="size-3.5 shrink-0 text-neon-cyan/70" />
              <Slider
                value={[masterPercent]}
                min={0}
                max={100}
                step={5}
                onValueChange={([value]) => updateSettings({ masterVolume: value / 100 })}
                aria-label="Master volume"
              />
              <span className="sb-num w-8 text-right text-[10px] text-white/50">{masterPercent}</span>
            </div>
          </SettingRow>

          <SettingRow label="Effects volume" hint="Sword, dash and impact SFX">
            <div className="flex w-40 items-center gap-3">
              <Gauge className="size-3.5 shrink-0 text-neon-crimson/70" />
              <Slider
                value={[sfxPercent]}
                min={0}
                max={100}
                step={5}
                onValueChange={([value]) => updateSettings({ sfxVolume: value / 100 })}
                aria-label="Effects volume"
              />
              <span className="sb-num w-8 text-right text-[10px] text-white/50">{sfxPercent}</span>
            </div>
          </SettingRow>

          <SettingRow label="Mute all" hint="Silence master output">
            <div className="flex items-center gap-2 text-white/40">
              <VolumeX className="size-3.5" />
              <Switch
                checked={settings.muted}
                onCheckedChange={(checked) => updateSettings({ muted: checked })}
                aria-label="Mute all audio"
              />
            </div>
          </SettingRow>

          <SettingRow label="FPS counter" hint="Show frame rate in the HUD">
            <Switch
              checked={settings.showFps}
              onCheckedChange={(checked) => updateSettings({ showFps: checked })}
              aria-label="Show FPS counter"
            />
          </SettingRow>

          <SettingRow label="Camera shake" hint="Impact movement on the camera">
            <Switch
              checked={settings.screenShake}
              onCheckedChange={(checked) => updateSettings({ screenShake: checked })}
              aria-label="Camera shake"
            />
          </SettingRow>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] tracking-[0.2em] text-white/40 uppercase hover:text-white"
            onClick={resetSettings}
          >
            <RotateCcw className="mr-2 size-3" />
            Reset defaults
          </Button>
          <Button
            size="sm"
            className="sb-cut-sm bg-neon-cyan px-5 text-[10px] font-bold tracking-[0.24em] text-[#04121a] uppercase hover:bg-[#66f0ff]"
            onClick={() => onOpenChange(false)}
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
