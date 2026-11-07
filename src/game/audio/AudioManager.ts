import type { GameSettings } from "../GameConfig";

type SoundName =
  | "jump"
  | "doubleJump"
  | "wallJump"
  | "dash"
  | "slash1"
  | "slash2"
  | "slash3"
  | "hit"
  | "crit"
  | "shuriken"
  | "shurikenHit"
  | "hurt"
  | "alert"
  | "enemyAttack"
  | "enemyDeath"
  | "land"
  | "step"
  | "hazard"
  | "locked"
  | "victory"
  | "gameOver";

/**
 * Tiny procedural Web Audio sound engine. No external assets, all sounds are
 * synthesized from oscillators and short noise bursts.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private ambientGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientLfo: OscillatorNode | null = null;
  private muted = false;
  private volumeMaster = 0.8;
  private volumeSfx = 0.9;

  constructor(settings?: GameSettings) {
    if (settings) {
      this.volumeMaster = settings.masterVolume;
      this.volumeSfx = settings.sfxVolume;
      this.muted = settings.muted;
    }
  }

  init(): void {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    try {
      const Ctor: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.volumeMaster;
      this.master.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = this.volumeSfx;
      this.sfx.connect(this.master);

      const length = Math.floor(this.ctx.sampleRate * 0.6);
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) {
        channel[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    } catch {
      this.ctx = null;
    }
  }

  applySettings(settings: GameSettings): void {
    this.volumeMaster = settings.masterVolume;
    this.volumeSfx = settings.sfxVolume;
    this.muted = settings.muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : this.volumeMaster, this.ctx.currentTime, 0.02);
    }
    if (this.sfx && this.ctx) {
      this.sfx.gain.setTargetAtTime(this.volumeSfx, this.ctx.currentTime, 0.02);
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : this.volumeMaster, this.ctx.currentTime, 0.02);
    }
  }

  startAmbient(): void {
    if (!this.ctx || !this.sfx || this.ambientOsc) return;
    const now = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(0.035, now, 1.2);
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 58;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.14;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 10;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(this.sfx);
    osc.start();
    lfo.start();
    this.ambientOsc = osc;
    this.ambientLfo = lfo;
    this.ambientGain = gain;
  }

  stopAmbient(): void {
    if (this.ambientOsc) {
      try {
        this.ambientOsc.stop();
      } catch {
        // already stopped
      }
      this.ambientOsc = null;
    }
    if (this.ambientLfo) {
      try {
        this.ambientLfo.stop();
      } catch {
        // already stopped
      }
      this.ambientLfo = null;
    }
    this.ambientGain?.disconnect();
    this.ambientGain = null;
  }

  private tone(
    type: OscillatorType,
    fromFreq: number,
    toFreq: number,
    duration: number,
    volume: number,
    delay = 0,
  ): void {
    if (!this.ctx || !this.sfx) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, fromFreq), now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, toFreq), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.sfx);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private noise(
    duration: number,
    volume: number,
    filterType: BiquadFilterType,
    fromFreq: number,
    toFreq: number,
    delay = 0,
  ): void {
    if (!this.ctx || !this.sfx || !this.noiseBuffer) return;
    const now = this.ctx.currentTime + delay;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(fromFreq, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, toFreq), now + duration);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfx);
    source.start(now);
    source.stop(now + duration + 0.02);
  }

  play(name: SoundName): void {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case "jump":
        this.tone("triangle", 260, 540, 0.13, 0.2);
        this.noise(0.08, 0.05, "highpass", 900, 2200);
        break;
      case "doubleJump":
        this.tone("square", 420, 880, 0.16, 0.13);
        this.tone("sine", 620, 1240, 0.2, 0.1, 0.02);
        this.noise(0.18, 0.1, "bandpass", 1600, 600);
        break;
      case "wallJump":
        this.tone("triangle", 220, 460, 0.12, 0.16);
        this.noise(0.1, 0.08, "bandpass", 700, 1800);
        break;
      case "dash":
        this.noise(0.26, 0.19, "bandpass", 1500, 300);
        this.tone("sawtooth", 320, 90, 0.22, 0.08);
        break;
      case "slash1":
        this.noise(0.14, 0.16, "highpass", 2200, 700);
        this.tone("triangle", 700, 320, 0.1, 0.06);
        break;
      case "slash2":
        this.noise(0.16, 0.18, "highpass", 2600, 900);
        this.tone("triangle", 880, 420, 0.12, 0.06);
        break;
      case "slash3":
        this.noise(0.26, 0.22, "highpass", 3400, 500);
        this.tone("sawtooth", 520, 190, 0.24, 0.1);
        break;
      case "hit":
        this.noise(0.09, 0.2, "lowpass", 1600, 300);
        this.tone("sine", 180, 70, 0.12, 0.2);
        break;
      case "crit":
        this.noise(0.14, 0.24, "lowpass", 3000, 400);
        this.tone("square", 1100, 300, 0.18, 0.1);
        this.tone("sine", 150, 55, 0.22, 0.24);
        break;
      case "shuriken":
        this.tone("triangle", 1200, 500, 0.1, 0.09);
        this.noise(0.07, 0.08, "highpass", 3000, 1500);
        break;
      case "shurikenHit":
        this.noise(0.08, 0.12, "bandpass", 2000, 700);
        this.tone("square", 720, 260, 0.08, 0.05);
        break;
      case "hurt":
        this.tone("sawtooth", 210, 60, 0.28, 0.2);
        this.noise(0.2, 0.16, "lowpass", 900, 200);
        break;
      case "alert":
        this.tone("square", 760, 760, 0.07, 0.07);
        this.tone("square", 1080, 1080, 0.09, 0.07, 0.09);
        break;
      case "enemyAttack":
        this.noise(0.2, 0.15, "bandpass", 1200, 260);
        this.tone("sawtooth", 300, 120, 0.16, 0.08);
        break;
      case "enemyDeath":
        this.noise(0.35, 0.2, "lowpass", 1800, 120);
        this.tone("sawtooth", 260, 45, 0.35, 0.13);
        break;
      case "land":
        this.noise(0.075, 0.07, "lowpass", 700, 160);
        break;
      case "step":
        this.noise(0.045, 0.025, "lowpass", 520, 180);
        break;
      case "hazard":
        this.tone("sawtooth", 90, 50, 0.3, 0.2);
        this.noise(0.22, 0.14, "bandpass", 500, 180);
        break;
      case "locked":
        this.tone("square", 140, 100, 0.2, 0.1);
        break;
      case "victory":
        [523, 659, 784, 1046].forEach((freq, i) => {
          this.tone("triangle", freq, freq, 0.32, 0.13, i * 0.13);
        });
        this.noise(0.5, 0.06, "highpass", 3000, 1200, 0.1);
        break;
      case "gameOver":
        [330, 262, 196, 131].forEach((freq, i) => {
          this.tone("sawtooth", freq, freq * 0.98, 0.4, 0.1, i * 0.18);
        });
        break;
    }
  }

  destroy(): void {
    this.stopAmbient();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.master = null;
    this.sfx = null;
    this.noiseBuffer = null;
  }
}
