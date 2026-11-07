/**
 * Central tuning table for SHADOW BLADE.
 * Every gameplay value lives here so the simulation stays free of magic numbers.
 */

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;
export const FIXED_STEP = 1 / 60;
export const MAX_PARTICLES = 900;

export const COLORS = {
  bg: "#080B14",
  navy: "#10172A",
  cyan: "#00E5FF",
  blue: "#246BFD",
  purple: "#8B5CF6",
  crimson: "#FF3155",
  green: "#39FF88",
  white: "#F4F7FF",
} as const;

export type GameStatus = "playing" | "paused" | "gameover" | "victory";

export type PlayerState =
  | "IDLE"
  | "RUNNING"
  | "JUMPING"
  | "FALLING"
  | "DOUBLE_JUMPING"
  | "WALL_SLIDING"
  | "WALL_JUMPING"
  | "DASHING"
  | "ATTACKING"
  | "TAKING_DAMAGE"
  | "DYING"
  | "RESPAWNING";

export interface AttackDef {
  name: string;
  duration: number;
  activeStart: number;
  activeEnd: number;
  damage: number;
  reach: number;
  height: number;
  yOffset: number;
  knockback: number;
  shake: number;
  hitStop: number;
  arcSweep: number;
}

export const PLAYER_CFG = {
  width: 26,
  height: 54,
  maxSpeed: 300,
  groundAccel: 2400,
  airAccel: 1850,
  groundFriction: 2600,
  airDrag: 340,
  gravity: 1800,
  maxFall: 1000,
  jumpVelocity: -620,
  doubleJumpVelocity: -560,
  jumpCutMultiplier: 0.42,
  coyoteTime: 0.1,
  jumpBuffer: 0.12,
  dashSpeed: 880,
  dashDuration: 0.2,
  dashCooldown: 1.2,
  wallSlideSpeed: 150,
  wallJumpX: 430,
  wallJumpY: -600,
  wallJumpLock: 0.17,
  maxHp: 100,
  invulnTime: 1.05,
  shurikenMax: 5,
  shurikenRegen: 2.6,
  attackMoveFactor: 0.6,
  respawnTime: 0.75,
} as const;

export const ATTACKS: AttackDef[] = [
  {
    name: "RISING CUT",
    duration: 0.3,
    activeStart: 0.065,
    activeEnd: 0.155,
    damage: 25,
    reach: 92,
    height: 58,
    yOffset: 4,
    knockback: 240,
    shake: 4.5,
    hitStop: 0.055,
    arcSweep: 2.1,
  },
  {
    name: "ASCENDING FANG",
    duration: 0.32,
    activeStart: 0.08,
    activeEnd: 0.18,
    damage: 25,
    reach: 88,
    height: 78,
    yOffset: -16,
    knockback: 210,
    shake: 5,
    hitStop: 0.06,
    arcSweep: 2.4,
  },
  {
    name: "CRIMSON TEMPEST",
    duration: 0.46,
    activeStart: 0.12,
    activeEnd: 0.26,
    damage: 40,
    reach: 124,
    height: 108,
    yOffset: -20,
    knockback: 420,
    shake: 8.5,
    hitStop: 0.1,
    arcSweep: Math.PI * 2.2,
  },
];

export const COMBO_WINDOW = 0.5;
export const CRIT_CHANCE = 0.16;
export const CRIT_MULTIPLIER = 1.8;

export const GUARD_CFG = {
  width: 38,
  height: 62,
  hp: 80,
  patrolSpeed: 92,
  chaseSpeed: 158,
  visionRange: 340,
  visionHalfAngle: 0.52,
  alertTime: 0.45,
  attackRange: 66,
  attackDamage: 14,
  attackWindup: 0.34,
  attackActive: 0.14,
  attackRecovery: 0.5,
  attackCooldown: 1.15,
  stunTime: 0.24,
  loseSightTime: 2.4,
  searchTime: 2.2,
  score: 150,
  gravity: 1800,
  maxFall: 900,
} as const;

export const DRONE_CFG = {
  width: 46,
  height: 32,
  hp: 55,
  patrolSpeed: 120,
  detectRange: 470,
  attackRange: 360,
  preferredDistance: 235,
  boltSpeed: 360,
  boltDamage: 12,
  telegraph: 0.42,
  fireCooldown: 1.9,
  score: 200,
  repositionInterval: 2.4,
} as const;

export const HAZARD_CFG = {
  damage: 20,
  laserCycle: 2.6,
  laserOnTime: 1.5,
} as const;

export const SHURIKEN_CFG = {
  damage: 20,
  speed: 760,
  cooldown: 0.26,
  lifetime: 1.2,
  width: 16,
  height: 16,
} as const;

export const SCORE = {
  guard: GUARD_CFG.score,
  drone: DRONE_CFG.score,
  levelClear: 1000,
} as const;

export interface HudSnapshot {
  hp: number;
  maxHp: number;
  score: number;
  kills: number;
  totalEnemies: number;
  dashCharge: number;
  dashActive: boolean;
  shurikens: number;
  maxShurikens: number;
  comboStep: number;
  state: string;
  status: GameStatus;
  exitUnlocked: boolean;
  fps: number;
  elapsed: number;
  message: string;
}

export interface GameSettings {
  masterVolume: number;
  sfxVolume: number;
  showFps: boolean;
  screenShake: boolean;
  muted: boolean;
}

/** Tunable easing helpers shared by simulation + renderer. */
export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function moveTowards(current: number, target: number, maxDelta: number): number {
  if (Math.abs(target - current) <= maxDelta) return target;
  return current + Math.sign(target - current) * maxDelta;
}

export function damp(current: number, target: number, smoothing: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-smoothing * dt));
}
