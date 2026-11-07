import type { Box } from "../core/Collision";
import type { GameFx } from "../types";
import type { Level } from "../world/Level";
import type { Player } from "./Player";

export type EnemyKind = "guard" | "drone";

export interface EnemyContext {
  player: Player;
  level: Level;
  fx: GameFx;
  time: number;
  spawnBolt: (x: number, y: number, dx: number, dy: number) => void;
  onAlert: (x: number, y: number) => void;
}

export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  w: number;
  h: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  score: number;
  facing: number;
  dead: boolean;
  gone: boolean;
  deathTimer: number;
  hitFlash: number;
  attackConnected: boolean;
  update: (dt: number, ctx: EnemyContext) => void;
  takeDamage: (amount: number, dirX: number, crit: boolean, ctx: EnemyContext) => void;
  getAttackHitbox: () => Box | null;
  markAttackConnected: () => void;
}

export function attackBox(
  x: number,
  y: number,
  w: number,
  h: number,
  facing: number,
): Box {
  return {
    x: facing > 0 ? x + w : x - 44,
    y: y + 4,
    w: 44,
    h: h - 8,
  };
}
