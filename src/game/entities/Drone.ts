import { COLORS, DRONE_CFG } from "../GameConfig";
import type { Box } from "../core/Collision";
import type { Level } from "../world/Level";
import type { Enemy, EnemyContext } from "./Enemy";

export type DroneState = "HOVER" | "PATROL" | "DETECT" | "ATTACK" | "EVADE" | "DESTROYED";

export class Drone implements Enemy {
  readonly kind = "drone" as const;
  id: number;
  x: number;
  y: number;
  w = DRONE_CFG.width;
  h = DRONE_CFG.height;
  px: number;
  py: number;
  vx = 0;
  vy = 0;
  hp: number = DRONE_CFG.hp;
  maxHp: number = DRONE_CFG.hp;
  score = DRONE_CFG.score;
  facing = -1;
  dead = false;
  gone = false;
  deathTimer = 0;
  hitFlash = 0;
  state: DroneState = "PATROL";
  attackConnected = false;
  patrolMin: number;
  patrolMax: number;
  baseX: number;
  baseY: number;
  phase: number;
  charge = 0;
  aimAngle = 0;
  private fireCooldown = 0.8;
  private detectTimer = 0;
  private patrolDir = 1;
  private reposition = 2;
  private level: Level;

  constructor(
    id: number,
    x: number,
    y: number,
    minX: number,
    maxX: number,
    level: Level,
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;
    this.baseX = x;
    this.baseY = y;
    this.patrolMin = minX;
    this.patrolMax = maxX;
    this.phase = Math.random() * Math.PI * 2;
    this.level = level;
    this.facing = Math.random() < 0.5 ? -1 : 1;
  }

  getAttackHitbox(): Box | null {
    return null;
  }

  markAttackConnected(): void {
    this.attackConnected = true;
  }

  update(dt: number, ctx: EnemyContext): void {
    this.px = this.x;
    this.py = this.y;
    this.hitFlash = Math.max(0, this.hitFlash - dt * 3.2);

    if (this.dead) {
      this.state = "DESTROYED";
      this.deathTimer += dt;
      this.vy += 420 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= Math.max(0, 1 - dt * 2);
      if (this.deathTimer > 1) this.gone = true;
      return;
    }

    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.detectTimer = Math.max(0, this.detectTimer - dt);
    this.reposition -= dt;

    const player = ctx.player;
    const playerAlive = player.state !== "DYING" && player.hp > 0;
    const dx = player.centerX - (this.x + this.w / 2);
    const dy = player.centerY - (this.y + this.h / 2);
    const dist = Math.hypot(dx, dy);

    const detected =
      playerAlive && dist < DRONE_CFG.detectRange && this.level.lineOfSight(
        this.x + this.w / 2,
        this.y + this.h / 2,
        player.centerX,
        player.centerY,
      );

    if (detected) this.facing = dx > 0 ? 1 : -1;

    // Movement
    if (detected) {
      if (dist < 95) {
        this.state = "EVADE";
        const away = dist > 0.001 ? -Math.sign(dx) : 1;
        this.vx += away * 900 * dt;
        this.vy += (dy < 0 ? 190 : -190) * dt;
      } else if (this.state !== "ATTACK" || this.fireCooldown <= 0.25) {
        this.state = dist < DRONE_CFG.attackRange ? "ATTACK" : "DETECT";
        const desiredX = player.centerX - this.facing * DRONE_CFG.preferredDistance;
        const diff = desiredX - (this.x + this.w / 2);
        this.vx += Math.sign(diff) * Math.min(420, Math.abs(diff) * 4) * dt;
        // Hover just above head height so melee and thrown blades can connect.
        const desiredY = player.centerY - 70 + Math.sin(ctx.time * 1.4 + this.phase) * 18;
        this.vy += Math.sign(desiredY - this.y) * Math.min(240, Math.abs(desiredY - this.y) * 3) * dt;
      } else {
        this.state = "ATTACK";
        this.vx *= Math.max(0, 1 - dt * 5);
        this.vy *= Math.max(0, 1 - dt * 5);
      }

      const inRange = dist < DRONE_CFG.attackRange;
      if (inRange && this.fireCooldown <= 0) {
        this.charge += dt;
        this.aimAngle = Math.atan2(dy, dx);
        if (this.charge >= DRONE_CFG.telegraph) {
          const length = Math.max(0.001, dist);
          ctx.spawnBolt(
            this.x + this.w / 2 + (dx / length) * 24,
            this.y + this.h / 2 + 6 + (dy / length) * 12,
            dx / length,
            dy / length,
          );
          ctx.fx.audio.play("enemyAttack");
          ctx.fx.particles.burst(
            this.x + this.w / 2 + (dx / length) * 24,
            this.y + this.h / 2 + 6,
            8,
            {
              angle: Math.atan2(dy, dx),
              spread: 0.8,
              speed: 150,
              life: 0.28,
              size: 2,
              color: COLORS.crimson,
            },
          );
          this.charge = 0;
          this.fireCooldown = DRONE_CFG.fireCooldown;
          this.reposition = 0;
        }
      } else {
        this.charge = Math.max(0, this.charge - dt);
      }
    } else {
      this.state = "PATROL";
      this.charge = Math.max(0, this.charge - dt);
      if (this.x < this.patrolMin) this.patrolDir = 1;
      else if (this.x + this.w > this.patrolMax) this.patrolDir = -1;
      this.vx += this.patrolDir * 260 * dt;
      this.facing = this.patrolDir;
    }

    // Drag + speed limits
    this.vx *= Math.max(0, 1 - dt * 1.8);
    this.vy *= Math.max(0, 1 - dt * 2.1);
    const maxSpeed = detected ? 220 : DRONE_CFG.patrolSpeed;
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Hover bob keeps drones feeling alive.
    this.y += Math.sin(ctx.time * 2.2 + this.phase) * 16 * dt;

    // Stay inside patrol region and camera-visible band.
    if (this.x < this.patrolMin) {
      this.x = this.patrolMin;
      this.vx = Math.abs(this.vx) * 0.4;
    }
    if (this.x + this.w > this.patrolMax) {
      this.x = this.patrolMax - this.w;
      this.vx = -Math.abs(this.vx) * 0.4;
    }
    this.y = Math.min(Math.max(this.y, 70), this.level.height - 260);
  }

  takeDamage(amount: number, dirX: number, crit: boolean, ctx: EnemyContext): void {
    if (this.dead) return;
    this.hp -= amount;
    this.hitFlash = 1;
    this.vx = dirX * (crit ? 300 : 190);
    this.vy = -40;
    this.charge = 0;
    this.fireCooldown = Math.max(this.fireCooldown, 0.35);
    ctx.fx.audio.play(crit ? "crit" : "hit");
    ctx.fx.particles.burst(this.x + this.w / 2, this.y + this.h / 2, crit ? 16 : 9, {
      angle: dirX > 0 ? 0 : Math.PI,
      spread: 1.6,
      speed: crit ? 300 : 200,
      life: 0.4,
      size: 2.2,
      color: crit ? COLORS.crimson : COLORS.cyan,
      kind: "spark",
      drag: 2,
    });
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.state = "DESTROYED";
      this.deathTimer = 0;
      this.vx = dirX * 150;
      this.vy = -70;
      ctx.fx.audio.play("enemyDeath");
      ctx.fx.shake(5);
      ctx.fx.particles.ring(this.x + this.w / 2, this.y + this.h / 2, 90, "rgba(255,49,85,0.8)", 0.5, 3);
      ctx.fx.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 24, {
        speed: 280,
        life: 0.9,
        size: 3,
        color: Math.random() < 0.5 ? COLORS.crimson : "#FFB36B",
        kind: "glow",
        drag: 1.8,
      });
      ctx.fx.texts.add(this.x + this.w / 2, this.y - 10, "DESTROYED", COLORS.green, 12);
    }
  }
}
