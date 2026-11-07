export type Control =
  | "left"
  | "right"
  | "up"
  | "down"
  | "jump"
  | "dash"
  | "attack"
  | "shuriken"
  | "pause";

const KEY_MAP: Record<string, Control[]> = {
  KeyA: ["left"],
  ArrowLeft: ["left"],
  KeyD: ["right"],
  ArrowRight: ["right"],
  KeyW: ["up", "jump"],
  ArrowUp: ["up", "jump"],
  KeyS: ["down"],
  ArrowDown: ["down"],
  Space: ["jump"],
  ShiftLeft: ["dash"],
  ShiftRight: ["dash"],
  KeyJ: ["attack"],
  KeyI: ["shuriken"],
  Escape: ["pause"],
};

const GAME_KEYS = new Set(Object.keys(KEY_MAP));

/**
 * Centralised keyboard (+ virtual touch buttons) input.
 * Held state is read by the simulation, one-shot presses are consumed by the
 * first fixed update after they happen so browser key repeat can never spam.
 */
export class InputManager {
  private down = new Set<Control>();
  private pressed = new Set<Control>();
  private codes = new Set<string>();
  private virtual = new Set<Control>();
  private enabled = true;
  private firstInteraction = false;
  private onFirstInteraction: (() => void) | null = null;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundBlur: () => void;

  constructor() {
    this.boundKeyDown = (event: KeyboardEvent) => this.handleKeyDown(event);
    this.boundKeyUp = (event: KeyboardEvent) => this.handleKeyUp(event);
    this.boundBlur = () => this.clear();
    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);
    window.addEventListener("blur", this.boundBlur);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.pressed.clear();
      this.down.clear();
    }
  }

  onInteraction(callback: () => void): void {
    this.onFirstInteraction = callback;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const controls = KEY_MAP[event.code];
    if (!controls) return;
    if (this.enabled) event.preventDefault();
    if (!this.firstInteraction) {
      this.firstInteraction = true;
      this.onFirstInteraction?.();
    }
    this.codes.add(event.code);
    if (event.repeat) return;
    for (const control of controls) {
      this.down.add(control);
      this.pressed.add(control);
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const controls = KEY_MAP[event.code];
    if (!controls) return;
    if (this.enabled && GAME_KEYS.has(event.code)) event.preventDefault();
    this.codes.delete(event.code);
    for (const control of controls) {
      let stillHeld = false;
      for (const code of this.codes) {
        if (KEY_MAP[code]?.includes(control)) {
          stillHeld = true;
          break;
        }
      }
      if (!stillHeld) this.down.delete(control);
    }
  }

  isDown(control: Control): boolean {
    return this.down.has(control) || this.virtual.has(control);
  }

  /** One-shot press; consumes the event. */
  consume(control: Control): boolean {
    if (!this.pressed.has(control)) return false;
    this.pressed.delete(control);
    return true;
  }

  peek(control: Control): boolean {
    return this.pressed.has(control);
  }

  moveAxis(): number {
    return (this.isDown("right") ? 1 : 0) - (this.isDown("left") ? 1 : 0);
  }

  clearPressed(): void {
    this.pressed.clear();
  }

  clear(): void {
    this.down.clear();
    this.pressed.clear();
    this.codes.clear();
    this.virtual.clear();
  }

  setVirtual(control: Control, isDown: boolean): void {
    if (isDown) {
      if (!this.virtual.has(control)) this.pressed.add(control);
      this.virtual.add(control);
      if (!this.firstInteraction) {
        this.firstInteraction = true;
        this.onFirstInteraction?.();
      }
    } else {
      this.virtual.delete(control);
    }
  }

  destroy(): void {
    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("keyup", this.boundKeyUp);
    window.removeEventListener("blur", this.boundBlur);
    this.clear();
  }
}
