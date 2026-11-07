import { COLORS, SHURIKEN_CFG } from "../GameConfig";
import { overlaps } from "../core/Collision";
import type { GameFx } from "../types";
import type { Level } from "../world/Level";

export interface Projectile {
  active: boolean;
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  life: number;
  rotation: number;
  hit: Set<number>;
}

export const PROJECTILE_SIZE = SHURIKEN_CFG.width;

function createProjectile(): Projectile {
  return {
    active: false,
    x: 0,
    y: 0,
    px: 0,
    py: 0,
    vx: 0,
    vy: 0,
    life: 0,
    rotation: 0,
    hit: new Set<number>(),
  };
}

export class ProjectileSystem {
  shurikens: Projectile[] = [];
  bolts: Projectile[] = [];
  private trailTimer = 0;

  constructor() {
    for (let i = 0; i < 16; i += 1) this.shurikens.push(createProjectile());
    for (let i = 0; i < 24; i += 1) this.bolts.push(createProjectile());
  }

  spawnShuriken(x: number, y: number, dir: number): void {
    const p = this.shurikens.find((item) => !item.active);
    if (!p) return;
    p.active = true;
    p.x = x;
    p.y = y;
    p.px = x;
    p.py = y;
    p.vx = dir * SHURIKEN_CFG.speed;
    p.vy = 0;
    p.life = SHURIKEN_CFG.lifetime;
    p.rotation = 0;
    p.hit.clear();
  }

  spawnBolt(x: number, y: number, dx: number, dy: number): void {
    const p = this.bolts.find((item) => !item.active);
    if (!p) return;
    p.active = true;
    p.x = x;
    p.y = y;
    p.px = x;
    p.py = y;
    p.vx = dx * 360;
    p.vy = dy * 360;
    p.life = 3;
    p.rotation = Math.atan2(dy, dx);
    p.hit.clear();
  }

  update(dt: number, level: Level, fx: GameFx): void {
    this.trailTimer -= dt;
    const emitTrail = this.trailTimer <= 0;
    if (emitTrail) this.trailTimer = 0.035;

    for (const p of this.shurikens) {
      if (!p.active) continue;
      p.px = p.x;
      p.py = p.y;
      p.life -= dt;
      p.rotation += dt * 26;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (emitTrail) {
        fx.particles.spawn(p.x, p.y, {
          vx: -p.vx * 0.06,
          vy: (Math.random() - 0.5) * 24,
          life: 0.16,
          size: 1.4,
          color: COLORS.cyan,
          kind: "glow",
        });
      }
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      const box = { x: p.x - 8, y: p.y - 8, w: 16, h: 16 };
      if (level.overlapsSolid(box)) {
        p.active = false;
        fx.particles.burst(p.x, p.y, 7, {
          speed: 170,
          life: 0.28,
          size: 1.7,
          color: COLORS.cyan,
          kind: "spark",
        });
        fx.audio.play("shurikenHit");
      }
    }

    for (const p of this.bolts) {
      if (!p.active) continue;
      p.px = p.x;
      p.py = p.y;
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation = Math.atan2(p.vy, p.vx);
      if (emitTrail) {
        fx.particles.spawn(p.x, p.y, {
          vx: -p.vx * 0.04,
          vy: -p.vy * 0.04,
          life: 0.2,
          size: 2,
          color: COLORS.crimson,
          kind: "glow",
        });
      }
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      const box = { x: p.x - 6, y: p.y - 6, w: 12, h: 12 };
      if (level.overlapsSolid(box)) {
        p.active = false;
        fx.particles.burst(p.x, p.y, 8, {
          speed: 160,
          life: 0.3,
          size: 1.8,
          color: COLORS.crimson,
          kind: "spark",
        });
      }
    }
  }

  projectileHitsEnemy(p: Projectile, enemy: { x: number; y: number; w: number; h: number }): boolean {
    return overlaps({ x: p.x - 8, y: p.y - 8, w: 16, h: 16 }, enemy);
  }

  clear(): void {
    for (const p of this.shurikens) p.active = false;
    for (const p of this.bolts) p.active = false;
  }
}
